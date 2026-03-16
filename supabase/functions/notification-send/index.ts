// ============================================================
// Notification Send (Background Job)
// Triggered by pg_cron every hour at :00
//
// v1 notification types:
// 1. morning_quest: Daily quest reminder when it's 8-9am in user's timezone
// 2. re_engagement: 48h absence gentle nudge (Kael voice)
//
// Respects: rest_mode, quiet hours, max 2 notifications/day
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { sendAPNs } from "../_shared/apns-client.ts";
import type { NotificationType } from "../_shared/types.ts";

// Kael-voice notification templates
const MORNING_QUEST_MESSAGES = [
  "A new day unfolds across the clearing. Your quests await, Traveler.",
  "The compass stirs. Three paths lie open — which will you walk today?",
  "Dawn breaks at the edge of the fog. Your quests are ready.",
  "The embers of yesterday have cooled. New flames await your spark.",
];

const ABSENCE_48H_MESSAGES = [
  "The fog holds at the ridge. When you are ready, I will be here.",
  "The clearing is quiet, but the compass still glows. No rush, Traveler.",
  "Two days of stillness. The path remains — it does not forget you.",
  "I have kept watch. Your quests wait with patient fire.",
];

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

interface EligibleUser {
  user_id: string;
  device_token: string;
  timezone: string;
  display_name: string;
}

