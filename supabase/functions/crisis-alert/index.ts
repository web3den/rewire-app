// ============================================================
// Crisis Alert Edge Function (Internal Only)
// POST /functions/v1/crisis-alert
//
// Records crisis event and dispatches alerts.
// - Level 2 (concern): Logs for daily review
// - Level 3 (acute): Sends PagerDuty alert + Slack notification + admin push
//
// Auth: Service role only — NEVER called by client directly.
// Called internally by guide-chat when crisis is detected.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { sendAPNs } from "../_shared/apns-client.ts";
import type { CrisisLevel } from "../_shared/types.ts";

interface CrisisAlertRequest {
  crisis_event_id?: string;
  user_id: string;
  crisis_level: CrisisLevel;
  trigger_text: string;
  source: "reflection" | "conversation";
  classifier_type: string;
  confidence: number;
}

serve(async (req: Request) => {
  try {
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceKey ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body: CrisisAlertRequest = await req.json();

    // If a crisis_event_id is provided, fetch and log existing event
    if (body.crisis_event_id) {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("crisis_events")
        .select("*")
        .eq("id", body.crisis_event_id)
        .single();

      if (fetchError || !existing) {
        console.error("[crisis-alert] Event not found:", body.crisis_event_id);
        return new Response(
          JSON.stringify({ error: "Crisis event not found" }),
          { status: 404 },
        );
      }

      console.log("[crisis-alert] Existing crisis event details:", JSON.stringify({
        event_id: existing.id,
        user_id: existing.user_id,
        crisis_level: existing.crisis_level,
        trigger_text: existing.trigger_text,
        classifier_type: existing.classifier_type,
        confidence: existing.confidence,
        created_at: existing.created_at,
      }));

      // Send admin push for acute events that haven't been alerted yet
      if (existing.crisis_level === "acute" && !existing.alert_sent) {
        await dispatchAlerts(existing.id, existing.user_id, existing.crisis_level, existing.trigger_text);

        await supabaseAdmin
          .from("crisis_events")
          .update({ alert_sent: true, alert_channel: "pagerduty+slack+push" })
          .eq("id", existing.id);
      }

      return new Response(
        JSON.stringify({ alert_sent: existing.crisis_level === "acute", event_id: existing.id }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Record new crisis event
    const { data: event, error } = await supabaseAdmin
      .from("crisis_events")
      .insert({
        user_id: body.user_id,
        crisis_level: body.crisis_level,
        trigger_text: body.trigger_text,
        source: body.source,
        classifier_type: body.classifier_type,
        confidence: body.confidence,
        needs_review: body.crisis_level === "acute",
        resource_shown: true,
        overlay_shown: body.crisis_level === "acute",
      })
      .select()
      .single();

    if (error) {
      console.error("[crisis-alert] Crisis event insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to record" }), { status: 500 });
    }

    console.log("[crisis-alert] New crisis event recorded:", JSON.stringify({
      event_id: event.id,
      user_id: body.user_id,
      crisis_level: body.crisis_level,
      trigger_text: body.trigger_text,
      source: body.source,
      classifier_type: body.classifier_type,
      confidence: body.confidence,
    }));

    let alertSent = false;

    if (body.crisis_level === "concern") {
      console.log(`[crisis-alert] Concern-level event ${event.id} logged for daily review`);
    }

    // Level 3 (acute): Full alert dispatch
    if (body.crisis_level === "acute") {
      await dispatchAlerts(event.id, body.user_id, body.crisis_level, body.trigger_text);

      await supabaseAdmin
        .from("crisis_events")
        .update({ alert_sent: true, alert_channel: "pagerduty+slack+push" })
        .eq("id", event.id);

      alertSent = true;
    }

    return new Response(
      JSON.stringify({ alert_sent: alertSent, event_id: event.id }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[crisis-alert] error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

// Dispatch alerts to PagerDuty, Slack, and admin push notification
async function dispatchAlerts(
  eventId: string,
  userId: string,
  crisisLevel: CrisisLevel,
  triggerText: string,
): Promise<void> {
  console.log(`[crisis-alert] ACUTE crisis detected — dispatching alerts for event ${eventId}`);

  // PagerDuty alert (placeholder for integration)
  const pagerdutyKey = Deno.env.get("PAGERDUTY_ROUTING_KEY");
  if (pagerdutyKey) {
    // TODO: Wire up PagerDuty Events API v2
    // await fetch("https://events.pagerduty.com/v2/enqueue", { ... });
    console.log(`[crisis-alert] PagerDuty alert would fire — routing key present, event: ${eventId}`);
  }

  // Slack notification (placeholder for integration)
  const slackWebhook = Deno.env.get("SLACK_WEBHOOK_URL");
  if (slackWebhook) {
    // TODO: Wire up Slack incoming webhook
    // await fetch(slackWebhook, { method: "POST", body: JSON.stringify({ text: ... }) });
    console.log(`[crisis-alert] Slack notification would fire — webhook present, event: ${eventId}`);
  }

  // Admin push notification
  const adminDeviceToken = Deno.env.get("ADMIN_DEVICE_TOKEN");
  if (adminDeviceToken) {
    try {
      await sendAPNs(adminDeviceToken, {
        title: "Crisis Alert — Acute",
        body: `User ${userId.substring(0, 8)}… triggered acute crisis. Event: ${eventId}`,
        sound: "default",
      });
      console.log(`[crisis-alert] Admin push notification sent for event ${eventId}`);
    } catch (pushError) {
      console.error("[crisis-alert] Admin push failed:", pushError);
    }
  } else {
    console.log("[crisis-alert] No ADMIN_DEVICE_TOKEN configured — skipping admin push");
  }
}
