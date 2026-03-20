import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, TOUCH_MIN } from '@/lib/theme';
import type { Quest, QuestSlotType, QuestSlotStatus } from '@/lib/types';

interface Props {
  quest: Quest;
  slotType: QuestSlotType;
  status: QuestSlotStatus;
  onPress: () => void;
}

const TIER_COLORS: Record<string, string> = {
  ember: colors.tier.ember,
  flame: colors.tier.flame,
  blaze: colors.tier.blaze,
  inferno: colors.tier.inferno,
};

const DOMAIN_COLORS: Record<string, string> = {
  body: colors.domain.vitality,
  mind: colors.domain.clarity,
  heart: colors.domain.connection,
  courage: colors.domain.valor,
  order: colors.domain.foundation,
  spirit: colors.domain.depth,
};

const SLOT_LABELS: Record<QuestSlotType, string> = {
  anchor: 'Anchor',
  choice: 'Choice',
  ember: 'Ember',
};

export function QuestCard({ quest, slotType, status, onPress }: Props) {
  const tierColor = TIER_COLORS[quest.tier] ?? colors.gold.DEFAULT;
  const domainColor = DOMAIN_COLORS[quest.domain] ?? colors.gold.DEFAULT;
  const isCompleted = status === 'completed';

  return (
    <Pressable
      onPress={onPress}
      disabled={isCompleted}
      style={({ pressed }) => [
        styles.card,
        isCompleted && styles.completed,
        pressed && !isCompleted && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${quest.title} - ${slotType} quest`}
    >
      <View style={[styles.tierLine, { backgroundColor: tierColor }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.slotLabel}>{SLOT_LABELS[slotType]}</Text>
          <Text style={[styles.tierBadge, { color: tierColor }]}>
            {quest.tier.charAt(0).toUpperCase() + quest.tier.slice(1)}
          </Text>
        </View>

        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {quest.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.time}>~{quest.duration_estimate_min} min</Text>
          <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
        </View>

        {isCompleted && (
          <View style={styles.completedOverlay}>
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    minHeight: TOUCH_MIN,
  },
  completed: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  tierLine: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 13,
    color: colors.text.muted,
  },
  domainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.5)',
    borderRadius: radius.lg,
  },
  completedText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
});
