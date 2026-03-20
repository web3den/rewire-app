import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, TOUCH_MIN } from '@/lib/theme';
import type { ScenarioChoice } from '@/lib/types';

interface Props {
  narration: string;
  choices: ScenarioChoice[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function ScenarioCard({ narration, choices, selectedIndex, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.narration}>"{narration}"</Text>

      <View style={styles.choices}>
        {choices.map((choice, index) => (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            style={[
              styles.choiceCard,
              selectedIndex === index && styles.choiceSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={choice.text}
          >
            <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
            <Text style={[
              styles.choiceText,
              selectedIndex === index && styles.choiceTextSelected,
            ]}>
              {choice.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  narration: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.gold.light,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  choices: {
    gap: spacing.sm,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: TOUCH_MIN,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  choiceSelected: {
    borderColor: colors.gold.DEFAULT,
    backgroundColor: 'rgba(232, 168, 56, 0.08)',
  },
  choiceEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  choiceText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  choiceTextSelected: {
    color: colors.gold.light,
  },
});
