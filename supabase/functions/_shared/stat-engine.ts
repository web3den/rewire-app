// ============================================================
// Stat Engine Helpers
// Client-side helpers for stat gain calculation and domain mapping
// ============================================================

import type { QuestDomain, Archetype } from "./types.ts";

// Map quest domain to stat dimension column name
export function domainToStatColumn(domain: QuestDomain): string {
  const mapping: Record<QuestDomain, string> = {
    body: "vitality",
    mind: "clarity",
    heart: "connection",
    courage: "valor",
    order: "foundation",
    spirit: "depth",
  };
  return mapping[domain];
}

// Map archetype to its primary quest domain
export function archetypeToPrimaryDomain(archetype: Archetype): QuestDomain {
  const mapping: Record<Archetype, QuestDomain> = {
    the_flame: "body",
    the_lens: "mind",
    the_bridge: "heart",
    the_edge: "courage",
    the_anchor: "order",
    the_well: "spirit",
  };
  return mapping[archetype];
}

// Map archetype to its stat dimension name
export function archetypeToStat(archetype: Archetype): string {
  const mapping: Record<Archetype, string> = {
    the_flame: "vitality",
    the_lens: "clarity",
    the_bridge: "connection",
    the_edge: "valor",
    the_anchor: "foundation",
    the_well: "depth",
  };
  return mapping[archetype];
}

// Base XP values by tier
export const TIER_BASE_XP: Record<string, number> = {
  ember: 2,
  flame: 4,
  blaze: 7,
  inferno: 15,
};

// Base fragment rewards by tier
export const TIER_BASE_FRAGMENTS: Record<string, number> = {
  ember: 10,
  flame: 20,
  blaze: 40,
  inferno: 80,
};

/**
 * Calculate stat gain with diminishing returns.
 * Formula: baseXP * tierMultiplier * resistanceMultiplier * (1 - currentStat/120) * archetypeBonus
 * The (1 - stat/120) curve means gains slow as you approach 100 but never reach zero.
 */
export function calculateStatGain(
  currentStat: number,
  tier: string,
  resistanceMultiplier: number,
  isPrimaryArchetype: boolean,
): number {
  const baseXP = TIER_BASE_XP[tier] ?? 2;
  const diminishingFactor = Math.max(0.05, 1 - currentStat / 120);
  const archetypeBonus = isPrimaryArchetype ? 1.15 : 1.0;
  const raw = baseXP * diminishingFactor * resistanceMultiplier * archetypeBonus;
  // Cap so stat doesn't exceed 100
  return Math.min(raw, 100 - currentStat);
}

/**
 * Calculate stat decay after days of inactivity in a domain.
 * No decay for first 7 days. After that, gentle decay of 0.5/day, floor at 10.
 */
export function calculateDecay(currentStat: number, daysSinceLastQuest: number): number {
  if (daysSinceLastQuest <= 7) return 0;
  const decayDays = daysSinceLastQuest - 7;
  const maxDecay = Math.max(0, currentStat - 10); // don't go below 10
  return Math.min(decayDays * 0.5, maxDecay);
}

// Alias for domain-to-stat mapping
export const domainToStat = domainToStatColumn;
