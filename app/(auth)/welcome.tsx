import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { GlowButton } from '@/components/GlowButton';
import { colors, spacing, typography } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <AtmosphericBackground variant="deep">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Rewire</Text>
            <Text style={styles.subtitle}>
              The fog isn't punishment.{'\n'}It's just what happens when you stop moving.
            </Text>
          </View>

          <View style={styles.buttons}>
            <GlowButton
              title="Begin"
              onPress={() => router.push('/(auth)/sign-up')}
            />
            <GlowButton
              title="I've been here before"
              variant="secondary"
              onPress={() => router.push('/(auth)/sign-in')}
            />
          </View>
        </View>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 42,
    fontWeight: '700',
    color: colors.gold.DEFAULT,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  buttons: {
    gap: spacing.md,
  },
});
