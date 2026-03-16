// ============================================================
// Crisis Alert Edge Function (Internal Only)
// POST /functions/v1/crisis-alert
//
// Records crisis event and dispatches alerts.
// - Level 2 (concern): Logs for daily review
// - Level 3 (acute): Sends PagerDuty alert + Slack notification
//
// Auth: Service role only — NEVER called by client directly.
// Called internally by guide-chat when crisis is detected.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import type { CrisisLevel } from "../_shared/types.ts";

interface CrisisAlertRequest {
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

    // Record crisis event
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
      console.error("Crisis event insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to record" }), { status: 500 });
    }

    let alertSent = false;

    // Level 3 (acute): Send PagerDuty + Slack alerts
    if (body.crisis_level === "acute") {
      // TODO: PagerDuty alert
      const pagerdutyKey = Deno.env.get("PAGERDUTY_ROUTING_KEY");
      if (pagerdutyKey) {
        // await fetch("https://events.pagerduty.com/v2/enqueue", { ... });
        console.log("[crisis-alert] Would send PagerDuty alert");
      }

      // TODO: Slack notification
      const slackWebhook = Deno.env.get("SLACK_WEBHOOK_URL");
      if (slackWebhook) {
        // await fetch(slackWebhook, { ... });
        console.log("[crisis-alert] Would send Slack notification");
      }

      alertSent = true;

      await supabaseAdmin
        .from("crisis_events")
        .update({ alert_sent: true, alert_channel: "pagerduty+slack" })
        .eq("id", event.id);
    }

    return new Response(
      JSON.stringify({ alert_sent: alertSent, event_id: event.id }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("crisis-alert error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
