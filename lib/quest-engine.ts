/**
 * Quest Assignment Engine
 * Implements the domain-scoring algorithm from the mental model:
 *   40% act theme, 30% neglect boost, 20% energy fit, 10% anti-repeat
 */

import {
  QuestDomain,
  QuestTier,
  Quest,
  QuestAssignment,
  UserStats,
  StoryAct,
  ALL_DOMAINS,
  STAT_COLUMNS,
  ARCHETYPE_TO_DOMAIN,
  Archetype,
} from './types';

// ─── Tier unlock rules ───

export function computeMaxTier(
  act: StoryAct,
  track: 'A' | 'B',
  dayOfSeason: number
): QuestTier {
  if (act === 'prologue') {
    if (track === 'A') return dayOfSeason <= 2 ? 'ember' : 'flame';
    return 'ember';
  }
  if (act === 'act_1') {
    if (track === 'A') return 'flame';
    return dayOfSeason >= 10 ? 'flame' : 'ember';
  }
  if (act === 'act_2') {
    return track === 'A' ? 'blaze' : 'flame';
  }
  // act_3, clearing, post_season
  return 'blaze';
}

const TIER_ORDER: Record<QuestTier, number> = {
  ember: 0,
  flame: 1,
  blaze: 2,
  inferno: 3,
};

// ─── Act theme weights ───

function getActThemeWeight(act: StoryAct, domain: QuestDomain, primaryArchetype?: Archetype): number {
  // Act 1: all domains equal
  if (act === 'prologue' || act === 'act_1') return 1.0 / 6.0;

  // Act 2: Courage +0.15, primary archetype domain +0.10
  if (act === 'act_2') {
    let w = 1.0 / 6.0;
    if (domain === 'courage') w += 0.15;
    if (primaryArchetype && domain === ARCHETYPE_TO_DOMAIN[primaryArchetype]) w += 0.10;
    return w;
  }

  // Act 3+: Spirit +0.15, Heart +0.10
  let w = 1.0 / 6.0;
  if (domain === 'spirit') w += 0.15;
  if (domain === 'heart') w += 0.10;
  return w;
}

// ─── Domain scoring ───

interface DomainScoringInput {
  act: StoryAct;
  primaryArchetype?: Archetype;
  stats: UserStats;
  energyLevel: number; // 0-1
  recentDomains: QuestDomain[]; // last 2 completed domain sequence
  daysSinceLastQuest: Record<QuestDomain, number>;
}

export function scoreDomains(input: DomainScoringInput): Record<QuestDomain, number> {
  const scores = {} as Record<QuestDomain, number>;

  for (const d of ALL_DOMAINS) {
    // Factor 1: Act theme (40%)
    const actWeight = getActThemeWeight(input.act, d, input.primaryArchetype) * 0.4;

    // Factor 2: Neglect boost (30%)
    const daysSince = input.daysSinceLastQuest[d] ?? 0;
    const neglectBoost = Math.min(daysSince / 7.0, 1.0) * 0.3;

    // Factor 3: Energy fit (20%)
    let energyFit: number;
    if (input.energyLevel < 0.3) {
      energyFit = ['spirit', 'mind', 'order'].includes(d) ? 1.0 : 0.3;
    } else if (input.energyLevel > 0.7) {
      energyFit = ['body', 'courage'].includes(d) ? 1.0 : 0.6;
    } else {
      energyFit = 0.8;
    }
    const energyWeight = energyFit * 0.2;

    // Factor 4: Anti-repetition (10%)
    let antiRepeat = 0;
    if (
      input.recentDomains.length >= 2 &&
      input.recentDomains[input.recentDomains.length - 1] === d &&
      input.recentDomains[input.recentDomains.length - 2] === d
    ) {
      antiRepeat = -0.3;
    }

    scores[d] = actWeight + neglectBoost + energyWeight + antiRepeat;
  }

  return scores;
}

export function pickTopDomain(scores: Record<QuestDomain, number>): QuestDomain {
  let best: QuestDomain = 'body';
  let bestScore = -Infinity;
  for (const d of ALL_DOMAINS) {
    if (scores[d] > bestScore) {
      bestScore = scores[d];
      best = d;
    }
  }
  return best;
}

// ─── Quest filtering ───

export function filterCandidates(
  pool: Quest[],
  domain: QuestDomain,
  maxTier: QuestTier,
  recentQuestIds: string[],
  antiRepeatDays: number = 14
): Quest[] {
  const maxTierN = TIER_ORDER[maxTier];
  const minTierN = Math.max(0, maxTierN - 1);

  return pool.filter((q) => {
    if (q.domain !== domain) return false;
    const tierN = TIER_ORDER[q.tier];
    if (tierN > maxTierN || tierN < minTierN) return false;
    if (recentQuestIds.includes(q.id)) return false;
    return true;
  });
}

