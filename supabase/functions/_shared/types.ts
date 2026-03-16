// ============================================================
// Shared TypeScript types for Rewire edge functions
// ============================================================

// Enums
export type QuestDomain = 'body' | 'mind' | 'heart' | 'courage' | 'order' | 'spirit';
export type QuestTier = 'ember' | 'flame' | 'blaze' | 'inferno';
export type QuestSource = 'handcrafted' | 'template' | 'llm_generated';
export type QuestCompletionType = 'self_report' | 'reflection' | 'timed';
export type QuestSlotType = 'anchor' | 'choice' | 'ember';
export type QuestSlotStatus = 'active' | 'completed' | 'skipped' | 'expired';
export type SubscriptionStatus = 'free_prologue' | 'active_subscriber' | 'grace_period' | 'expired' | 'cancelled';
export type CurrencyType = 'fragments' | 'energy' | 'fog_light';
export type GuideRegister = 'mythic' | 'direct' | 'playful' | 'compassionate';
export type CrisisLevel = 'normal' | 'distress' | 'concern' | 'acute';
export type Archetype = 'the_flame' | 'the_lens' | 'the_bridge' | 'the_edge' | 'the_anchor' | 'the_well';
export type DepthPreference = 'light' | 'moderate' | 'full_depth';
export type FogTileStatus = 'hidden' | 'revealed' | 'dimmed';
export type StoryAct = 'prologue' | 'act_1' | 'act_2' | 'act_3' | 'clearing' | 'post_season';

// Common response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// User profile
export interface UserProfile {
  id: string;
  display_name: string;
  depth_preference: DepthPreference;
  rest_mode: boolean;
  timezone: string;
  subscription_status: SubscriptionStatus;
  prologue_days_remaining: number | null;
  archetype: Archetype | null;
  current_act: StoryAct;
  onboarding_completed: boolean;
  created_at: string;
}

// Stats
export interface EssenceCompass {
  vitality: number;
  clarity: number;
  connection: number;
  valor: number;
  foundation: number;
  depth: number;
  updated_at: string;
}

// Currencies
export interface CurrencyBalances {
  fragments: number;
  energy: number;
  fog_light: number;
}

// Quest
export interface Quest {
  id: string;
  title: string;
  domain: QuestDomain;
  tier: QuestTier;
  description: string;
  instruction: string;
  duration_estimate_min: number;
  time_window: string;
  completion_type: QuestCompletionType;
  reflection_prompt: string | null;
  tags: string[];
  narrative_intro: string;
  narrative_completion: string;
  narrative_skip: string;
}

// Quest Assignment (daily slot)
export interface QuestAssignment {
  id: string;
  quest: Quest;
  slot_type: QuestSlotType;
  status: QuestSlotStatus;
  choice_options?: Quest[];
  assigned_date: string;
  expires_at: string;
}

// Quest Completion
export interface QuestCompletionResult {
  fragments_earned: number;
  energy_earned: number;
  fog_tiles_revealed: number;
  stat_dimension: QuestDomain;
  stat_change: number;
  new_compass: EssenceCompass;
  new_currencies: CurrencyBalances;
  guide_completion_text: string;
  bonus_applied: Record<string, number>;
}

// Fog Map
export interface FogTile {
  tile_index: number;
  ring: number;
  status: FogTileStatus;
  revealed_at: string | null;
  tile_name: string | null;
  tile_description: string | null;
  landmark: boolean;
}

// Guide conversation
export interface ConversationMessage {
  id: string;
  role: 'user' | 'guide';
  content: string;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  started_at: string;
  messages: ConversationMessage[];
  register: GuideRegister;
}

// Weekly cycle
export interface WeeklyCycleStatus {
  week_start: string;
  week_end: string;
  anchor_completed: number;
  choice_completed: number;
  ember_completed: number;
  full_cycle_achieved: boolean;
  perfect_cycle: boolean;
  days_remaining: number;
}

// Season progress
export interface SeasonProgress {
  season_number: number;
  current_act: StoryAct;
  story_flags: string[];
  discovery_1_completed: boolean;
  discovery_2_completed: boolean;
  discovery_3_completed: boolean;
  total_quests_completed: number;
  total_fog_tiles_revealed: number;
  days_active: number;
}

// Narrative beat
export interface NarrativeBeat {
  id: string;
  content_type: string;
  title: string;
  content: {
    guide_text: string;
    choices?: { id: string; text: string }[];
    animation_cue?: string;
  };
}
