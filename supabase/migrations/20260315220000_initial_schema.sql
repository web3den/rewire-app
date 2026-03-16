-- ============================================================
-- Rewire App — Initial Database Schema
-- Migration: 20260315220000_initial_schema
--
-- This migration creates all types, tables, indexes, RLS policies,
-- functions, and triggers for the Rewire MVP backend.
-- ============================================================

-- ============================================================
-- §1: ENUM TYPES
-- ============================================================

CREATE TYPE quest_domain AS ENUM (
  'body', 'mind', 'heart', 'courage', 'order', 'spirit'
);

CREATE TYPE quest_tier AS ENUM (
  'ember', 'flame', 'blaze', 'inferno'
);

CREATE TYPE quest_source AS ENUM (
  'handcrafted', 'template', 'llm_generated'
);

CREATE TYPE quest_completion_type AS ENUM (
  'self_report', 'reflection', 'timed'
);

CREATE TYPE quest_time_window AS ENUM (
  'morning', 'afternoon', 'evening', 'anytime'
);

CREATE TYPE quest_expiry AS ENUM (
  'today', 'this_week', 'none'
);

CREATE TYPE quest_slot_type AS ENUM (
  'anchor', 'choice', 'ember'
);

CREATE TYPE quest_slot_status AS ENUM (
  'active', 'completed', 'skipped', 'expired'
);

CREATE TYPE subscription_status AS ENUM (
  'free_prologue', 'active_subscriber', 'grace_period', 'expired', 'cancelled'
);

CREATE TYPE currency_type AS ENUM (
  'fragments', 'energy', 'fog_light'
);

CREATE TYPE transaction_reason AS ENUM (
  'quest_completion',
  'reflection_bonus',
  'weekly_cycle_reward',
  'boss_quest_reward',
  'milestone_reward',
  'archetype_discovery',
  'season_completion',
  'awakening_moment',
  'energy_daily_grant',
  'energy_conversation_spend',
  'fog_light_tile_reveal',
  'fog_light_landmark_reveal',
  'fragment_cosmetic_purchase',
  'streak_bonus',
  'system_adjustment'
);

CREATE TYPE guide_register AS ENUM (
  'mythic', 'direct', 'playful', 'compassionate'
);

CREATE TYPE crisis_level AS ENUM (
  'normal', 'distress', 'concern', 'acute'
);

CREATE TYPE narrative_content_type AS ENUM (
  'weekly_beat',
  'discovery_moment',
  'archetype_reveal',
  'boss_wrapper',
  'question_callback',
  'season_event',
  'absence_return',
  'milestone'
);

-- Updated archetype enum: matches the Archetype System doc
-- The Flame (Vitality), The Lens (Clarity), The Bridge (Connection),
-- The Edge (Valor), The Anchor (Foundation), The Well (Depth)
CREATE TYPE archetype AS ENUM (
  'the_flame',   -- Vitality (Body)
  'the_lens',    -- Clarity (Mind)
  'the_bridge',  -- Connection (Heart)
  'the_edge',    -- Valor (Courage)
  'the_anchor',  -- Foundation (Order)
  'the_well'     -- Depth (Spirit)
);

CREATE TYPE depth_preference AS ENUM (
  'light', 'moderate', 'full_depth'
);

CREATE TYPE fog_tile_status AS ENUM (
  'hidden', 'revealed', 'dimmed'
);

CREATE TYPE story_act AS ENUM (
  'prologue', 'act_1', 'act_2', 'act_3', 'clearing', 'post_season'
);

CREATE TYPE season_status AS ENUM (
  'active', 'completed', 'abandoned'
);

-- ============================================================
-- §2: CORE TABLES — Users & Profiles
-- ============================================================

-- Extends Supabase auth.users — this is the application profile
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    VARCHAR(50) NOT NULL DEFAULT 'Traveler',
  date_of_birth   DATE NOT NULL,
  is_minor        BOOLEAN GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM AGE(date_of_birth)) < 18
  ) STORED,
  depth_preference depth_preference NOT NULL DEFAULT 'moderate',
  rest_mode        BOOLEAN NOT NULL DEFAULT FALSE,
  rest_mode_since  TIMESTAMPTZ,
  timezone         TEXT NOT NULL DEFAULT 'UTC',  -- IANA timezone

  -- Subscription
  subscription_status  subscription_status NOT NULL DEFAULT 'free_prologue',
  prologue_start_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_expires TIMESTAMPTZ,
  apple_original_transaction_id TEXT,

  -- Archetype (updated to new system)
  archetype            archetype,
  archetype_assigned_at TIMESTAMPTZ,

  -- The Question (onboarding)
  the_question_answer  TEXT,  -- encrypted at application level

  -- Onboarding state
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  first_quest_completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Meta
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ  -- soft delete for 30-day window
);