export function selectBestQuest(candidates: Quest[], maxTier: QuestTier): Quest | null {
  if (candidates.length === 0) return null;

  const maxTierN = TIER_ORDER[maxTier];
  const scored = candidates.map((q) => {
    const tierMatch = 1.0 - Math.abs(TIER_ORDER[q.tier] - maxTierN) * 0.3;
    const resistance = q.resistance_multiplier * 0.3;
    const jitter = Math.random() * 0.3;
    return { quest: q, score: tierMatch * 0.4 + resistance + jitter };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].quest;
}

// ─── Choice options generation ───

export function selectChoiceOptions(
  pool: Quest[],
  primaryDomain: QuestDomain,
  secondaryDomain: QuestDomain,
  anchorDomain: QuestDomain,
  maxTier: QuestTier,
  recentQuestIds: string[],
  track: 'A' | 'B'
): Quest[] {
  const options: Quest[] = [];
  const usedDomains = new Set<QuestDomain>([anchorDomain]);
  const usedIds = new Set(recentQuestIds);

  // Option A: primary archetype domain
  const optADomain = usedDomains.has(primaryDomain)
    ? ALL_DOMAINS.find((d) => !usedDomains.has(d)) ?? primaryDomain
    : primaryDomain;
  const optACandidates = pool.filter(
    (q) => q.domain === optADomain && TIER_ORDER[q.tier] <= TIER_ORDER[maxTier] && !usedIds.has(q.id)
  );
  if (optACandidates.length > 0) {
    const pick = optACandidates[Math.floor(Math.random() * optACandidates.length)];
    options.push(pick);
    usedDomains.add(pick.domain);
    usedIds.add(pick.id);
  }

  // Option B: secondary domain
  const optBDomain = usedDomains.has(secondaryDomain)
    ? ALL_DOMAINS.find((d) => !usedDomains.has(d)) ?? secondaryDomain
    : secondaryDomain;
  const optBCandidates = pool.filter(
    (q) => q.domain === optBDomain && TIER_ORDER[q.tier] <= TIER_ORDER[maxTier] && !usedIds.has(q.id)
  );
  if (optBCandidates.length > 0) {
    const pick = optBCandidates[Math.floor(Math.random() * optBCandidates.length)];
    options.push(pick);
    usedDomains.add(pick.domain);
    usedIds.add(pick.id);
  }

  // Option C: wildcard from remaining domains
  const remaining = ALL_DOMAINS.filter((d) => !usedDomains.has(d));
  if (remaining.length > 0) {
    const wildcardDomain = remaining[Math.floor(Math.random() * remaining.length)];
    const wildcardTier = track === 'B' ? maxTier : (
      TIER_ORDER[maxTier] < TIER_ORDER['blaze'] ? (['ember', 'flame', 'blaze'] as QuestTier[])[TIER_ORDER[maxTier] + 1] : maxTier
    );
    const optCCandidates = pool.filter(
      (q) => q.domain === wildcardDomain && TIER_ORDER[q.tier] <= TIER_ORDER[wildcardTier] && !usedIds.has(q.id)
    );
    if (optCCandidates.length > 0) {
      const pick = optCCandidates[Math.floor(Math.random() * optCCandidates.length)];
      options.push(pick);
    }
  }

  // Fill remaining slots if needed
  while (options.length < 3) {
    const filler = pool.find((q) => !usedIds.has(q.id) && TIER_ORDER[q.tier] <= TIER_ORDER[maxTier]);
    if (!filler) break;
    options.push(filler);
    usedIds.add(filler.id);
  }

  return options;
}

// ─── Ember quest selection ───

export function selectEmberQuest(
  pool: Quest[],
  excludeDomains: QuestDomain[],
  recentQuestIds: string[]
): Quest | null {
  const preferred = ALL_DOMAINS.filter((d) => !excludeDomains.includes(d));
  const domain = preferred.length > 0
    ? preferred[Math.floor(Math.random() * preferred.length)]
    : ALL_DOMAINS[Math.floor(Math.random() * ALL_DOMAINS.length)];

  let candidates = pool.filter(
    (q) => q.tier === 'ember' && q.domain === domain && !recentQuestIds.includes(q.id) && q.duration_estimate_min <= 5
  );

  if (candidates.length === 0) {
    candidates = pool.filter((q) => q.tier === 'ember' && !recentQuestIds.includes(q.id));
  }

  if (candidates.length === 0) {
    candidates = pool.filter((q) => q.tier === 'ember');
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
