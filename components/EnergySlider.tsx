import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/lib/theme';

interface Props {
  value: number;
  onValueChange: (val: number) => void;
}

const LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

export function EnergySlider({ value, onValueChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.label}>Dim ember</Text>
        <Text style={styles.label}>Bright flame</Text>
      </View>

      <View style={styles.track}>
        {LEVELS.map((level) => {
          const selected = Math.abs(value - level) < 0.05;
          const size = selected ? 28 : 20;
          return (
            <Pressable
              key={level}
              onPress={() => onValueChange(level)}
              style={styles.dotWrap}
              hitSlop={12}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: selected
                      ? colors.gold.DEFAULT
                      : level <= value
                        ? colors.gold.dim
                        : colors.bg.elevated,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        There's no right answer. Just tap where it feels honest.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.text.muted,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
  },
  dotWrap: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {},
  hint: {
    fontSize: 14,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
