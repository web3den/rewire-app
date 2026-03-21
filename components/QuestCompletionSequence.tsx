/**
 * QuestCompletionSequence
 *
 * The celebration moment after a quest is completed.
 * Two-phase animation:
 *   1. Completion modal (tier badge + Kael dialogue + sparks)
 *   2. Stats flash (updated numbers pulse in)
 *
 * Celebration, not achievement. Kael always present.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '@/lib/theme';
import {
  selectKaelCompletionLine,
  computeSparkReward,
  TIER_BADGES,
  type CompletionContext,
} from '@/lib/kael-completions';
import type { QuestTier } from '@/lib/types';

// ─── Types ───

export interface CompletionStats {
  sparks: number;
  streak: number;
  domainsActive: number;
}

export interface QuestCompletionSequenceProps {
  visible: boolean;
  context: CompletionContext;
  previousStats?: CompletionStats;
  completedSlotsToday?: number;
  onDismiss: () => void;
}

// ─── Phase definitions ───

type Phase = 'hidden' | 'completion' | 'stats' | 'done';

// ─── Component ───

export function QuestCompletionSequence({
  visible,
  context,
  previousStats,
  completedSlotsToday = 1,
  onDismiss,
}: QuestCompletionSequenceProps) {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [kaelLine] = useState(() => selectKaelCompletionLine(context));
  const sparkReward = computeSparkReward(context.tier, context.streakDays ?? 0, completedSlotsToday);
  const badge = TIER_BADGES[context.tier];

  // Animation values
  const slideAnim = useRef(new Animated.Value(120)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeScaleAnim = useRef(new Animated.Value(0.5)).current;
  const badgeOpacityAnim = useRef(new Animated.Value(0)).current;
  const sparkScaleAnim = useRef(new Animated.Value(0.8)).current;
  const statsOpacityAnim = useRef(new Animated.Value(0)).current;
  const statsSlideAnim = useRef(new Animated.Value(20)).current;
  const statsPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      runCompletionPhase();
    } else {
      resetAnimations();
      setPhase('hidden');
    }
  }, [visible]);

  function resetAnimations() {
    slideAnim.setValue(120);
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    badgeScaleAnim.setValue(0.5);
    badgeOpacityAnim.setValue(0);
    sparkScaleAnim.setValue(0.8);
    statsOpacityAnim.setValue(0);
    statsSlideAnim.setValue(20);
    statsPulseAnim.setValue(1);
  }

  async function runCompletionPhase() {
    setPhase('completion');

    // Haptic success burst
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Slide modal up with spring physics
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 0.9,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 0.9,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Badge pops in slightly after modal
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 280,
          mass: 0.7,
        }),
        Animated.timing(badgeOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 250);

    // Sparks pulse in
    setTimeout(() => {
      Animated.spring(sparkScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 300,
        mass: 0.6,
      }).start();
    }, 450);
  }

  function handleContinueToStats() {
    if (phase !== 'completion') return;
    setPhase('stats');

    // Fade out completion content
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate stats in
      Animated.parallel([
        Animated.timing(statsOpacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(statsSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 250,
        }),
      ]).start(() => {
        // Numbers pulse
        Animated.sequence([
          Animated.timing(statsPulseAnim, { toValue: 1.08, duration: 200, useNativeDriver: true }),
          Animated.timing(statsPulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Auto-dismiss after 2s
        setTimeout(() => {
          setPhase('done');
          onDismiss();
        }, 2000);
      });
    });
  }

  if (!visible && phase === 'hidden') return null;

  return (
    <Modal
      visible={visible || phase !== 'hidden'}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* ── Phase 1: Completion ── */}
        {(phase === 'completion') && (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: opacityAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#12121A', '#0A0A0F']}
              style={styles.cardInner}
            >
              {/* Tier badge */}
              <Animated.View
                style={[
                  styles.badgeContainer,
                  {
                    opacity: badgeOpacityAnim,
                    transform: [{ scale: badgeScaleAnim }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      borderColor: badge.color,
                      shadowColor: badge.color,
                      backgroundColor: badge.glowColor,
                    },
                  ]}
                >
                  <Text style={styles.badgeSymbol}>{badge.symbol}</Text>
                  <Text style={[styles.badgeLabel, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                </View>
              </Animated.View>

              {/* Spark reward */}
              <Animated.View
                style={[
                  styles.sparkRow,
                  {
                    transform: [{ scale: sparkScaleAnim }],
                  },
                ]}
              >
                <Text style={styles.sparkText}>{sparkReward.label}</Text>
              </Animated.View>

              {/* Kael dialogue */}
              <View style={styles.kaelSection}>
                <Text style={styles.kaelLabel}>Kael</Text>
                <Text style={styles.kaelLine}>{kaelLine}</Text>
              </View>

              {/* CTA */}
              <Pressable
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.continueButtonPressed,
                ]}
                onPress={handleContinueToStats}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── Phase 2: Stats flash ── */}
        {phase === 'stats' && (
          <Animated.View
            style={[
              styles.statsCard,
              {
                opacity: statsOpacityAnim,
                transform: [
                  { translateY: statsSlideAnim },
                  { scale: statsPulseAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#12121A', '#0A0A0F']}
              style={styles.cardInner}
            >
              <Text style={styles.statsTitle}>Updated</Text>

              <View style={styles.statsGrid}>
                <StatLine
                  label="Sparks"
                  value={(previousStats?.sparks ?? 0) + sparkReward.sparks}
                  prev={previousStats?.sparks}
                  color={colors.gold.DEFAULT}
                  pulseAnim={statsPulseAnim}
                />
                <StatLine
                  label="Streak"
                  value={context.streakDays ?? 0}
                  prev={(context.streakDays ?? 0)}
                  color="#E05555"
                  pulseAnim={statsPulseAnim}
                />
                <StatLine
                  label="Domains"
                  value={previousStats?.domainsActive ?? 1}
                  prev={undefined}
                  color="#5B8DEF"
                  pulseAnim={statsPulseAnim}
                />
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

// ─── StatLine subcomponent ───

function StatLine({
  label,
  value,
  prev,
  color,
  pulseAnim,
}: {
  label: string;
  value: number;
  prev?: number;
  color: string;
  pulseAnim: Animated.Value;
}) {
  const changed = prev !== undefined && value !== prev;

  return (
    <View style={styles.statLine}>
      <Text style={styles.statLabel}>{label}</Text>
      <Animated.Text
        style={[
          styles.statValue,
          { color },
          changed && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {value}
      </Animated.Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  cardInner: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  badgeSymbol: {
    fontSize: 20,
  },
  badgeLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sparkRow: {
    alignItems: 'center',
  },
  sparkText: {
    ...typography.subheading,
    color: colors.gold.DEFAULT,
    letterSpacing: 0.5,
  },
  kaelSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  kaelLabel: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  kaelLine: {
    ...typography.body,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  continueButton: {
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  continueButtonPressed: {
    opacity: 0.8,
  },
  continueButtonText: {
    ...typography.label,
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  statsTitle: {
    ...typography.label,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    width: '100%',
    gap: spacing.md,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  statLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
