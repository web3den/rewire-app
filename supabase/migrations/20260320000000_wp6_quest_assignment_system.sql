-- ============================================================
-- WP6: Quest Assignment System, Spark Economy, Anti-Gaming
-- Migration: 20260320000000
-- ============================================================

-- §1: NEW ENUMS
-- (Sparks is its own currency type already in initial schema)

-- §2: NEW TABLES

-- User Spark balance (refreshes, economy cap)
CREATE TABLE IF NOT EXISTS user_sparks (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  sparks INT NOT NULL DEFAULT 0 CHECK (sparks >= 0 AND sparks <= 20),
  last_earned TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sparks_updated ON user_sparks(updated_at);

-- Refresh attempt tracking (prevent infinite rerolls)
CREATE TABLE IF NOT EXISTS quest_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  refresh_date DATE NOT NULL,
  refresh_count_after INT NOT NULL CHECK (refresh_count_after >= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, refresh_date)
);

CREATE INDEX idx_quest_refresh_log_user_date ON quest_refresh_log(user_id, refresh_date DESC);

-- Anti-cherry-pick: track domains user avoids
CREATE TABLE IF NOT EXISTS refresh_away_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  domain quest_domain NOT NULL,
  refresh_count INT NOT NULL DEFAULT 1 CHECK (refresh_count > 0),
  last_refresh TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(user_id, domain),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_away_user_domain ON refresh_away_tracking(user_id, domain);
CREATE INDEX idx_refresh_away_reset ON refresh_away_tracking(reset_at);

-- Choice assignment history (which options were shown/chosen)
CREATE TABLE IF NOT EXISTS quest_choice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  option_1_quest_id UUID REFERENCES quests(id),
  option_2_quest_id UUID REFERENCES quests(id),
  option_3_quest_id UUID REFERENCES quests(id),
  chosen_quest_id UUID REFERENCES quests(id),
  refresh_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assignment_date, refresh_count)
);

CREATE INDEX idx_quest_choice_history_user ON quest_choice_history(user_id, assignment_date);

-- §3: PL/pgSQL FUNCTIONS

