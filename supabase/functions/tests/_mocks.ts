// ============================================================
// Test Mocks & Fixtures
// ============================================================

import type { CrisisLevel, GuideRegister } from "../_shared/types.ts";

// ---- Mock User Profile ----
export const mockUserProfile = {
  id: "test-user-id-1234",
  display_name: "TestTraveler",
  date_of_birth: "1995-06-15",
  depth_preference: "moderate",
  rest_mode: false,
  timezone: "America/Chicago",
  subscription_status: "active_subscriber",
  archetype: "the_flame",
  onboarding_completed: true,
  first_quest_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockFreeUser = {
  ...mockUserProfile,
  id: "test-free-user-5678",
  subscription_status: "free_prologue",
};

// ---- Mock Stats ----
export const mockStats = {
  user_id: mockUserProfile.id,
  vitality: 25.0,
  clarity: 18.5,
  connection: 12.0,
  valor: 30.0,
  foundation: 20.0,
  depth: 15.5,
  decay_computed_through: new Date().toISOString().split("T")[0],
};

// ---- Mock Currencies ----
export const mockCurrencies = {
  user_id: mockUserProfile.id,
  fragments: 150,
  energy: 5,
  fog_light: 2,
  energy_last_reset: new Date().toISOString().split("T")[0],
  energy_earned_today: 0,
};

export const mockEmptyCurrencies = {
  ...mockCurrencies,
  energy: 0,
};

// ---- Mock Quests ----
export const mockEmberQuest = {
  id: "quest-ember-001",
  title: "Morning Glass",
  domain: "body",
  tier: "ember",
  source: "handcrafted",
  description: "Water. Before anything else.",
  instruction: "Drink a full glass of water within 5 minutes of waking.",
  why: "Hydration primes the nervous system.",
  duration_estimate_min: 2,
  time_window: "morning",
  expiry: "today",
  completion_type: "self_report",
  reflection_prompt: null,
  resistance_multiplier: 1.0,
  reward_fragments: 5,
  reward_fog_reveal: 0.1,
  reward_energy: 0,
  narrative_intro: "The simplest acts carry the most weight.",
  narrative_completion: "Even the fog stirs when a traveler begins.",
  narrative_skip: "The glass waits. It always waits.",
  is_active: true,
};

export const mockFlameQuest = {
  ...mockEmberQuest,
  id: "quest-flame-001",
  title: "Cook Real Food",
  tier: "flame",
  domain: "body",
  duration_estimate_min: 30,
  reward_fragments: 15,
  reward_fog_reveal: 0.5,
  reflection_prompt: "How did it feel to prepare something for yourself?",
  completion_type: "reflection",
};

export const mockCourageQuest = {
  ...mockEmberQuest,
  id: "quest-courage-001",
  title: "First Words",
  tier: "flame",
  domain: "courage",
  instruction: "Start a conversation with someone you don't know.",
  reward_fragments: 20,
  resistance_multiplier: 1.5,
};

// ---- Mock Quest Assignment ----
export const mockAssignment = {
  id: "assignment-001",
  user_id: mockUserProfile.id,
  quest_id: mockEmberQuest.id,
  slot_type: "anchor",
  status: "active",
  assigned_date: new Date().toISOString().split("T")[0],
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// ---- Mock Memory Facts ----
export const mockMemoryFacts = [
  { id: "fact-1", user_id: mockUserProfile.id, category: "stated_goal", fact_text: "Wants to cook more often", importance: 8 },
  { id: "fact-2", user_id: mockUserProfile.id, category: "behavioral_pattern", fact_text: "Tends to scroll when uncertain", importance: 9 },
  { id: "fact-3", user_id: mockUserProfile.id, category: "avoidance_pattern", fact_text: "Avoids social events unless invited directly", importance: 7 },
];

// ---- Mock Conversation Summaries ----
export const mockSummaries = [
  { id: "sum-1", user_id: mockUserProfile.id, summary_date: "2026-03-14", summary_text: "Discussed feeling stuck after a good week. Realized drift starts with scrolling.", categories: ["realization", "pattern"] },
  { id: "sum-2", user_id: mockUserProfile.id, summary_date: "2026-03-13", summary_text: "Completed first courage quest. Felt proud but anxious.", categories: ["insight"] },
];

// ---- Mock Supabase Client ----
export function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultData: Record<string, unknown> = {
    user_profiles: mockUserProfile,
    user_stats: mockStats,
    user_currencies: mockCurrencies,
    ...overrides,
  };

  const mockFrom = (table: string) => {
    const chain = {
      select: (_cols?: string) => chain,
      insert: (_data: unknown) => chain,
      update: (_data: unknown) => chain,
      upsert: (_data: unknown) => chain,
      delete: () => chain,
      eq: (_col: string, _val: unknown) => chain,
      neq: (_col: string, _val: unknown) => chain,
      gt: (_col: string, _val: unknown) => chain,
      gte: (_col: string, _val: unknown) => chain,
      lt: (_col: string, _val: unknown) => chain,
      lte: (_col: string, _val: unknown) => chain,
      in: (_col: string, _vals: unknown[]) => chain,
      order: (_col: string, _opts?: unknown) => chain,
      limit: (_n: number) => chain,
      single: () => ({ data: defaultData[table] ?? null, error: null }),
      maybeSingle: () => ({ data: defaultData[table] ?? null, error: null }),
      then: (resolve: (val: unknown) => void) => resolve({ data: Array.isArray(defaultData[table]) ? defaultData[table] : [defaultData[table]], error: null }),
    };
    return chain;
  };

  return { from: mockFrom };
}
