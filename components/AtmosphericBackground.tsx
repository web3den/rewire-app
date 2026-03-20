import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/theme';

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'deep';
}

export function AtmosphericBackground({ children, variant = 'default' }: Props) {
  const gradientMap = {
    default: [colors.bg.primary, colors.bg.secondary, colors.bg.tertiary] as [string, string, ...string[]],
    warm: [colors.bg.primary, '#151018', '#1A1220'] as [string, string, ...string[]],
    deep: ['#050508', '#0A0A12', '#10101A'] as [string, string, ...string[]],
  };

  return (
    <LinearGradient
      colors={gradientMap[variant] as [string, string, ...string[]]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
