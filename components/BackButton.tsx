import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, TOUCH_MIN } from '@/lib/theme';

interface Props {
  onPress?: () => void;
  label?: string;
}

export function BackButton({ onPress, label = '‹ Back' }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      style={styles.button}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH_MIN,
    minWidth: TOUCH_MIN,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    color: colors.gold.DEFAULT,
    fontSize: 17,
    fontWeight: '500',
  },
});