CREATE INDEX idx_user_profiles_subscription ON user_profiles(subscription_status);
CREATE INDEX idx_user_profiles_archetype ON user_profiles(archetype);
CREATE INDEX idx_user_profiles_deleted ON user_profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- §3: ESSENCE COMPASS (CHARACTER STATS)
-- ============================================================

CREATE TABLE user_stats (
  user_id     UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Six dimensions (0-100)
  vitality    NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (vitality >= 0 AND vitality <= 100),
  clarity     NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (clarity >= 0 AND clarity <= 100),
  connection  NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (connection >= 0 AND connection <= 100),
  valor       NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (valor >= 0 AND valor <= 100),
  foundation  NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (foundation >= 0 AND foundation <= 100),
  depth       NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (depth >= 0 AND depth <= 100),

  -- Last quest completion date per domain (for decay calculation)
  last_quest_vitality    TIMESTAMPTZ,
  last_quest_clarity     TIMESTAMPTZ,
  last_quest_connection  TIMESTAMPTZ,
  last_quest_valor       TIMESTAMPTZ,
  last_quest_foundation  TIMESTAMPTZ,
  last_quest_depth       TIMESTAMPTZ,

  -- Decay applied through date (to avoid double-applying)
  decay_computed_through DATE NOT NULL DEFAULT CURRENT_DATE,

  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- §4: CURRENCY BALANCES
-- ============================================================

CREATE TABLE user_currencies (
  user_id    UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  fragments  INTEGER NOT NULL DEFAULT 0 CHECK (fragments >= 0),
  energy     INTEGER NOT NULL DEFAULT 5 CHECK (energy >= 0),
  fog_light  INTEGER NOT NULL DEFAULT 0 CHECK (fog_light >= 0),

  -- Energy tracking
  energy_last_reset  DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_earned_today INTEGER NOT NULL DEFAULT 0,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- §5: TRANSACTION LEDGER (append-only audit trail)
-- ============================================================

CREATE TABLE currency_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  currency    currency_type NOT NULL,
  amount      INTEGER NOT NULL,  -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  reason      transaction_reason NOT NULL,
  reference_id UUID,  -- quest_completion_id, cosmetic_purchase_id, etc.
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_currency_tx_user ON currency_transactions(user_id, created_at DESC);
CREATE INDEX idx_currency_tx_reason ON currency_transactions(user_id, reason);

-- ============================================================
-- §6: QUEST LIBRARY (handcrafted + LLM-generated)
-- ============================================================

CREATE TABLE quests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  title           TEXT NOT NULL,
  domain          quest_domain NOT NULL,
  tier            quest_tier NOT NULL,
  source          quest_source NOT NULL DEFAULT 'handcrafted',

  -- Content
  description     TEXT NOT NULL,       -- What the Guide says when delivering
  instruction     TEXT NOT NULL,       -- Clear actionable task
  why             TEXT NOT NULL,       -- Neuroplasticity rationale (shown after)

  -- Timing
  duration_estimate_min INTEGER NOT NULL CHECK (duration_estimate_min > 0),
  time_window     quest_time_window NOT NULL DEFAULT 'anytime',
  expiry          quest_expiry NOT NULL DEFAULT 'today',

  -- Completion
  completion_type quest_completion_type NOT NULL DEFAULT 'self_report',
  reflection_prompt TEXT,

  -- Rewards (hidden until completion)
  resistance_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0
    CHECK (resistance_multiplier >= 1.0 AND resistance_multiplier <= 2.5),
  reward_fragments  INTEGER NOT NULL DEFAULT 10,
  reward_fog_reveal NUMERIC(4,2) NOT NULL DEFAULT 0.3,
  reward_energy     INTEGER NOT NULL DEFAULT 0,
  bonus_conditions  JSONB DEFAULT '{}',

  -- Gating
  prerequisites   TEXT[] DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  safety_flags    TEXT[] DEFAULT '{}',

  -- Narrative wrapper
  narrative_intro      TEXT NOT NULL,
  narrative_completion TEXT NOT NULL,
  narrative_skip       TEXT NOT NULL,

  -- For LLM-generated quests
  generated_for_user  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  review_status       TEXT DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected')),

  -- Versioning
  content_version INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quests_domain_tier ON quests(domain, tier) WHERE is_active = TRUE;
CREATE INDEX idx_quests_source ON quests(source) WHERE is_active = TRUE;
CREATE INDEX idx_quests_tags ON quests USING GIN(tags) WHERE is_active = TRUE;
CREATE INDEX idx_quests_safety ON quests USING GIN(safety_flags) WHERE is_active = TRUE;
CREATE INDEX idx_quests_generated_for ON quests(generated_for_user) WHERE generated_for_user IS NOT NULL;
CREATE INDEX idx_quests_review ON quests(review_status) WHERE review_status = 'pending';

-- ============================================================
-- §7: DAILY QUEST ASSIGNMENTS (3 slots per user per day)
-- ============================================================

CREATE TABLE quest_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  quest_id     UUID NOT NULL REFERENCES quests(id),

  slot_type    quest_slot_type NOT NULL,
  status       quest_slot_status NOT NULL DEFAULT 'active',

  -- For choice slots: the 3 options offered
  choice_options UUID[] DEFAULT '{}',

  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at    TIMESTAMPTZ NOT NULL,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, assigned_date, slot_type)
);

