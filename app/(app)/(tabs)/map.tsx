import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { FogMap } from '@/components/FogMap';
import { useAuthStore } from '@/stores/auth';
import { useFogMapStore } from '@/stores/fog-map';
import { useUserStore } from '@/stores/user';
import { colors, spacing, typography } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MapScreen() {
  const { session } = useAuthStore();
  const { tiles, loading, fetchTiles } = useFogMapStore();
  const { currencies } = useUserStore();

  useEffect(() => {
    if (session?.user.id) {
      fetchTiles();
    }
  }, [session?.user.id, fetchTiles]);

  const revealedCount = tiles.filter((t) => t.status === 'revealed').length;
  const landmarkCount = tiles.filter((t) => t.status === 'revealed' && t.landmark).length;

  return (
    <AtmosphericBackground variant="deep">
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>The Fog Map</Text>
            <View style={styles.fogLightBadge}>
              <Text style={styles.fogLightIcon}>💡</Text>
              <Text style={styles.fogLightCount}>{currencies?.fog_light ?? 0}</Text>
            </View>
          </View>

          {/* Map */}
          {loading && tiles.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
            </View>
          ) : (
            <View style={styles.mapContainer}>
              <FogMap tiles={tiles} size={SCREEN_WIDTH - spacing.lg * 2} />
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{revealedCount}</Text>
              <Text style={styles.statLabel}>Tiles Revealed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{landmarkCount}</Text>
              <Text style={styles.statLabel}>Landmarks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tiles.length}</Text>
              <Text style={styles.statLabel}>Total Tiles</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.gold.dim, opacity: 0.7 }]} />
              <Text style={styles.legendText}>Revealed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.gold.DEFAULT, opacity: 0.9 }]} />
              <Text style={styles.legendText}>Landmark</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.text.muted, opacity: 0.15 }]} />
              <Text style={styles.legendText}>Hidden</Text>
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
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
  },
  fogLightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  fogLightIcon: {
    fontSize: 16,
  },
  fogLightCount: {
    ...typography.label,
    color: colors.gold.DEFAULT,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
    color: colors.gold.DEFAULT,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...typography.caption,
  },
});
