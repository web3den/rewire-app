import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, TOUCH_MIN } from '@/lib/theme';

type AffectType = 'heavy' | 'restless' | 'numb';

interface Props {
  selected: AffectType | null;
  onSelect: (affect: AffectType) => void;
}

const OPTIONS: { type: AffectType; emoji: string; label: string; sublabel: string }[] = [
  { type: 'heavy', emoji: '🌊', label: 'A still, heavy sea', sublabel: 'Heavy. Weighed down.' },
  { type: 'restless', emoji: '🔥', label: 'A restless, scattered fire', sublabel: 'Restless. Can\'t settle.' },
];

export function AffectSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.type}
            onPress={() => onSelect(opt.type)}
            style={[
              styles.card,
              selected === opt.type && styles.cardSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={styles.label}>{opt.label}</Text>
            {selected === opt.type && (
              <Text style={styles.sublabel}>{opt.sublabel}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => onSelect('numb')}
        style={[styles.numbOption, selected === 'numb' && styles.numbSelected]}
        accessibilityRole="button"
        accessibilityLabel="Honestly? Numb. Neither."
      >
        <Text style={styles.numbEmoji}>❄️</Text>
        <Text style={styles.numbText}>Honestly? Numb. Neither.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.gold.DEFAULT,
    backgroundColor: 'rgba(232, 168, 56, 0.08)',
  },
  emoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  sublabel: {
    fontSize: 13,
    color: colors.gold.light,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  numbOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: TOUCH_MIN,
  },
  numbSelected: {
    borderColor: colors.purple.DEFAULT,
    backgroundColor: 'rgba(123, 111, 224, 0.08)',
  },
  numbEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  numbText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
