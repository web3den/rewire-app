/**
 * WP7: Rewire Notification Service
 *
 * Handles:
 * - Permission request (Kael-voiced, called from First Light)
 * - Daily 9 AM quest reminder (local, scheduled)
 * - Streak milestone celebrations (3, 7, 14, 30 days)
 * - Push token registration for future server-initiated notifications
 * - Offline-safe: local notifications survive offline sessions
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Notification handler (foreground) ───────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Dialogue pools (from KAEL-DIALOGUE-POOLS.md) ────────────────────────────

const MORNING_MESSAGES = [
  {
    title: 'Your quests are ready',
    body: "You've got fire today. There's something waiting for you that knows how to use it.",
  },
  {
    title: 'The fog has something for you',
    body: 'The fog is quiet this morning. But your streak is still holding. Let\'s keep it gentle.',
  },
  {
    title: 'Your map is waiting',
    body: "You came back yesterday. Today feels a little lighter. There's something waiting that fits.",
  },
  {
    title: 'Your quests are ready',
    body: 'The fog has something for you this morning. Your quests are ready.',
  },
  {
    title: '3 challenges await',
    body: "The fog remembers what you did. Today is a new patch of it — and there's something here that fits.",
  },
  {
    title: 'Ready when you are',
    body: "Kael's here. Your quests are set. Whenever you want to begin.",
  },
];

const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  3: {
    title: "3-day streak 🔥",
    body: "Three days on the map. Most people quit before this. You're still here. I'm noticing.",
  },
  7: {
    title: "A week in 🌟",
    body: "A week. You've walked the fog for seven days. Look at your map — look at what's revealed. That's yours.",
  },
  14: {
    title: "Two weeks 💫",
    body: "Two weeks. This isn't novelty anymore. This is a choice you're making every day. Watch what that builds.",
  },
  30: {
    title: "A month 🏔️",
    body: "A month. The person who opened this app on Day 1 and the person opening it now — they're different. What changed?",
  },
};

// Milestone days to celebrate
const MILESTONE_DAYS = [3, 7, 14, 30];

// ─── Permission request ───────────────────────────────────────────────────────

/**
 * Request notification permissions with Kael's voice.
 * Returns true if granted. Call from First Light onboarding step.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rewire-default', {
      name: 'Rewire',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C6AF7',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Push token ───────────────────────────────────────────────────────────────

/**
 * Get Expo push token for server-initiated notifications (Phase 2).
 * Returns null if permissions not granted or on simulator.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch (e) {
    console.warn('notifications/getExpoPushToken:', e);
    return null;
  }
}

// ─── Daily morning reminder ───────────────────────────────────────────────────

/** Identifier for the daily morning notification */
const DAILY_REMINDER_ID = 'rewire-daily-morning';

/**
 * Schedule (or reschedule) the daily 9 AM quest reminder.
 * Safe to call multiple times — cancels previous before scheduling.
 * Call after onboarding + whenever user returns from dormancy.
 */
export async function scheduleDailyReminder(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel existing to avoid duplicates
  await cancelDailyReminder();

  const message = MORNING_MESSAGES[Math.floor(Math.random() * MORNING_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: message.title,
      body: message.body,
      data: { type: 'daily_reminder', navigate: '/(app)/(tabs)/quests' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

/** Cancel the daily reminder (e.g. user disables notifications in settings). */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
}

// ─── Streak milestone notifications ──────────────────────────────────────────

/**
 * Fire a one-time streak milestone notification if this streak day is special.
 * Call immediately after a quest completion with the new streak count.
 * Silent no-op if not a milestone day or permissions denied.
 */
export async function maybeFireStreakMilestone(streakDays: number): Promise<void> {
  if (!MILESTONE_DAYS.includes(streakDays)) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const message = MILESTONE_MESSAGES[streakDays];
  if (!message) return;

  // Deduplicate: don't fire the same milestone twice
  const identifier = `rewire-milestone-${streakDays}`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: message.title,
      body: message.body,
      data: {
        type: 'streak_milestone',
        streak_days: streakDays,
        navigate: '/(app)/(tabs)/map',
      },
      sound: false,
    },
    trigger: null, // fire immediately
  });
}

// ─── Deep link handler ────────────────────────────────────────────────────────

/**
 * Extract the navigation target from a notification response.
 * Pair with expo-router's useRouter in your root layout:
 *
 *   const router = useRouter();
 *   useEffect(() => {
 *     const sub = Notifications.addNotificationResponseReceivedListener((res) => {
 *       const route = getNotificationRoute(res);
 *       if (route) router.push(route as any);
 *     });
 *     return () => sub.remove();
 *   }, []);
 */
export function getNotificationRoute(
  response: Notifications.NotificationResponse,
): string | null {
  const data = response.notification.request.content.data as Record<string, unknown>;
  return (data?.navigate as string) ?? null;
}
