// ─── Enums matching DB ───

export type QuestDomain = 'body' | 'mind' | 'heart' | 'courage' | 'order' | 'spirit';
export type QuestTier = 'ember' | 'flame' | 'blaze' | 'inferno';
export type QuestSource = 'handcrafted' | 'template' | 'llm_generated';
export type QuestCompletionType = 'self_report' | 'reflection' | 'timed';
export type QuestTimeWindow = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type QuestExpiry = 'today' | 'this_week' | 'none';
export type QuestSlotType = 'anchor' | 'choice' | 'ember';
export type QuestSlotStatus = 'active' | 'completed' | 'skipped' | 'expired';

export type SubscriptionStatus = 'free_prologue' | 'active_subscriber' | 'grace_period' | 'expired' | 'cancelled';
export type CurrencyType = 'fragments' | 'energy' | 'fog_light';
export type TransactionReason =
  | 'quest_completion' | 'reflection_bonus' | 'weekly_cycle_reward'
  | 'boss_quest_reward' | 'milestone_reward' | 'archetype_discovery'
  | 'season_completion' | 'awakening_moment' | 'energy_daily_grant'
  | 'energy_conversation_spend' | 'fog_light_tile_reveal' | 'fog_light_landmark_reveal'
  | 'fragment_cosmetic_purchase' | 'streak_bonus' | 'system_adjustment';

export type GuideRegister = 'mythic' | 'direct' | 'playful' | 'compassionate';
export type CrisisLevel = 'normal' | 'distress' | 'concern' | 'acute';
export type Archetype = 'the_flame' | 'the_lens' | 'the_bridge' | 'the_edge' | 'the_anchor' | 'the_well';
export type DepthPreference = 'light' | 'moderate' | 'full_depth';
export type FogTileStatus = 'hidden' | 'revealed' | 'dimmed';
export type StoryAct = 'prologue' | 'act_1' | 'act_2' | 'act_3' | 'clearing' | 'post_season';
export type SeasonStatus = 'active' | 'completed' | 'abandoned';

// ─── Table Row Types ───

export interface UserProfile {
  id: string;
  display_name: string;
  date_of_birth: string;
  is_minor: boolean;
  depth_preference: DepthPreference;
  rest_mode: boolean;
  rest_mode_since: string | null;
  timezone: string;
  subscription_status: SubscriptionStatus;
  prologue_start_date: string;
  subscription_expires: string | null;
  archetype: Archetype | null;
  archetype_assigned_at: string | null;
  the_question_answer: string | null;
  onboarding_completed: boolean;
  first_quest_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserStats {
  user_id: string;
  vitality: number;
  clarity: number;
  connection: number;
  valor: number;
  foundation: number;
  depth: number;
  last_quest_vitality: string | null;
  last_quest_clarity: string | null;
  last_quest_connection: string | null;
  last_quest_valor: string | null;
  last_quest_foundation: string | null;
  last_quest_depth: string | null;
  decay_computed_through: string;
  updated_at: string;
}

export interface UserCurrencies {
  user_id: string;
  fragments: number;
  energy: number;
  fog_light: number;
  energy_last_reset: string;
  energy_earned_today: number;
  updated_at: string;
}

export interface Quest {
  id: string;
  title: string;
  domain: QuestDomain;
  tier: QuestTier;
  source: QuestSource;
  description: string;
  instruction: string;
  why: string;
  duration_estimate_min: number;
  time_window: QuestTimeWindow;
  expiry: QuestExpiry;
  completion_type: QuestCompletionType;
  reflection_prompt: string | null;
  resistance_multiplier: number;
  reward_fragments: number;
  reward_fog_reveal: number;
  reward_energy: number;
  bonus_conditions: Record<string, unknown>;
  prerequisites: string[];
  tags: string[];
  safety_flags: string[];
  narrative_intro: string;
  narrative_completion: string;
  narrative_skip: string;
  generated_for_user: string | null;
  review_status: string;
  content_version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestAssignment {
  id: string;
  user_id: string;
  quest_id: string;
  slot_type: QuestSlotType;
  status: QuestSlotStatus;
  choice_options: string[];
  assigned_date: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined quest data
  quest?: Quest;
}

export interface QuestCompletion {
  id: string;
  user_id: string;
  quest_id: string;
  assignment_id: string | null;
  completion_type: QuestCompletionType;
  completed_at: string;
  reflection_text: string | null;
  reflection_depth_score: number | null;
  timer_duration_seconds: number | null;
  fragments_earned: number;
  energy_earned: number;
  fog_reveal_earned: number;
  bonus_applied: Record<string, unknown>;
  stat_dimension: QuestDomain;
  stat_change: number;
  created_at: string;
}

export interface FogMapTile {
  id: string;
  user_id: string;
  tile_index: number;
  ring: number;
  status: FogTileStatus;
  revealed_at: string | null;
  dimmed_at: string | null;
  tile_name: string | null;
  tile_description: string | null;
  landmark: boolean;
  revealed_by: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  register: GuideRegister;
  energy_spent: number;
  crisis_override: boolean;
  summary: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'guide';
  content: string;
  crisis_level: CrisisLevel;
  created_at: string;
}

export interface WeeklyCycle {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  anchor_completed: number;
  choice_completed: number;
  ember_completed: number;
  full_cycle_achieved: boolean;
  perfect_cycle: boolean;
  rewards_granted: boolean;
  fragments_earned: number;
  fog_light_earned: number;
}

export interface SeasonProgress {
  id: string;
  user_id: string;
  season_number: number;
  status: SeasonStatus;
  started_at: string;
  completed_at: string | null;
  current_act: StoryAct;
  story_flags: string[];
  total_quests_completed: number;
  total_fog_tiles_revealed: number;
}

// ─── App-level types ───

export const ALL_DOMAINS: QuestDomain[] = ['body', 'mind', 'heart', 'courage', 'order', 'spirit'];

export const STAT_COLUMNS: Record<QuestDomain, keyof UserStats> = {
  body: 'vitality',
  mind: 'clarity',
  heart: 'connection',
  courage: 'valor',
  order: 'foundation',
  spirit: 'depth',
};

export const DOMAIN_TO_ARCHETYPE: Record<QuestDomain, Archetype> = {
  body: 'the_flame',
  mind: 'the_lens',
  heart: 'the_bridge',
  courage: 'the_edge',
  order: 'the_anchor',
  spirit: 'the_well',
};

export const ARCHETYPE_TO_DOMAIN: Record<Archetype, QuestDomain> = {
  the_flame: 'body',
  the_lens: 'mind',
  the_bridge: 'heart',
  the_edge: 'courage',
  the_anchor: 'order',
  the_well: 'spirit',
};

export interface ScenarioChoice {
  emoji: string;
  text: string;
  domain: QuestDomain;
}

export interface Scenario {
  id: string;
  title: string;
  narration: string;
  choices: ScenarioChoice[];
}

export interface FirstLightData {
  affect: 'heavy' | 'restless' | 'numb';
  energy: number; // 0.0-1.0
  direction: QuestDomain;
}

export type CheckInResponse = 'doing_alright' | 'managing_needs_change' | 'having_hard_time' | 'just_getting_through';

// ─── WP6: Sparks Economy ───
export interface UserSparks {
  user_id: string;
  sparks: number;
  daily_total: number;
  last_earned: string | null;
  updated_at: string;
}

export interface CompleteQuestWP6Response {
  success: boolean;
  quest_title?: string;
  stat_gains?: Record<string, number>;
  fragments_earned?: number;
  sparks_earned?: number;
  sparks_balance?: number;
  streak_days?: number;
  kael_response?: string;
  error?: string;
}
