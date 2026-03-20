/**
 * Stat & Economy System
 * Implements: base × tier_mult × resistance × streak × diminishing_returns
 */

import { QuestDomain, QuestTier, UserStats, STAT_COLUMNS } from './types';

// ─── Stat gain formula ───

const TIER_BASE: Record<QuestTier, number> = {
  ember: 2,
  flame: 4,
  blaze: 7,
  inferno: 15,
};

export function computeStatGain(
  tier: QuestTier,
  domain: QuestDomain,
  resistanceMultiplier: number,
  stats: UserStats,
  streakDays: number
): number {
  const base = TIER_BASE[tier];

  // Weakest-2 bonus (1.3x if this domain is in the bottom 2)
  const statValues = [
    { key: 'vitality', val: Number(stats.vitality) },
    { key: 'clarity', val: Number(stats.clarity) },
    { key: 'connection', val: Number(stats.connection) },
    { key: 'valor', val: Number(stats.valor) },
    { key: 'foundation', val: Number(stats.foundation) },
    { key: 'depth', val: Number(stats.depth) },
  ];
  statValues.sort((a, b) => a.val - b.val);
  const weakest2 = statValues.slice(0, 2).map((s) => s.key);
  const statCol = STAT_COLUMNS[domain];
  const tierMult = weakest2.includes(statCol as string) ? 1.3 : 1.0;

  // Streak modifier
  let streakMod = 1.0;
  if (streakDays >= 7) streakMod = 1.2;
  else if (streakDays >= 5) streakMod = 1.15;
  else if (streakDays >= 3) streakMod = 1.1;

  // Diminishing returns based on current value
  const currentVal = Number(stats[statCol] ?? 15);
  let dimReturns = 1.0;
  if (currentVal >= 90) dimReturns = 0.5;
  else if (currentVal >= 75) dimReturns = 0.7;
  else if (currentVal >= 50) dimReturns = 0.85;

  const raw = base * tierMult * resistanceMultiplier * streakMod * dimReturns;
  return Math.max(1, Math.round(raw));
}

// ─── Stat decay ───

export function computeDecay(daysSinceQuest: number): number {
  if (daysSinceQuest <= 3) return 0;
  // 0.5 per day starting day 4, capped at 2.0/day
  return Math.min((daysSinceQuest - 3) * 0.5, 2.0);
}

// ─── Fragment rewards by tier ───

export const FRAGMENT_REWARDS: Record<QuestTier, { min: number; max: number }> = {
  ember: { min: 10, max: 15 },
  flame: { min: 25, max: 40 },
  blaze: { min: 50, max: 80 },
  inferno: { min: 150, max: 250 },
};

// ─── Energy economy ───

export const ENERGY_DAILY_FREE = 3;
export const ENERGY_MAX_FREE = 5;

export const ENERGY_REWARDS: Record<QuestTier, number> = {
  ember: 0,
  flame: 1,
  blaze: 2,
  inferno: 5,
};

export const ENERGY_COST_CONVERSATION = 1;

// ─── Fog reveal amounts ───

export const FOG_REVEAL: Record<string, number> = {
  anchor_ember: 0.8,
  anchor_flame: 1.0,
  anchor_blaze: 1.2,
  choice: 0.5,
  ember_slot: 0.3,
  boss_inferno: 4.0,
  micro_quest: 0.1,
};

// ─── Sparks (refresh currency) ───

export const SPARKS_CAP = 20;

export function computeSparksEarned(event: string): number {
  switch (event) {
    case 'anchor_complete':
      return 1;
    case 'choice_no_refresh':
      return 1;
    case 'weekly_cycle':
      return 2;
    case 'all_slots_day':
      return 1;
    case 'streak_3':
      return 1;
    default:
      return 0;
  }
}
