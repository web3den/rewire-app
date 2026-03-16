// ============================================================
// Quest Validation & Safety Filter
// Validates LLM-generated quests against schema and safety rules
// ============================================================

import type { Quest, QuestDomain, QuestTier } from "./types.ts";

const VALID_DOMAINS: QuestDomain[] = ["body", "mind", "heart", "courage", "order", "spirit"];
const VALID_TIERS: QuestTier[] = ["ember", "flame", "blaze", "inferno"];
const VALID_TIME_WINDOWS = ["morning", "afternoon", "evening", "anytime"];
const VALID_COMPLETION_TYPES = ["self_report", "reflection", "timed"];

interface RawQuest {
  title?: string;
  domain?: string;
  tier?: string;
  description?: string;
  instruction?: string;
  why?: string;
  duration_estimate_min?: number;
  time_window?: string;
  completion_type?: string;
  reflection_prompt?: string | null;
  resistance_multiplier?: number;
  reward_fragments?: number;
  reward_fog_reveal?: number;
  reward_energy?: number;
  tags?: string[];
  safety_flags?: string[];
  narrative_intro?: string;
  narrative_completion?: string;
  narrative_skip?: string;
}

// Validate a quest object matches the expected schema
export function validateQuestSchema(quest: RawQuest): boolean {
  if (!quest.title || typeof quest.title !== "string") return false;
  if (!VALID_DOMAINS.includes(quest.domain as QuestDomain)) return false;
  if (!VALID_TIERS.includes(quest.tier as QuestTier)) return false;
  if (!quest.description || !quest.instruction || !quest.why) return false;
  if (typeof quest.duration_estimate_min !== "number" || quest.duration_estimate_min <= 0) return false;
  if (quest.time_window && !VALID_TIME_WINDOWS.includes(quest.time_window)) return false;
  if (quest.completion_type && !VALID_COMPLETION_TYPES.includes(quest.completion_type)) return false;
  if (!quest.narrative_intro || !quest.narrative_completion || !quest.narrative_skip) return false;

  // Validate reward ranges
  if (quest.resistance_multiplier !== undefined) {
    if (quest.resistance_multiplier < 1.0 || quest.resistance_multiplier > 2.5) return false;
  }
  if (quest.reward_fragments !== undefined) {
    if (quest.reward_fragments < 0 || quest.reward_fragments > 100) return false;
  }

  return true;
}

// Safety filter: reject quests that violate content rules
export function passSafetyFilter(
  quest: RawQuest,
  user: { is_minor: boolean; safety_flags?: string[] },
): boolean {
  const text = `${quest.title} ${quest.description} ${quest.instruction}`.toLowerCase();

  // Universal safety: no substance use, illegal activity, extreme physical risk
  const blocked = [
    /\balcohol\b/, /\bdrug\b/, /\bsubstance\b/, /\billegal\b/,
    /\bextreme\b.*\brisk\b/, /\bweapon\b/, /\bgambl/,
  ];
  for (const pattern of blocked) {
    if (pattern.test(text)) return false;
  }

  // Minor-specific: no mortality, finitude, or deep existential themes
  if (user.is_minor) {
    const minorBlocked = [/\bdeath\b/, /\bdie\b/, /\bmortality\b/, /\bfinitude\b/];
    for (const pattern of minorBlocked) {
      if (pattern.test(text)) return false;
    }
  }

  // User-specific safety flags
  if (user.safety_flags) {
    for (const flag of user.safety_flags) {
      if (quest.safety_flags?.includes(flag)) return false;
    }
  }

  return true;
}

// Check if a quest has emotional flags that require human review
export function hasEmotionalFlag(quest: RawQuest): boolean {
  const text = `${quest.title} ${quest.description} ${quest.instruction}`.toLowerCase();
  const emotionalPatterns = [
    /\btrauma\b/, /\babuse\b/, /\bself.?harm\b/, /\bsuicid/,
    /\bpanic\b/, /\bphobia\b/, /\beating.?disorder\b/,
  ];
  return emotionalPatterns.some((p) => p.test(text));
}