serve(async (req: Request) => {
  try {
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceKey ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    let totalSent = 0;

    // ── Morning Quest Notifications ──────────────────────────
    // Find users where it's currently 8-9am local time
    const morningCount = await sendMorningQuestNotifications(now, currentHourUTC);
    totalSent += morningCount;

    // ── 48h Absence Re-engagement ────────────────────────────
    const absenceCount = await sendAbsenceNotifications(now);
    totalSent += absenceCount;

    console.log(`[notification-send] Completed: ${totalSent} notifications sent (hour ${currentHourUTC} UTC)`);

    return new Response(
      JSON.stringify({ sent: totalSent, hour: currentHourUTC, breakdown: { morning_quest: morningCount, re_engagement: absenceCount } }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[notification-send] error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

// Send morning quest reminders to users where it's 8-9am local
async function sendMorningQuestNotifications(now: Date, currentHourUTC: number): Promise<number> {
  // Calculate which UTC offsets correspond to 8am local time right now
  // If it's 14:00 UTC, offset +6 means local time is 20:00, offset -6 means 08:00
  // Target local hour = 8, so offset = -(currentHourUTC - 8) = 8 - currentHourUTC
  // We need timezones where currentHourUTC + offset = 8
  // So offset = 8 - currentHourUTC (handling wrap-around)
  const targetOffset = 8 - currentHourUTC;

  // Query users with active devices whose timezone matches morning window
  // We store timezone as IANA (e.g., "America/New_York") so we check offset ranges
  const { data: users, error } = await supabaseAdmin
    .rpc("get_morning_notification_users", { target_hour: 8, current_utc_hour: currentHourUTC })
    .limit(500);

  // Fallback: if the RPC doesn't exist yet, query directly
  let eligibleUsers: EligibleUser[] = [];

  if (error || !users) {
    console.log("[notification-send] RPC not available, using direct query");

    // Get users with devices who are not in rest_mode and have notifications enabled
    const { data: rawUsers, error: queryError } = await supabaseAdmin
      .from("user_profiles")
      .select(`
        id,
        display_name,
        timezone,
        rest_mode,
        user_devices!inner(device_token, is_active),
        notification_preferences!inner(notifications_enabled, quiet_hours_start, quiet_hours_end)
      `)
      .eq("rest_mode", false)
      .eq("user_devices.is_active", true)
      .eq("notification_preferences.notifications_enabled", true)
      .limit(500);

    if (queryError || !rawUsers) {
      console.error("[notification-send] Morning query error:", queryError);
      return 0;
    }

    // Filter by timezone — check if it's 8-9am in user's timezone
    for (const user of rawUsers) {
      const userLocalHour = getLocalHour(now, user.timezone);
      if (userLocalHour !== null && userLocalHour >= 8 && userLocalHour < 9) {
        // Check quiet hours
        const prefs = Array.isArray(user.notification_preferences)
          ? user.notification_preferences[0]
          : user.notification_preferences;
        if (prefs && isInQuietHours(userLocalHour, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
          continue;
        }

        const devices = Array.isArray(user.user_devices) ? user.user_devices : [user.user_devices];
        for (const device of devices) {
          if (device.device_token && device.is_active) {
            eligibleUsers.push({
              user_id: user.id,
              device_token: device.device_token,
              timezone: user.timezone,
              display_name: user.display_name,
            });
          }
        }
      }
    }
  } else {
    eligibleUsers = users as EligibleUser[];
  }

  // Check daily notification limit (max 2/day) and send
  let sent = 0;
  for (const user of eligibleUsers) {
    if (await hasReachedDailyLimit(user.user_id, now)) continue;

    const message = pickRandom(MORNING_QUEST_MESSAGES);
    const success = await sendAPNs(user.device_token, {
      title: "Your Quests Await",
      body: message,
      sound: "default",
    });

    if (success) {
      await logNotification(user.user_id, "morning_quest", message);
      sent++;
    }
  }

  console.log(`[notification-send] Morning quest: ${sent}/${eligibleUsers.length} sent`);
  return sent;
}

// Send 48h absence re-engagement notifications
async function sendAbsenceNotifications(now: Date): Promise<number> {
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  // Find users with no quest completion in 48h, not in rest_mode
  // But only those who have completed at least one quest ever (not brand new users)
  // and whose last completion was between 48h and 5d ago (silence after 5d for v1)
  const { data: absentUsers, error } = await supabaseAdmin
    .from("user_profiles")
    .select(`
      id,
      display_name,
      timezone,
      rest_mode,
      user_devices!inner(device_token, is_active),
      notification_preferences!inner(notifications_enabled),
      user_stats!inner(last_quest_completed_at)
    `)
    .eq("rest_mode", false)
    .eq("user_devices.is_active", true)
    .eq("notification_preferences.notifications_enabled", true)
    .lt("user_stats.last_quest_completed_at", fortyEightHoursAgo)
    .gt("user_stats.last_quest_completed_at", fiveDaysAgo)
    .limit(500);

  if (error || !absentUsers) {
    console.error("[notification-send] Absence query error:", error);
    return 0;
  }

  // Deduplicate: only send one absence notification per user per 48h window
  let sent = 0;
  for (const user of absentUsers) {
    if (await hasReachedDailyLimit(user.id, now)) continue;
    if (await hasRecentNotification(user.id, "re_engagement", 48)) continue;

    const userLocalHour = getLocalHour(now, user.timezone);
    // Only send during reasonable hours (9am-8pm local)
    if (userLocalHour !== null && (userLocalHour < 9 || userLocalHour >= 20)) continue;

    const devices = Array.isArray(user.user_devices) ? user.user_devices : [user.user_devices];
    const device = devices.find((d: { device_token: string; is_active: boolean }) => d.is_active && d.device_token);
    if (!device) continue;

    const message = pickRandom(ABSENCE_48H_MESSAGES);
    const success = await sendAPNs(device.device_token, {
      title: "The Clearing Awaits",
      body: message,
      sound: "default",
    });

    if (success) {
      await logNotification(user.id, "re_engagement", message);
      sent++;
    }
  }

  console.log(`[notification-send] Re-engagement: ${sent}/${absentUsers.length} sent`);
  return sent;
}

// Get local hour for a timezone, returns null if timezone is invalid
function getLocalHour(now: Date, timezone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return null;
  }
}

// Check if current hour falls within quiet hours
function isInQuietHours(localHour: number, start: number | null, end: number | null): boolean {
  if (start === null || end === null) return false;
  if (start <= end) {
    return localHour >= start && localHour < end;
  }
  // Wraps midnight (e.g., 22:00 - 07:00)
  return localHour >= start || localHour < end;
}

// Check if user has already received 2+ notifications today
async function hasReachedDailyLimit(userId: string, now: Date): Promise<boolean> {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("sent_at", startOfDay.toISOString());

  if (error) return true; // err on the side of not spamming
  return (count ?? 0) >= 2;
}

// Check if a specific notification type was sent within N hours
async function hasRecentNotification(userId: string, type: NotificationType, hours: number): Promise<boolean> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("notification_type", type)
    .gte("sent_at", since);

  if (error) return true;
  return (count ?? 0) > 0;
}

// Log a sent notification
async function logNotification(userId: string, type: NotificationType, body: string): Promise<void> {
  try {
    await supabaseAdmin.from("notification_log").insert({
      user_id: userId,
      notification_type: type,
      body,
      sent_at: new Date().toISOString(),
      delivered: true,
    });
  } catch (err) {
    console.error("[notification-send] Failed to log notification:", err);
  }
}
