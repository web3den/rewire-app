import React from 'react';
import { Stack } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { colors } from '@/lib/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg.primary },
        headerLeft: () => <BackButton />,
        headerTintColor: colors.gold.DEFAULT,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'fade',
      }}
    />
  );
}
