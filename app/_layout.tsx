import React, { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/lib/theme';
import {
  scheduleDailyReminder,
  getNotificationRoute,
} from '@/lib/notifications';

// Suppress noisy error toasts in dev — errors still log to console
LogBox.ignoreLogs([
  'guide/sendMessage',
  'FunctionsHttpError',
  'FunctionsRelayError',
  'auth/fetchProfile',
  'quests/autoAssign',
  'quests/fetchDailyQuests',
]);

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const router = useRouter();
  const notifListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initialize();

    // Schedule daily 9 AM reminder (no-op if permission not granted yet)
    scheduleDailyReminder();

    // Handle tap on notification → deep link
    notifListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = getNotificationRoute(response);
      if (route) {
        // Small delay to ensure navigator is mounted
        setTimeout(() => {
          router.push(route as any);
        }, 500);
      }
    });

    return () => {
      notifListenerRef.current?.remove();
    };
  }, [initialize]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: 'fade',
        }}
      />
    </>
  );
}
