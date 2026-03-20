import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/lib/theme';

export default function Index() {
  const router = useRouter();
  const { session, profile, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;

    if (!session) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (!profile || !profile.onboarding_completed) {
      router.replace('/(onboarding)/prologue');
      return;
    }

    router.replace('/(app)/(tabs)/quests');
  }, [initialized, session, profile, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
});