CREATE INDEX idx_quest_assignments_user_date ON quest_assignments(user_id, assigned_date);
CREATE INDEX idx_quest_assignments_active ON quest_assignments(user_id, status)
  WHERE status = 'active';

-- ============================================================
-- §8: QUEST COMPLETIONS
-- ============================================================

CREATE TABLE quest_completions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  quest_id         UUID NOT NULL REFERENCES quests(id),
  assignment_id    UUID REFERENCES quest_assignments(id),

  -- Completion data
  completion_type  quest_completion_type NOT NULL,
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Reflection (encrypted at application level)
  reflection_text  TEXT,
  reflection_depth_score NUMERIC(3,2) CHECK (
    reflection_depth_score IS NULL OR
    (reflection_depth_score >= 0 AND reflection_depth_score <= 1)
  ),

  -- Timer (for timed quests)
  timer_duration_seconds INTEGER,

  -- Rewards granted
  fragments_earned  INTEGER NOT NULL DEFAULT 0,
  energy_earned     INTEGER NOT NULL DEFAULT 0,
  fog_reveal_earned NUMERIC(4,2) NOT NULL DEFAULT 0,
  bonus_applied     JSONB DEFAULT '{}',

  -- Stat changes applied
  stat_dimension    quest_domain NOT NULL,
  stat_change       NUMERIC(5,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_completions_user ON quest_completions(user_id, completed_at DESC);
CREATE INDEX idx_completions_user_domain ON quest_completions(user_id, stat_dimension, completed_at DESC);
CREATE INDEX idx_completions_recent ON quest_completions(user_id, completed_at DESC)
  WHERE completed_at > NOW() - INTERVAL '14 days';

-- ============================================================
-- §9: WEEKLY CYCLES (streak tracking)
-- ============================================================

CREATE TABLE weekly_cycles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  week_start      DATE NOT NULL,  -- Monday
  week_end        DATE NOT NULL,  -- Sunday

  anchor_completed INTEGER NOT NULL DEFAULT 0,
  choice_completed INTEGER NOT NULL DEFAULT 0,
  ember_completed  INTEGER NOT NULL DEFAULT 0,

  -- Rewards
  full_cycle_achieved   BOOLEAN NOT NULL DEFAULT FALSE,
  perfect_cycle         BOOLEAN NOT NULL DEFAULT FALSE,
  rewards_granted       BOOLEAN NOT NULL DEFAULT FALSE,
  fragments_earned      INTEGER NOT NULL DEFAULT 0,
  fog_light_earned      INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_cycles_user ON weekly_cycles(user_id, week_start DESC);

-- ============================================================
-- §10: GUIDE CONVERSATIONS
-- ============================================================

CREATE TABLE conversation_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL while session is in progress; set by the end-session edge function
  -- when the user closes the conversation or after 10 minutes of inactivity.
  ended_at    TIMESTAMPTZ,

  register    guide_register NOT NULL DEFAULT 'mythic',

  energy_spent INTEGER NOT NULL DEFAULT 0,
  crisis_override BOOLEAN NOT NULL DEFAULT FALSE,

  -- LLM costs for this session
  total_input_tokens  INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd      NUMERIC(8,6) NOT NULL DEFAULT 0,
  llm_provider        TEXT,
  llm_model           TEXT,

  summary     TEXT,  -- ≤100 tokens compressed summary

  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_sessions_user ON conversation_sessions(user_id, started_at DESC);
CREATE INDEX idx_conv_sessions_expiry ON conversation_sessions(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE conversation_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  role        TEXT NOT NULL CHECK (role IN ('user', 'guide')),
  content     TEXT NOT NULL,  -- encrypted at application level

  crisis_level crisis_level DEFAULT 'normal',

  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_messages_session ON conversation_messages(session_id, created_at);
CREATE INDEX idx_conv_messages_user ON conversation_messages(user_id, created_at DESC);

-- ============================================================
-- §11: GUIDE MEMORY SYSTEM
-- ============================================================

-- Compressed daily summaries (permanent)
CREATE TABLE conversation_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,

  summary_date DATE NOT NULL,
  summary_text TEXT NOT NULL,  -- ≤100 tokens

  categories  TEXT[] DEFAULT '{}',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, session_id)
);

