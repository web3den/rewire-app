// ============================================================
// Notification Send (Background Job)
// Triggered by pg_cron every hour at :00
//
// Hourly notification eligibility check + APNs send.
// Notification types:
// - morning_quest: Daily quest reminder at user's preferred time
// - gentle_nudge: 6 hours after morning if no quest started
// - evening_reflection: If user completed quests but hasn't reflected
// - streak_alert: When streak is at risk
// - re_engagement: 48h and 5d absence notifications
// - story_beat: Monday/Wednesday/Sunday narrative beats
//
// Respects: quiet hours, max 2/day, rest mode, absence ladder (silence after 7 days)
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { sendAPNs } from "../_shared/apns-client.ts";

serve(async (req: Request) => {
  try {
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceKey ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const now = new Date();
    const currentHour = now.getUTCHours();

    // Step 1: Get eligible users via a database function
    // TODO: Create get_notification_eligible_users postgres function that handles:
    // - Timezone-aware quiet hours check
    // - Max 2 notifications in last 24h
    // - No notification within 2h of last dismissed
    // - Rest mode check
    // - Absence ladder state
    // - Join with user_devices for active device tokens

    // Step 2: For each eligible user, determine notification type
    // TODO: Implement determineNotificationType logic:
    // - Check days since last quest
    // - Check if morning/evening notification is due
    // - Check for story beat days (Mon/Wed/Sun)
    // - Apply absence ladder (silence after 7 days)

    // Step 3: Select notification copy
    // TODO: Select from pre-written templates based on:
    // - Notification type
    // - User's archetype
    // - Kael's voice register

    // Step 4: Send via APNs
    // TODO: Loop through eligible users and send notifications

    // Step 5: Log sent notifications
    // TODO: Insert into notification_log

    console.log(`[notification-send] Running for hour ${currentHour} UTC`);

    return new Response(
      JSON.stringify({ sent: 0, hour: currentHour }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("notification-send error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
