import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { RadarChart } from '@/components/RadarChart';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { colors, radius, spacing, typography } from '@/lib/theme';

const STAT_BARS = [
  { key: 'vitality' as const, label: 'Vitality', color: colors.domain.vitality },
  { key: 'clarity' as const, label: 'Clarity', color: colors.domain.clarity },
  { key: 'connection' as const, label: 'Connection', color: colors.domain.connection },
  { key: 'valor' as const, label: 'Valor', color: colors.domain.valor },
  { key: 'foundation' as const, label: 'Foundation', color: colors.domain.foundation },
  { key: 'depth' as const, label: 'Depth', color: colors.domain.depth },
];

export default function CompassScreen() {
  const { session } = useAuthStore();
  const { stats, currencies, loading, fetchAll } = useUserStore();

  useEffect(() => {
    if (session?.user.id) {
      fetchAll();
    }
  }, [session?.user.id, fetchAll]);

  if (loading && !stats) {
    return (
      <AtmosphericBackground>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
        </SafeAreaView>
      </AtmosphericBackground>
    );
  }

  return (
    <AtmosphericBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Essence Compass</Text>

          {/* Radar Chart */}
          {stats && (
            <View style={styles.chartContainer}>
              <RadarChart stats={stats} size={280} />
            </View>
          )}

          {/* Stat Bars */}
          <View style={styles.statBars}>
            {STAT_BARS.map((stat) => {
              const value = stats ? Number(stats[stat.key]) : 0;
              return (
                <View key={stat.key} style={styles.statBar}>
                  <View style={styles.statBarHeader}>
                    <Text style={[styles.statBarLabel, { color: stat.color }]}>
                      {stat.label}
                    </Text>
                    <Text style={styles.statBarValue}>{Math.round(value)}</Text>
                  </View>
                  <View style={styles.statBarTrack}>
                    <View
                      style={[
                        styles.statBarFill,
                        {
                          width: `${value}%`,
                          backgroundColor: stat.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Currencies */}
          <View style={styles.currencies}>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyIcon}>✦</Text>
              <Text style={styles.currencyValue}>{currencies?.fragments ?? 0}</Text>
              <Text style={styles.currencyLabel}>Fragments</Text>
            </View>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyIcon}>⚡</Text>
              <Text style={styles.currencyValue}>{currencies?.energy ?? 0}</Text>
              <Text style={styles.currencyLabel}>Energy</Text>
            </View>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyIcon}>💡</Text>
              <Text style={styles.currencyValue}>{currencies?.fog_light ?? 0}</Text>
              <Text style={styles.currencyLabel}>Fog Light</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statBars: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statBar: {
    gap: spacing.xs,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBarLabel: {
    ...typography.label,
    fontSize: 13,
  },
  statBarValue: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statBarTrack: {
    height: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  currencies: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  currencyItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  currencyIcon: {
    fontSize: 24,
  },
  currencyValue: {
    ...typography.heading,
    color: colors.gold.DEFAULT,
  },
  currencyLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
