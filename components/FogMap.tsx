import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing } from '@/lib/theme';
import type { FogMapTile } from '@/lib/types';

interface Props {
  tiles: FogMapTile[];
  size?: number;
}

function getTilePosition(
  tileIndex: number,
  ring: number,
  centerX: number,
  centerY: number,
  mapSize: number
): { x: number; y: number } {
  const ringStarts = [0, 5, 20, 45, 75, 80];
  const ringSizes = [5, 15, 25, 30, 5, 20];

  if (ring === 0) {
    const angle = (tileIndex / 5) * Math.PI * 2 - Math.PI / 2;
    const r = mapSize * 0.06;
    return { x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r };
  }

  const indexInRing = tileIndex - ringStarts[ring];
  const ringSize = ringSizes[ring];
  const angle = (indexInRing / ringSize) * Math.PI * 2 - Math.PI / 2;
  const r = mapSize * (0.08 + ring * 0.075);

  return { x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r };
}

export function FogMap({ tiles, size = 300 }: Props) {
  const center = size / 2;
  const tileRadius = size * 0.022;
  const revealedCount = tiles.filter((t) => t.status === 'revealed').length;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={size * 0.45} fill="rgba(232, 168, 56, 0.03)" />
        <Circle cx={center} cy={center} r={size * 0.30} fill="rgba(232, 168, 56, 0.04)" />

        {[1, 2, 3, 4, 5].map((ring) => (
          <Circle
            key={`ring-${ring}`}
            cx={center}
            cy={center}
            r={size * (0.08 + ring * 0.075)}
            fill="none"
            stroke="rgba(168, 164, 176, 0.06)"
            strokeWidth={0.5}
          />
        ))}

        <G>
          {tiles.map((tile) => {
            const pos = getTilePosition(tile.tile_index, tile.ring, center, center, size);
            const isRevealed = tile.status === 'revealed';
            const isDimmed = tile.status === 'dimmed';

            let fillColor: string;
            let fillOpacity: number;
            if (isRevealed) {
              fillColor = tile.landmark ? colors.gold.DEFAULT : colors.gold.dim;
              fillOpacity = tile.landmark ? 0.9 : 0.7;
            } else if (isDimmed) {
              fillColor = colors.gold.dim;
              fillOpacity = 0.3;
            } else {
              fillColor = colors.text.muted;
              fillOpacity = 0.15;
            }

            return (
              <Circle
                key={tile.tile_index}
                cx={pos.x}
                cy={pos.y}
                r={isRevealed ? tileRadius * 1.3 : tileRadius}
                fill={fillColor}
                opacity={fillOpacity}
              />
            );
          })}
        </G>
      </Svg>

      <Text style={styles.counter}>
        {revealedCount} / {tiles.length} tiles revealed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  counter: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.text.muted,
  },
});
