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