CREATE INDEX idx_conv_summaries_user ON conversation_summaries(user_id, summary_date DESC);

-- Structured memory facts (max 50 per user)
CREATE TABLE user_memory_facts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  category    TEXT NOT NULL CHECK (category IN (
    'stated_goal', 'behavioral_pattern', 'quest_highlight',
    'personal_fact', 'avoidance_pattern', 'emotional_theme',
    'relationship_note', 'the_question', 'archetype_related'
  )),
  fact_text   TEXT NOT NULL,
  source      TEXT,  -- 'onboarding', 'conversation', 'quest_reflection', 'system'

  importance  INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_facts_user ON user_memory_facts(user_id, importance DESC);

-- ============================================================
-- §12: FOG MAP STATE
-- ============================================================

CREATE TABLE fog_map_state (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  tile_index  INTEGER NOT NULL CHECK (tile_index >= 0 AND tile_index < 100),
  ring        INTEGER NOT NULL CHECK (ring >= 0 AND ring <= 5),

  status      fog_tile_status NOT NULL DEFAULT 'hidden',
  revealed_at TIMESTAMPTZ,
  dimmed_at   TIMESTAMPTZ,

  tile_name   TEXT,
  tile_description TEXT,
  landmark    BOOLEAN NOT NULL DEFAULT FALSE,

  revealed_by TEXT,  -- 'quest_completion', 'weekly_cycle', 'boss_quest', 'fog_light', 'onboarding'
  reference_id UUID,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, tile_index)
);

CREATE INDEX idx_fog_map_user ON fog_map_state(user_id, ring);
CREATE INDEX idx_fog_map_status ON fog_map_state(user_id, status);

-- ============================================================
-- §13: SEASON PROGRESS
-- ============================================================

CREATE TABLE season_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  season_number INTEGER NOT NULL DEFAULT 1,
  status        season_status NOT NULL DEFAULT 'active',

  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,

  current_act   story_act NOT NULL DEFAULT 'act_1',
  story_flags   TEXT[] DEFAULT '{}',

  -- Discovery moments
  discovery_1_completed BOOLEAN NOT NULL DEFAULT FALSE,
  discovery_1_response  JSONB,
  discovery_2_completed BOOLEAN NOT NULL DEFAULT FALSE,
  discovery_2_response  TEXT,
  discovery_3_completed BOOLEAN NOT NULL DEFAULT FALSE,
  discovery_3_response  TEXT,

  -- Season stats snapshot (frozen at completion)
  final_stats   JSONB,
  final_compass JSONB,
  total_quests_completed INTEGER NOT NULL DEFAULT 0,
  total_fog_tiles_revealed INTEGER NOT NULL DEFAULT 5,

  -- Season Wrapped data
  wrapped_generated BOOLEAN NOT NULL DEFAULT FALSE,
  wrapped_data      JSONB,
  wrapped_shared    BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, season_number)
);

