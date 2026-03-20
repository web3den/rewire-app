import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/lib/theme';

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

  useEffect(() => {
    initialize();
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