-- ────────────────────────────────────────────────────────────
-- FUNCTION: Select daily Anchor quest
-- Weights: 40% story, 30% weakest stat, 20% energy, 10% anti-rep
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION select_anchor_quest(
  p_user_id UUID,
  p_today DATE
)
RETURNS TABLE (
  quest_id UUID,
  title TEXT,
  domain quest_domain,
  tier quest_tier,
  score NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_candidate RECORD;
  v_tier quest_tier;
  v_week INT;
  v_story_score NUMERIC;
  v_weakness_score NUMERIC;
  v_energy_score NUMERIC;
  v_anti_rep_score NUMERIC;
  v_final_score NUMERIC;
  v_current_stat NUMERIC;
  v_recent_domains quest_domain[];
BEGIN
  -- Determine tier based on progression (week)
  SELECT 
    EXTRACT(WEEK FROM (NOW() - up.prologue_start_date))::INT
  INTO v_week
  FROM user_profiles up
  WHERE up.id = p_user_id;

  v_tier := CASE 
    WHEN v_week <= 1 THEN 'ember'::quest_tier
    WHEN v_week <= 2 THEN 'flame'::quest_tier
    ELSE 'blaze'::quest_tier
  END;

  -- Get recent domains (last 3 days of Anchors)
  SELECT ARRAY_AGG(DISTINCT domain) INTO v_recent_domains
  FROM quest_assignments qa
  JOIN quests q ON q.id = qa.quest_id
  WHERE qa.user_id = p_user_id
    AND qa.slot_type = 'anchor'
    AND qa.assigned_date >= p_today - 2;

  v_recent_domains := COALESCE(v_recent_domains, ARRAY[]::quest_domain[]);

  -- For each candidate quest, calculate score
  FOR v_candidate IN
    SELECT 
      q.id, q.title, q.domain, q.tier, q.resistance_multiplier,
      us.vitality, us.clarity, us.connection, us.valor, us.foundation, us.depth
    FROM quests q
    CROSS JOIN user_stats us
    WHERE q.is_active = TRUE
      AND q.tier = v_tier
      AND q.domain NOT IN (SELECT unnest(v_recent_domains))
      AND us.user_id = p_user_id
    ORDER BY RANDOM()
    LIMIT 30  -- Limit candidates to avoid expensive computation
  LOOP
    -- STORY RELEVANCE (40%)
    -- Simple heuristic: domains rotate per act
    v_story_score := CASE 
      WHEN v_candidate.domain IN ('body', 'spirit') THEN 0.9
      WHEN v_candidate.domain IN ('heart', 'mind') THEN 0.8
      ELSE 0.6
    END;

    -- WEAKEST STAT (30%)
    v_current_stat := CASE v_candidate.domain
      WHEN 'body' THEN v_candidate.vitality
      WHEN 'mind' THEN v_candidate.clarity
      WHEN 'heart' THEN v_candidate.connection
      WHEN 'courage' THEN v_candidate.valor
      WHEN 'order' THEN v_candidate.foundation
      WHEN 'spirit' THEN v_candidate.depth
    END;

    v_weakness_score := (100 - v_current_stat) / 100.0;

    -- ENERGY (20%)
    -- Heuristic: if evening, favor 'anytime' or 'evening' quests
    v_energy_score := CASE 
      WHEN EXTRACT(HOUR FROM NOW()) >= 18 THEN
        CASE WHEN q.time_window IN ('anytime', 'evening') THEN 0.9 ELSE 0.5 END
      WHEN EXTRACT(HOUR FROM NOW()) <= 9 THEN
        CASE WHEN q.time_window IN ('anytime', 'morning') THEN 0.9 ELSE 0.5 END
      ELSE 0.7
    END;

    -- ANTI-REP (10%)
    v_anti_rep_score := CASE 
      WHEN v_candidate.domain NOT IN (SELECT unnest(v_recent_domains)) THEN 1.0
      ELSE 0.3
    END;

    -- FINAL SCORE
    v_final_score := 
      (0.40 * v_story_score) +
      (0.30 * v_weakness_score) +
      (0.20 * v_energy_score) +
      (0.10 * v_anti_rep_score);

    RETURN QUERY SELECT v_candidate.id, v_candidate.title, v_candidate.domain, v_candidate.tier, v_final_score;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- FUNCTION: Generate 3 Choice options (A, B, C with diversity)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_choice_options(
  p_user_id UUID,
  p_today DATE
)
RETURNS TABLE (
  option_1 UUID,
  option_2 UUID,
  option_3 UUID
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_archetype archetype;
  v_tier quest_tier;
  v_primary_domain quest_domain;
  v_secondary_domain quest_domain;
  v_opt_a UUID;
  v_opt_b UUID;
  v_opt_c UUID;
  v_opt_a_domain quest_domain;
  v_opt_b_domain quest_domain;
  v_opt_c_domain quest_domain;
  v_unexplored_domain quest_domain;
  v_all_domains quest_domain[] := ARRAY['body', 'mind', 'heart', 'courage', 'order', 'spirit'];
  v_forced_domains quest_domain[];
BEGIN
  -- Get user archetype and tier
  SELECT up.archetype INTO v_archetype
  FROM user_profiles up
  WHERE up.id = p_user_id;

  v_tier := 'flame'::quest_tier;  -- Default; can be parameterized

  -- Map archetype to domains
  v_primary_domain := CASE v_archetype
    WHEN 'the_flame' THEN 'body'::quest_domain
    WHEN 'the_lens' THEN 'mind'::quest_domain
    WHEN 'the_bridge' THEN 'heart'::quest_domain
    WHEN 'the_edge' THEN 'courage'::quest_domain
    WHEN 'the_anchor' THEN 'order'::quest_domain
    WHEN 'the_well' THEN 'spirit'::quest_domain
  END;

  v_secondary_domain := CASE v_archetype
    WHEN 'the_flame' THEN 'spirit'::quest_domain
    WHEN 'the_lens' THEN 'order'::quest_domain
    WHEN 'the_bridge' THEN 'heart'::quest_domain
    WHEN 'the_edge' THEN 'courage'::quest_domain
    WHEN 'the_anchor' THEN 'foundation'::quest_domain
    WHEN 'the_well' THEN 'depth'::quest_domain
  END;

  -- OPTION A: Primary domain, current tier
  SELECT id INTO v_opt_a
  FROM quests q
  WHERE q.is_active = TRUE
    AND q.domain = v_primary_domain
    AND q.tier = v_tier
    AND q.id NOT IN (
      SELECT qa.quest_id FROM quest_assignments qa
      WHERE qa.user_id = p_user_id
        AND qa.assigned_date >= p_today - 7
    )
  ORDER BY RANDOM()
  LIMIT 1;

  v_opt_a_domain := v_primary_domain;

  -- OPTION B: Secondary domain OR unexplored (5+ days)
  -- Find least completed domain
  SELECT domain INTO v_unexplored_domain
  FROM (
    SELECT 'body'::quest_domain AS domain UNION ALL
    SELECT 'mind'::quest_domain UNION ALL
    SELECT 'heart'::quest_domain UNION ALL
    SELECT 'courage'::quest_domain UNION ALL
    SELECT 'order'::quest_domain UNION ALL
    SELECT 'spirit'::quest_domain
  ) AS all_domains
  WHERE domain NOT IN (
    SELECT DISTINCT q.domain
    FROM quest_completions qc
    JOIN quests q ON q.id = qc.quest_id
    WHERE qc.user_id = p_user_id
      AND qc.completed_at > NOW() - INTERVAL '5 days'
  )
  ORDER BY RANDOM()
  LIMIT 1;

  v_opt_b_domain := COALESCE(v_secondary_domain, v_unexplored_domain, 'mind'::quest_domain);

  SELECT id INTO v_opt_b
  FROM quests q
  WHERE q.is_active = TRUE
    AND q.domain = v_opt_b_domain
    AND q.tier = v_tier
    AND q.id NOT IN (
      SELECT qa.quest_id FROM quest_assignments qa
      WHERE qa.user_id = p_user_id
        AND qa.assigned_date >= p_today - 7
    )
    AND q.id != v_opt_a
  ORDER BY RANDOM()
  LIMIT 1;

  -- OPTION C: Wildcard (stretch tier)
  v_opt_c_domain := (
    SELECT (ARRAY_REMOVE(v_all_domains, v_opt_a_domain, v_opt_b_domain))[1 + FLOOR(RANDOM() * 4)]
  );

  SELECT id INTO v_opt_c
  FROM quests q
  WHERE q.is_active = TRUE
    AND q.domain = v_opt_c_domain
    AND q.tier IN ('flame'::quest_tier, 'blaze'::quest_tier)  -- Stretch tier
    AND q.id NOT IN (
      SELECT qa.quest_id FROM quest_assignments qa
      WHERE qa.user_id = p_user_id
        AND qa.assigned_date >= p_today - 7
    )
    AND q.id != v_opt_a
    AND q.id != v_opt_b
  ORDER BY RANDOM()
  LIMIT 1;

  RETURN QUERY SELECT v_opt_a, v_opt_b, v_opt_c;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- FUNCTION: Award Sparks on quest completion
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_sparks_on_completion(
  p_user_id UUID,
  p_assignment_id UUID,
  p_completion_date TIMESTAMPTZ
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot_type quest_slot_type;
  v_sparks_earned INT := 0;
  v_refresh_count INT;
  v_current_sparks INT;
  v_new_sparks INT;
  v_today DATE;
  v_week_anchors INT;
  v_completed_today INT;
  v_streak_days INT;
BEGIN
  v_today := p_completion_date::date;

  -- Get assignment slot type
  SELECT slot_type INTO v_slot_type
  FROM quest_assignments
  WHERE id = p_assignment_id;

  -- +1 Spark: Anchor completion
  IF v_slot_type = 'anchor'::quest_slot_type THEN
    v_sparks_earned := v_sparks_earned + 1;
  END IF;

  -- +1 Spark: Choice on first set (no refresh)
  IF v_slot_type = 'choice'::quest_slot_type THEN
    SELECT COALESCE(refresh_count_after, 0) INTO v_refresh_count
    FROM quest_refresh_log
    WHERE user_id = p_user_id
      AND refresh_date = v_today;

    IF v_refresh_count = 0 OR v_refresh_count = 1 THEN
      v_sparks_earned := v_sparks_earned + 1;
    END IF;
  END IF;

  -- +2 Sparks: Weekly cycle (5/7 Anchors)
  SELECT COUNT(*) INTO v_week_anchors
  FROM quest_completions qc
  JOIN quest_assignments qa ON qa.id = qc.assignment_id
  WHERE qc.user_id = p_user_id
    AND qa.slot_type = 'anchor'::quest_slot_type
    AND qc.completed_at >= (v_today - INTERVAL '7 days')::DATE;

  IF v_week_anchors = 5 OR v_week_anchors = 7 THEN
    v_sparks_earned := v_sparks_earned + 2;
  END IF;

  -- +1 Spark: All 3 slots completed today
  SELECT COUNT(DISTINCT qa.slot_type) INTO v_completed_today
  FROM quest_completions qc
  JOIN quest_assignments qa ON qa.id = qc.assignment_id
  WHERE qc.user_id = p_user_id
    AND qc.completed_at::date = v_today;

  IF v_completed_today = 3 THEN
    v_sparks_earned := v_sparks_earned + 1;
  END IF;

  -- +1 Spark: 3+ day streak (on 3rd/7th/etc.)
  SELECT COUNT(DISTINCT qc.completed_at::date) INTO v_streak_days
  FROM quest_completions qc
  JOIN quest_assignments qa ON qa.id = qc.assignment_id
  WHERE qc.user_id = p_user_id
    AND qa.slot_type = 'anchor'::quest_slot_type
    AND qc.completed_at > NOW() - INTERVAL '7 days';

  IF v_streak_days > 0 AND v_streak_days % 3 = 0 THEN
    v_sparks_earned := v_sparks_earned + 1;
  END IF;

  -- Update Sparks (capped at 20)
  SELECT sparks INTO v_current_sparks
  FROM user_sparks
  WHERE user_id = p_user_id;

  v_new_sparks := LEAST((COALESCE(v_current_sparks, 0) + v_sparks_earned), 20);

  INSERT INTO user_sparks (user_id, sparks, last_earned, updated_at)
  VALUES (p_user_id, v_new_sparks, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET sparks = v_new_sparks, last_earned = NOW(), updated_at = NOW();

  RETURN v_sparks_earned;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- FUNCTION: Initialize Sparks on user creation
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION initialize_user_sparks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_sparks (user_id, sparks, updated_at)
  VALUES (NEW.id, 0, NOW());

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initialize_sparks
AFTER INSERT ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_sparks();

-- ────────────────────────────────────────────────────────────
-- FUNCTION: Reset anti-cherry-pick counter if 7 days passed
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reset_cherry_pick_tracking()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE refresh_away_tracking
  SET refresh_count = 1, reset_at = NOW() + INTERVAL '7 days'
  WHERE reset_at <= NOW();
END;
$$;

-- §4: INDEXES for performance

CREATE INDEX IF NOT EXISTS idx_quest_assignments_user_date_slot
  ON quest_assignments(user_id, assigned_date, slot_type);

CREATE INDEX IF NOT EXISTS idx_quest_assignments_quest_id
  ON quest_assignments(quest_id);

CREATE INDEX IF NOT EXISTS idx_quest_completions_user_date
  ON quest_completions(user_id, completed_at DESC);

-- §5: GRANT PERMISSIONS

GRANT SELECT, INSERT, UPDATE ON user_sparks TO anon, authenticated;
GRANT SELECT, INSERT ON quest_refresh_log TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON refresh_away_tracking TO anon, authenticated;
GRANT SELECT, INSERT ON quest_choice_history TO anon, authenticated;

GRANT EXECUTE ON FUNCTION select_anchor_quest TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_choice_options TO anon, authenticated;
GRANT EXECUTE ON FUNCTION award_sparks_on_completion TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_cherry_pick_tracking TO anon, authenticated;

-- End WP6 Migration