CREATE INDEX idx_season_progress_user ON season_progress(user_id, season_number DESC);

-- ============================================================
-- §14: PUSH NOTIFICATIONS
-- ============================================================

CREATE TABLE user_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_token    TEXT NOT NULL,
  platform        TEXT NOT NULL DEFAULT 'ios',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(device_token)
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id) WHERE is_active = TRUE;

CREATE TABLE notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start     TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end       TIME NOT NULL DEFAULT '07:00',
  morning_quest_time    TIME NOT NULL DEFAULT '08:00',
  evening_reflection_time TIME NOT NULL DEFAULT '20:00',

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'morning_quest', 'gentle_nudge', 'evening_reflection',
    'streak_alert', 're_engagement', 'story_beat'
  )),
  copy_text       TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  delivered       BOOLEAN,
  opened          BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notification_log_user ON notification_log(user_id, sent_at DESC);
CREATE INDEX idx_notification_log_recent ON notification_log(user_id, sent_at DESC)
  WHERE sent_at > NOW() - INTERVAL '7 days';

-- ============================================================
-- §15: CRISIS FLAGS (isolated per SEC-006)
-- ============================================================

CREATE TABLE crisis_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  crisis_level    crisis_level NOT NULL,
  trigger_text    TEXT,  -- encrypted
  source          TEXT NOT NULL CHECK (source IN ('reflection', 'conversation', 'system')),

  classifier_type TEXT NOT NULL DEFAULT 'regex+llm',
  confidence      NUMERIC(3,2),

  resource_shown  BOOLEAN NOT NULL DEFAULT FALSE,
  overlay_shown   BOOLEAN NOT NULL DEFAULT FALSE,

  needs_review    BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     TEXT,
  review_notes    TEXT,

  alert_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  alert_channel   TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crisis_events_review ON crisis_events(needs_review, created_at)
  WHERE needs_review = TRUE AND reviewed_at IS NULL;
CREATE INDEX idx_crisis_events_user ON crisis_events(user_id, created_at DESC);

-- ============================================================
-- §16: NARRATIVE CONTENT
-- ============================================================

CREATE TABLE narrative_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  content_type    narrative_content_type NOT NULL,

  story_flag      TEXT,
  archetype_id    archetype,
  act             story_act,
  week_number     INTEGER,
  day_of_week     TEXT CHECK (day_of_week IN ('monday', 'wednesday', 'sunday')),

  title           TEXT NOT NULL,
  content_json    JSONB NOT NULL,

  content_version INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_narrative_type ON narrative_content(content_type, act) WHERE is_active = TRUE;
CREATE INDEX idx_narrative_archetype ON narrative_content(archetype_id) WHERE archetype_id IS NOT NULL;
CREATE INDEX idx_narrative_week ON narrative_content(week_number, day_of_week) WHERE is_active = TRUE;

-- ============================================================
-- §17: COSMETIC SHOP
-- ============================================================

CREATE TABLE cosmetic_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN (
    'fog_theme', 'guide_variant', 'lore_entry', 'side_story', 'compass_frame'
  )),

  cost_fragments  INTEGER NOT NULL CHECK (cost_fragments > 0),

  asset_data      JSONB NOT NULL DEFAULT '{}',
  preview_data    JSONB DEFAULT '{}',

  season          INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_cosmetics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  cosmetic_id     UUID NOT NULL REFERENCES cosmetic_items(id),
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_equipped     BOOLEAN NOT NULL DEFAULT FALSE,

  UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX idx_user_cosmetics_user ON user_cosmetics(user_id);

-- ============================================================
-- §18: GUIDE SCRIPTED RESPONSES (for LLM-down fallback)
-- ============================================================

