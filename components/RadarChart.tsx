import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors } from '@/lib/theme';
import type { UserStats } from '@/lib/types';

interface Props {
  stats: UserStats;
  size?: number;
}

const DIMENSIONS = [
  { key: 'vitality' as const, label: 'Vitality', color: colors.domain.vitality },
  { key: 'clarity' as const, label: 'Clarity', color: colors.domain.clarity },
  { key: 'connection' as const, label: 'Connection', color: colors.domain.connection },
  { key: 'valor' as const, label: 'Valor', color: colors.domain.valor },
  { key: 'foundation' as const, label: 'Foundation', color: colors.domain.foundation },
  { key: 'depth' as const, label: 'Depth', color: colors.domain.depth },
];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleIndex: number,
  total: number
): { x: number; y: number } {
  const angle = (angleIndex / total) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function RadarChart({ stats, size = 260 }: Props) {
  const center = size / 2;
  const maxRadius = size * 0.35;
  const labelRadius = size * 0.46;
  const n = DIMENSIONS.length;

  const rings = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = DIMENSIONS.map((dim, i) => {
    const val = Number(stats[dim.key]) / 100;
    const pos = polarToCartesian(center, center, maxRadius * val, i, n);
    return `${pos.x},${pos.y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r) => (
          <Circle
            key={r}
            cx={center}
            cy={center}
            r={maxRadius * r}
            fill="none"
            stroke="rgba(168, 164, 176, 0.1)"
            strokeWidth={0.5}
          />
        ))}

        {DIMENSIONS.map((_, i) => {
          const end = polarToCartesian(center, center, maxRadius, i, n);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="rgba(168, 164, 176, 0.08)"
              strokeWidth={0.5}
            />
          );
        })}

        <Polygon
          points={dataPoints}
          fill="rgba(232, 168, 56, 0.15)"
          stroke={colors.gold.DEFAULT}
          strokeWidth={1.5}
        />

        {DIMENSIONS.map((dim, i) => {
          const val = Number(stats[dim.key]) / 100;
          const pos = polarToCartesian(center, center, maxRadius * val, i, n);
          return <Circle key={`dot-${i}`} cx={pos.x} cy={pos.y} r={3} fill={dim.color} />;
        })}

        {DIMENSIONS.map((dim, i) => {
          const pos = polarToCartesian(center, center, labelRadius, i, n);
          return (
            <SvgText
              key={`label-${i}`}
              x={pos.x}
              y={pos.y}
              fill={dim.color}
              fontSize={11}
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {dim.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