CREATE TABLE guide_response_bank (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  situation   TEXT NOT NULL,  -- 'quest_delivery', 'completion', 'skip', etc.
  register    guide_register NOT NULL,
  archetype_id archetype,    -- NULL = universal

  content     TEXT NOT NULL,

  weight      INTEGER NOT NULL DEFAULT 1,

  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_response_bank_situation ON guide_response_bank(situation, register)
  WHERE is_active = TRUE;

-- ============================================================
-- §19: LLM COST TRACKING
-- ============================================================

CREATE TABLE llm_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  operation       TEXT NOT NULL CHECK (operation IN (
    'guide_conversation', 'quest_generation', 'reflection_scoring',
    'crisis_classification', 'memory_compression', 'archetype_classification',
    'discovery_classification'
  )),

  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,

  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  cost_usd        NUMERIC(10,6) NOT NULL DEFAULT 0,
  latency_ms      INTEGER NOT NULL DEFAULT 0,

  success         BOOLEAN NOT NULL DEFAULT TRUE,
  error_message   TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_user ON llm_usage_log(user_id, created_at DESC);
CREATE INDEX idx_llm_usage_operation ON llm_usage_log(operation, created_at DESC);
CREATE INDEX idx_llm_usage_cost ON llm_usage_log(created_at DESC);

-- ============================================================
-- §20: ANALYTICS EVENTS (first-party, anonymous)
-- ============================================================

CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_date ON analytics_events(created_at DESC);

-- ============================================================
-- §21: DATABASE FUNCTIONS
-- ============================================================

-- Apply decay to user stats (called lazily on profile fetch)
CREATE OR REPLACE FUNCTION compute_stat_decay(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats user_stats%ROWTYPE;
  v_today DATE := CURRENT_DATE;
  v_rest_mode BOOLEAN;
  v_dimensions TEXT[] := ARRAY['vitality','clarity','connection','valor','foundation','depth'];
  v_dim TEXT;
  v_last_quest TIMESTAMPTZ;
  v_days_inactive INTEGER;
  v_decay NUMERIC;
  v_current_val NUMERIC;
BEGIN
  SELECT rest_mode INTO v_rest_mode FROM user_profiles WHERE id = p_user_id;
  IF v_rest_mode THEN RETURN; END IF;

  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_stats.decay_computed_through >= v_today THEN RETURN; END IF;

  FOREACH v_dim IN ARRAY v_dimensions LOOP
    EXECUTE format('SELECT %I FROM user_stats WHERE user_id = $1', 'last_quest_' || v_dim)
      INTO v_last_quest USING p_user_id;
    EXECUTE format('SELECT %I FROM user_stats WHERE user_id = $1', v_dim)
      INTO v_current_val USING p_user_id;

    IF v_last_quest IS NOT NULL THEN
      v_days_inactive := EXTRACT(DAY FROM (v_today - v_last_quest::date));
      IF v_days_inactive > 3 THEN
        v_decay := (v_days_inactive - 3) * 0.5;
        v_current_val := GREATEST(v_current_val - v_decay, 10);
        EXECUTE format('UPDATE user_stats SET %I = $1 WHERE user_id = $2', v_dim)
          USING v_current_val, p_user_id;
      END IF;
    END IF;
  END LOOP;

  UPDATE user_stats
  SET decay_computed_through = v_today, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Calculate stat gain from quest completion
CREATE OR REPLACE FUNCTION calculate_stat_gain(
  p_user_id UUID,
  p_domain quest_domain,
  p_tier quest_tier,
  p_resistance_multiplier NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_base NUMERIC;
  v_tier_mult NUMERIC := 1.0;
  v_streak_mod NUMERIC := 1.0;
  v_dim_returns NUMERIC := 1.0;
  v_current_val NUMERIC;
  v_dim_col TEXT;
  v_weakest_dims quest_domain[];
  v_streak_days INTEGER;
BEGIN
  v_base := CASE p_tier
    WHEN 'ember' THEN 2
    WHEN 'flame' THEN 4
    WHEN 'blaze' THEN 7
    WHEN 'inferno' THEN 15
  END;

  v_dim_col := CASE p_domain
    WHEN 'body' THEN 'vitality'
    WHEN 'mind' THEN 'clarity'
    WHEN 'heart' THEN 'connection'
    WHEN 'courage' THEN 'valor'
    WHEN 'order' THEN 'foundation'
    WHEN 'spirit' THEN 'depth'
  END;

  EXECUTE format('SELECT %I FROM user_stats WHERE user_id = $1', v_dim_col)
    INTO v_current_val USING p_user_id;

  -- Weakest-2-dimensions bonus (1.3x)
  WITH ranked AS (
    SELECT unnest(ARRAY['vitality','clarity','connection','valor','foundation','depth']) AS dim,
           unnest(ARRAY[vitality, clarity, connection, valor, foundation, depth]) AS val
    FROM user_stats WHERE user_id = p_user_id
    ORDER BY val ASC
    LIMIT 2
  )
  SELECT CASE WHEN v_dim_col IN (SELECT dim FROM ranked) THEN 1.3 ELSE 1.0 END
    INTO v_tier_mult;

  -- Streak modifier
  SELECT COUNT(DISTINCT completed_at::date)
  INTO v_streak_days
  FROM quest_completions
  WHERE user_id = p_user_id
    AND completed_at > NOW() - INTERVAL '7 days';

  v_streak_mod := CASE
    WHEN v_streak_days >= 7 THEN 1.2
    WHEN v_streak_days >= 5 THEN 1.15
    WHEN v_streak_days >= 3 THEN 1.1
    ELSE 1.0
  END;

  -- Diminishing returns
  v_dim_returns := CASE
    WHEN v_current_val >= 90 THEN 0.5
    WHEN v_current_val >= 75 THEN 0.7
    WHEN v_current_val >= 50 THEN 0.85
    ELSE 1.0
  END;

  RETURN ROUND(v_base * v_tier_mult * p_resistance_multiplier * v_streak_mod * v_dim_returns, 2);
END;
$$;

-- Reset daily energy (called on first API hit of the day)
CREATE OR REPLACE FUNCTION reset_daily_energy(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_sub_status subscription_status;
  v_last_reset DATE;
BEGIN
  SELECT uc.energy_last_reset, up.subscription_status
  INTO v_last_reset, v_sub_status
  FROM user_currencies uc
  JOIN user_profiles up ON up.id = uc.user_id
  WHERE uc.user_id = p_user_id;

  IF v_last_reset < CURRENT_DATE THEN
    UPDATE user_currencies
    SET energy = CASE
          WHEN v_sub_status IN ('active_subscriber', 'grace_period') THEN 999
          ELSE 5
        END,
        energy_last_reset = CURRENT_DATE,
        energy_earned_today = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Weekly cycle evaluation
CREATE OR REPLACE FUNCTION evaluate_weekly_cycles()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_cycle RECORD;
  v_fragments INTEGER;
  v_fog_light INTEGER;
BEGIN
  FOR v_cycle IN
    SELECT wc.*, up.rest_mode
    FROM weekly_cycles wc
    JOIN user_profiles up ON up.id = wc.user_id
    WHERE wc.week_end = CURRENT_DATE - 1
      AND wc.rewards_granted = FALSE
      AND up.deleted_at IS NULL
  LOOP
    IF v_cycle.rest_mode THEN CONTINUE; END IF;

    IF v_cycle.anchor_completed >= 7 THEN
      v_fragments := 200;
      v_fog_light := 2;
      UPDATE weekly_cycles SET
        full_cycle_achieved = TRUE, perfect_cycle = TRUE,
        rewards_granted = TRUE, fragments_earned = v_fragments,
        fog_light_earned = v_fog_light, updated_at = NOW()
      WHERE id = v_cycle.id;
    ELSIF v_cycle.anchor_completed >= 5 THEN
      v_fragments := 100;
      v_fog_light := 1;
      UPDATE weekly_cycles SET
        full_cycle_achieved = TRUE, rewards_granted = TRUE,
        fragments_earned = v_fragments, fog_light_earned = v_fog_light,
        updated_at = NOW()
      WHERE id = v_cycle.id;
    ELSE
      v_fragments := v_cycle.anchor_completed * 15;
      v_fog_light := 0;
      UPDATE weekly_cycles SET
        rewards_granted = TRUE, fragments_earned = v_fragments,
        updated_at = NOW()
      WHERE id = v_cycle.id;
    END IF;

    IF v_fragments > 0 THEN
      UPDATE user_currencies SET
        fragments = fragments + v_fragments,
        updated_at = NOW()
      WHERE user_id = v_cycle.user_id;

      INSERT INTO currency_transactions (user_id, currency, amount, balance_after, reason)
      SELECT v_cycle.user_id, 'fragments', v_fragments,
        (SELECT fragments FROM user_currencies WHERE user_id = v_cycle.user_id),
        'weekly_cycle_reward';
    END IF;

    IF v_fog_light > 0 THEN
      UPDATE user_currencies SET
        fog_light = fog_light + v_fog_light,
        updated_at = NOW()
      WHERE user_id = v_cycle.user_id;

      INSERT INTO currency_transactions (user_id, currency, amount, balance_after, reason)
      SELECT v_cycle.user_id, 'fog_light', v_fog_light,
        (SELECT fog_light FROM user_currencies WHERE user_id = v_cycle.user_id),
        'weekly_cycle_reward';
    END IF;

    INSERT INTO weekly_cycles (user_id, week_start, week_end)
    VALUES (v_cycle.user_id, CURRENT_DATE, CURRENT_DATE + 6)
    ON CONFLICT (user_id, week_start) DO NOTHING;
  END LOOP;
END;
$$;

-- Dim fog tiles for inactive users
CREATE OR REPLACE FUNCTION dim_inactive_fog()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE fog_map_state fms
  SET status = 'dimmed', dimmed_at = NOW(), updated_at = NOW()
  FROM user_profiles up
  WHERE fms.user_id = up.id
    AND fms.status = 'revealed'
    AND up.rest_mode = FALSE
    AND up.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM quest_completions qc
      WHERE qc.user_id = fms.user_id
        AND qc.completed_at > NOW() - INTERVAL '7 days'
    )
    AND fms.revealed_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM conversation_messages cm
  USING conversation_sessions cs
  WHERE cm.session_id = cs.id
    AND cs.expires_at < NOW();

  DELETE FROM user_profiles
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================================
-- §22: INITIALIZATION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create stats
  INSERT INTO user_stats (user_id) VALUES (NEW.id);

  -- Create currencies
  INSERT INTO user_currencies (user_id) VALUES (NEW.id);

  -- Create notification preferences
  INSERT INTO notification_preferences (user_id) VALUES (NEW.id);

  -- Create season progress
  INSERT INTO season_progress (user_id, season_number) VALUES (NEW.id, 1);

  -- Initialize fog map (100 tiles, first 5 revealed)
  INSERT INTO fog_map_state (user_id, tile_index, ring, status, revealed_at, revealed_by, tile_name)
  SELECT NEW.id, t.idx,
    CASE
      WHEN t.idx < 5 THEN 0
      WHEN t.idx < 20 THEN 1
      WHEN t.idx < 45 THEN 2
      WHEN t.idx < 75 THEN 3
      WHEN t.idx < 80 THEN 4
      ELSE 5
    END,
    CASE WHEN t.idx < 5 THEN 'revealed' ELSE 'hidden' END,
    CASE WHEN t.idx < 5 THEN NOW() ELSE NULL END,
    CASE WHEN t.idx < 5 THEN 'onboarding' ELSE NULL END,
    'Tile ' || t.idx
  FROM generate_series(0, 99) AS t(idx);

  -- Store The Question as a memory fact
  IF NEW.the_question_answer IS NOT NULL THEN
    INSERT INTO user_memory_facts (user_id, category, fact_text, source, importance)
    VALUES (NEW.id, 'the_question', NEW.the_question_answer, 'onboarding', 10);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initialize_user
AFTER INSERT ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_data();

-- ============================================================
-- §23: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fog_map_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

-- User policies: users can read/update their own rows
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users read own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own currencies" ON user_currencies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own transactions" ON currency_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own assignments" ON quest_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own completions" ON quest_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own cycles" ON weekly_cycles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own conversations" ON conversation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own messages" ON conversation_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own summaries" ON conversation_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own memory" ON user_memory_facts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own map" ON fog_map_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own season" ON season_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own devices" ON user_devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own notif prefs" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users read own notifications" ON notification_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own cosmetics" ON user_cosmetics
  FOR SELECT USING (auth.uid() = user_id);

-- Public read for content tables
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quests" ON quests
  FOR SELECT USING (is_active = TRUE AND (generated_for_user IS NULL OR generated_for_user = auth.uid()));

ALTER TABLE narrative_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read narrative" ON narrative_content
  FOR SELECT USING (is_active = TRUE);

ALTER TABLE cosmetic_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cosmetics" ON cosmetic_items
  FOR SELECT USING (is_active = TRUE);

ALTER TABLE guide_response_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read responses" ON guide_response_bank
  FOR SELECT USING (is_active = TRUE);

-- Crisis events: NO user-facing RLS policy. Only service role.
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
