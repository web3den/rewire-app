# WP6: Quest Assignment Algorithm + Edge Functions Spec

## Overview

WP6 delivers:
1. **Quest Assignment Algorithm** — Daily Anchor selection + Choice generation with anti-gaming mechanics
2. **Edge Functions** — `generate-daily-quests`, `refresh-choice-quests`, `complete-quest` with Spark logic
3. **Spark Economy** — Earned currency for quest engagement, capped at 20, prevents infinite refresh abuse

---

## Part A: Quest Assignment Algorithm

### 1. Anchor Quest Selection (Deterministic, Weighted)

**Anchor quests are assigned once per day.** They cannot be refreshed. The algorithm weights:
- 40% Story Relevance (current act, thematic fit)
- 30% Weakest Stat (encourage balanced growth)
- 20% Energy (user's recent energy pattern)
- 10% Anti-Repetition (no same domain 3 days in a row)

**Pseudocode:**

```
FUNCTION select_anchor_quest(user_id: UUID, today: DATE) -> quest_id: UUID
  
  // Skip if Anchor already assigned today
  existing := query(
    SELECT quest_id FROM quest_assignments
    WHERE user_id = user_id
      AND slot_type = 'anchor'
      AND assigned_date = today
  )
  IF existing THEN RETURN existing.quest_id END IF

  // Pool: all active quests, tier matches progression
  progression := get_user_progression(user_id)  // week number, act, etc
  candidate_tier := select_tier_for_week(progression.week)  // ember/flame
  
  candidates := query(
    SELECT id, domain, tier, resistance_multiplier
    FROM quests
    WHERE is_active = TRUE
      AND tier = candidate_tier
      AND domain NOT IN (
        SELECT domain FROM quest_assignments
        WHERE user_id = user_id
          AND slot_type = 'anchor'
          AND assigned_date >= today - 2 days
      )
  )

  // Score each candidate
  FOR EACH quest IN candidates:
    score := 0.0

    // Story relevance (40%)
    story_fit := calculate_story_fit(quest.domain, progression.current_act)
    score += 0.40 * story_fit

    // Weakest stat (30%)
    user_stats := get_user_stats(user_id)
    stat_value := user_stats[domain_to_stat(quest.domain)]
    weakness_penalty := (100 - stat_value) / 100
    score += 0.30 * weakness_penalty

    // Energy (20%) — user likely to complete?
    recent_energy := estimate_user_energy(user_id)  // 0.0-1.0
    is_morning := hour_of_day IN [6, 9]
    is_evening := hour_of_day IN [18, 21]
    energy_fit := calculate_energy_fit(quest.time_window, recent_energy, is_morning, is_evening)
    score += 0.20 * energy_fit

    // Anti-rep (10%)
    recent_domains := get_recent_anchor_domains(user_id, days=3)
    same_domain_count := count(recent_domains WHERE domain = quest.domain)
    anti_rep_penalty := max(0, 1.0 - (same_domain_count / 2))
    score += 0.10 * anti_rep_penalty

  // Select highest-scoring quest, with randomization in top 3
  top_3 := sort_by_score(candidates, DESC)[0:3]
  selected := weighted_random_pick(top_3, scores)
  
  RETURN selected.id
END
```

**Database Query (PostgreSQL)**:

```sql
-- Anchor selection helper
WITH scoring AS (
  SELECT 
    q.id,
    q.domain,
    q.tier,
    -- Story relevance: does domain match current act themes?
    CASE 
      WHEN sp.current_act = 'act_1' AND q.domain IN ('body', 'spirit') THEN 0.95
      WHEN sp.current_act = 'act_2' AND q.domain IN ('heart', 'mind') THEN 0.95
      WHEN sp.current_act = 'act_3' AND q.domain IN ('courage', 'order') THEN 0.95
      ELSE 0.5
    END AS story_score,
    -- Weakest stat bonus
    CASE 
      WHEN q.domain = 'body' THEN LEAST(us.vitality, 50) / 50
      WHEN q.domain = 'mind' THEN LEAST(us.clarity, 50) / 50
      WHEN q.domain = 'heart' THEN LEAST(us.connection, 50) / 50
      WHEN q.domain = 'courage' THEN LEAST(us.valor, 50) / 50
      WHEN q.domain = 'order' THEN LEAST(us.foundation, 50) / 50
      WHEN q.domain = 'spirit' THEN LEAST(us.depth, 50) / 50
    END AS weakness_score,
    -- Anti-rep penalty
    (CASE 
      WHEN q.domain NOT IN (
        SELECT domain FROM quest_assignments qa2
        WHERE qa2.user_id = $1
          AND qa2.slot_type = 'anchor'
          AND qa2.assigned_date >= CURRENT_DATE - 2
      ) THEN 1.0
      ELSE 0.3
    END) AS anti_rep_score
  FROM quests q
  CROSS JOIN user_stats us
  CROSS JOIN season_progress sp
  WHERE q.is_active = TRUE
    AND q.tier = $2  -- ember or flame based on progression
    AND us.user_id = $1
    AND sp.user_id = $1
)
SELECT id,
  (0.40 * story_score + 0.30 * weakness_score + 0.20 * 0.8 + 0.10 * anti_rep_score) AS final_score
FROM scoring
ORDER BY final_score DESC, RANDOM()
LIMIT 1;
```

---

### 2. Choice Quest Selection (3-Card Deck with Diversity)

**Users unlock Choice slot after completing their first Anchor.** 3 options appear daily, refreshable 1x free + Spark cost.

**Generation Rules:**
- **Option A:** Primary archetype domain (strong thematic fit), current tier
- **Option B:** Secondary domain OR unexplored domain (5+ days since last quest), current tier
- **Option C:** Wildcard/stretch (random domain, tier = current_tier + 1)
- **Diversity check:** Never all 3 from same domain. At least one different tier.
- **Anti-cherry-pick:** Track refresh-aways. If user refreshes away from Domain X 3 consecutive times, force Domain X into next set.

**Pseudocode:**

```
FUNCTION generate_choice_options(user_id: UUID, today: DATE) -> [quest_id, quest_id, quest_id]

  // Check if refresh used today; if so, get new candidates
  refresh_used_today := query(
    SELECT COUNT(*) FROM quest_assignments
    WHERE user_id = user_id
      AND slot_type = 'choice'
      AND assigned_date = today
      AND status != 'active'  // was refreshed
  )

  // Archetype tendency (from onboarding scenarios)
  archetype := get_user_archetype(user_id)
  primary_domain := archetype_to_primary_domain(archetype)
  secondary_domain := archetype_to_secondary_domain(archetype)

  tier := get_user_tier(user_id)  // ember or flame
  candidate_pool := query(
    SELECT id, domain, tier FROM quests
    WHERE is_active = TRUE
      AND id NOT IN (
        SELECT quest_id FROM quest_assignments
        WHERE user_id = user_id
          AND assigned_date >= today - 7  // avoid 7-day repeats
      )
  )

  // OPTION A: Primary domain, current tier
  opt_a := best_match_in_pool(
    pool = candidate_pool,
    domain = primary_domain,
    tier = tier,
    recent_completion = TRUE
  )

  // OPTION B: Secondary OR unexplored
  unexplored := get_least_completed_domain(user_id, exclude=primary_domain)
  opt_b := best_match_in_pool(
    pool = candidate_pool,
    domain = secondary_domain OR unexplored,
    tier = tier,
    diversity_penalty = MODERATE  // slightly lower if same as A
  )

  // OPTION C: Wildcard (stretch quest)
  wildcard_domain := random_domain(exclude=[opt_a.domain, opt_b.domain])
  opt_c := best_match_in_pool(
    pool = candidate_pool,
    domain = wildcard_domain,
    tier = tier + 1,  // stretch
    random_pick = TRUE
  )

  // Anti-cherry-pick enforcement
  cherry_picked_domains := get_refreshed_away_domains(user_id, count_threshold=3)
  IF opt_b.domain IN cherry_picked_domains THEN
    // Swap B with a forced domain from cherry_picked_domains
    forced_domain := cherry_picked_domains[0]
    opt_b := best_match_in_pool(pool, forced_domain, tier)
  END IF

  // Diversity check
  domains := [opt_a.domain, opt_b.domain, opt_c.domain]
  IF COUNT(UNIQUE(domains)) < 2 THEN
    // Regenerate option B or C to ensure diversity
    RETRY with different constraints
  END IF

  RETURN [opt_a.id, opt_b.id, opt_c.id]
END
```

**Anti-Cherry-Pick Tracking:**

```sql
-- New table: refresh_away_tracking
CREATE TABLE refresh_away_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  domain quest_domain NOT NULL,
  refresh_count INT NOT NULL DEFAULT 1,
  last_refresh TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMPTZ  -- when count resets
);

-- Logic: on each refresh, increment counter for domains NOT chosen
-- Once count reaches 3, force that domain in next set
-- Reset counter when domain is chosen OR 7 days pass
```

---

### 3. Spark Economy (Earned Currency)

**Sparks are earned through quest engagement; they fuel refreshes and prevent infinite rerolling.**

**Earning:**

| Action | Amount | Notes |
|--------|--------|-------|
| Complete an Anchor | +1 | Every day user completes assigned Anchor |
| Complete a Choice on 1st set (no refresh used) | +1 bonus | Encourages accepting initial options |
| Complete full weekly cycle (5/7 Anchors) | +2 | Weekly bonus |
| Complete all 3 slots in one day | +1 | Incentivizes Anchor + Choice + Ember |
| 3+ day streak of Anchor completions | +1 | Compounded streaks |

**Rate:** Engaged user earns ~8-12 Sparks/week. Spending rate: 1 free refresh + 7 extra refreshes = 7 Sparks. Equilibrium around Spark cap of 20.

**Pseudocode:**

```
FUNCTION process_quest_completion(user_id: UUID, quest_id: UUID, assignment_id: UUID)

  assignment := get_assignment(assignment_id)
  quest := get_quest(quest_id)
  
  // Base Spark: Anchor
  IF assignment.slot_type = 'anchor' THEN
    add_sparks(user_id, 1, reason='anchor_complete')
  END IF

  // Bonus Spark: Choice on first set (no refresh)
  IF assignment.slot_type = 'choice' AND assignment.refresh_count = 0 THEN
    add_sparks(user_id, 1, reason='choice_no_refresh_bonus')
  END IF

  // Weekly cycle check
  week_cycle := get_current_week_cycle(user_id)
  week_cycle.anchor_completed += 1
  IF week_cycle.anchor_completed = 5 THEN
    add_sparks(user_id, 2, reason='weekly_5_complete')
  END IF
  IF week_cycle.anchor_completed = 7 THEN
    add_sparks(user_id, 2, reason='weekly_7_complete')  // additional
  END IF

  // All-3-slots check
  completed_today := count_completions_today(user_id, slot_types=['anchor', 'choice', 'ember'])
  IF completed_today = 3 THEN
    add_sparks(user_id, 1, reason='three_slot_day')
  END IF

  // Streak check
  streak_days := count_anchor_streak(user_id)
  IF streak_days % 3 = 0 AND streak_days > 0 THEN
    add_sparks(user_id, 1, reason='streak_milestone_' || streak_days)
  END IF

  // Cap at 20
  current_sparks := get_user_sparks(user_id)
  IF current_sparks > 20 THEN
    set_user_sparks(user_id, 20)
  END IF

END
```

**Refresh Mechanic:**

```
FUNCTION refresh_choice_options(user_id: UUID, today: DATE) -> void

  // Count refreshes today
  refresh_count := query(
    SELECT COUNT(*) FROM quest_refresh_log
    WHERE user_id = user_id
      AND refresh_date = today
  )

  // First refresh is free
  IF refresh_count = 0 THEN
    cost := 0  // FREE
  ELSE
    cost := 1  // 1 Spark per additional refresh
  END IF

  // Check balance
  sparks := get_user_sparks(user_id)
  IF cost > sparks THEN
    RAISE 'Insufficient Sparks'
  END IF

  // Deduct
  IF cost > 0 THEN
    subtract_sparks(user_id, cost, reason='refresh_choice')
  END IF

  // Mark old options as expired
  UPDATE quest_assignments
  SET status = 'expired', updated_at = NOW()
  WHERE user_id = user_id
    AND slot_type = 'choice'
    AND assigned_date = today
    AND status = 'active'

  // Generate new options
  new_options := generate_choice_options(user_id, today)

  // Create new assignment row
  INSERT INTO quest_assignments (user_id, quest_id, slot_type, status, assigned_date)
  VALUES (user_id, new_options[0], 'choice', 'active', today),
         (user_id, new_options[1], 'choice', 'active', today),
         (user_id, new_options[2], 'choice', 'active', today)

  // Log the refresh
  INSERT INTO quest_refresh_log (user_id, refresh_date, refresh_count_after)
  VALUES (user_id, today, refresh_count + 1)

  // Track refresh-aways for anti-cherry-pick
  unselected_domain := (previous option that was not chosen)
  UPDATE refresh_away_tracking
  SET refresh_count = refresh_count + 1,
      last_refresh = NOW()
  WHERE user_id = user_id
    AND domain = unselected_domain
    AND reset_at > NOW()
  
  // Reset counter if 7 days passed
  UPDATE refresh_away_tracking
  SET refresh_count = 1, reset_at = NOW() + 7 DAYS
  WHERE user_id = user_id
    AND last_refresh < NOW() - 7 DAYS

END
```

---

## Part B: Edge Functions

### Function 1: `generate-daily-quests`

**Trigger:** Daily, ~6 AM UTC (user's morning time via timezone pref)  
**Purpose:** Generate Anchor, Choice (if unlocked), and assign Ember quest for the day  
**Returns:** JSON with assigned quests or error

**Implementation:**

```typescript
// supabase/functions/generate-daily-quests/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { user_id } = await req.json();
  if (!user_id) return new Response("Missing user_id", { status: 400 });

  try {
    // 1. Check if already generated today
    const today = new Date().toISOString().split("T")[0];
    const existing = await supabase
      .from("quest_assignments")
      .select("id")
      .eq("user_id", user_id)
      .eq("slot_type", "anchor")
      .eq("assigned_date", today)
      .single();

    if (existing.data) {
      return new Response(JSON.stringify({ message: "Quests already generated today" }), { status: 200 });
    }

    // 2. Select Anchor quest
    const { data: anchorQuest, error: anchorError } = await select_anchor_quest(supabase, user_id, today);
    if (anchorError) throw anchorError;

    // 3. Create Anchor assignment
    const { error: assignError } = await supabase.from("quest_assignments").insert({
      user_id,
      quest_id: anchorQuest.id,
      slot_type: "anchor",
      assigned_date: today,
      expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (assignError) throw assignError;

    // 4. Check if Choice slot is unlocked
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_quest_completed")
      .eq("id", user_id)
      .single();

    let choiceQuests = null;
    if (profile?.first_quest_completed) {
      // 5. Generate Choice options
      choiceQuests = await generate_choice_options(supabase, user_id, today);

      for (const quest_id of choiceQuests) {
        await supabase.from("quest_assignments").insert({
          user_id,
          quest_id,
          slot_type: "choice",
          assigned_date: today,
          expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // 6. Assign Ember quest (always available)
    const { data: emberQuest } = await supabase
      .from("quests")
      .select("id")
      .eq("tier", "ember")
      .order("RANDOM()")
      .limit(1)
      .single();

    if (emberQuest) {
      await supabase.from("quest_assignments").insert({
        user_id,
        quest_id: emberQuest.id,
        slot_type: "ember",
        assigned_date: today,
        expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        anchor: anchorQuest,
        choice_options: choiceQuests,
        ember: emberQuest,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating daily quests:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Helper: Select Anchor
async function select_anchor_quest(supabase: any, user_id: string, today: string) {
  return await supabase.rpc("select_anchor_quest", {
    p_user_id: user_id,
    p_today: today,
  });
}

// Helper: Generate Choice options
async function generate_choice_options(supabase: any, user_id: string, today: string) {
  const { data } = await supabase.rpc("generate_choice_options", {
    p_user_id: user_id,
    p_today: today,
  });
  return data || [];
}
```

---

### Function 2: `refresh-choice-quests`

**Trigger:** User-initiated via "Shuffle" button  
**Purpose:** Replace all 3 Choice options with new ones; deduct Sparks if beyond free daily refresh  
**Returns:** New quest cards or error (e.g., "Insufficient Sparks")

**Implementation:**

```typescript
// supabase/functions/refresh-choice-quests/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { user_id } = await req.json();
  if (!user_id) return new Response("Missing user_id", { status: 400 });

  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Count refreshes today
    const { data: refreshLog } = await supabase
      .from("quest_refresh_log")
      .select("refresh_count_after")
      .eq("user_id", user_id)
      .eq("refresh_date", today)
      .maybeSingle();

    const refreshCount = refreshLog?.refresh_count_after || 0;
    const cost = refreshCount === 0 ? 0 : 1;  // 1st is free, rest cost 1 Spark

    // 2. Check Spark balance if cost > 0
    if (cost > 0) {
      const { data: sparks } = await supabase
        .from("user_currencies")
        .select("sparks")
        .eq("user_id", user_id)
        .single();

      if (!sparks || sparks.sparks < cost) {
        return new Response(
          JSON.stringify({ error: "Insufficient Sparks", sparks_needed: cost, sparks_available: sparks?.sparks || 0 }),
          { status: 402 }  // Payment Required
        );
      }

      // 3. Deduct Spark
      await supabase
        .from("user_currencies")
        .update({ sparks: sparks.sparks - cost, updated_at: new Date().toISOString() })
        .eq("user_id", user_id);

      // Log transaction
      const { data: newBalance } = await supabase
        .from("user_currencies")
        .select("sparks")
        .eq("user_id", user_id)
        .single();

      await supabase.from("currency_transactions").insert({
        user_id,
        currency: "sparks",
        amount: -cost,
        balance_after: newBalance?.sparks || 0,
        reason: "refresh_choice_quests",
      });
    }

    // 4. Mark old Choice assignments as expired
    await supabase
      .from("quest_assignments")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", user_id)
      .eq("slot_type", "choice")
      .eq("assigned_date", today)
      .eq("status", "active");

    // 5. Generate new Choice options
    const newOptions = await generate_choice_options(supabase, user_id, today);

    // 6. Insert new assignments
    for (const quest_id of newOptions) {
      await supabase.from("quest_assignments").insert({
        user_id,
        quest_id,
        slot_type: "choice",
        assigned_date: today,
        expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // 7. Update refresh log
    if (refreshLog) {
      await supabase
        .from("quest_refresh_log")
        .update({ refresh_count_after: refreshCount + 1, updated_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("refresh_date", today);
    } else {
      await supabase.from("quest_refresh_log").insert({
        user_id,
        refresh_date: today,
        refresh_count_after: 1,
      });
    }

    // 8. Get the new quest details
    const { data: newQuests } = await supabase
      .from("quests")
      .select("*")
      .in("id", newOptions);

    return new Response(
      JSON.stringify({
        success: true,
        sparks_cost: cost,
        new_options: newQuests,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error refreshing choice quests:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function generate_choice_options(supabase: any, user_id: string, today: string) {
  const { data } = await supabase.rpc("generate_choice_options", {
    p_user_id: user_id,
    p_today: today,
  });
  return data || [];
}
```

---

### Function 3: `complete-quest` (Updated with Spark logic)

**Trigger:** User submits "Done" on quest card  
**Purpose:** Record completion, award stats + currencies + Sparks, update fog map, prepare next quest  
**Returns:** Reward moment data (stat gains, Kael response, etc.)

**Implementation excerpt (Spark portions):**

```typescript
// supabase/functions/complete-quest/index.ts (EXCERPT)

serve(async (req: Request) => {
  // ... existing completion logic ...

  // 5. CALCULATE SPARK REWARDS
  const { data: assignment } = await supabase
    .from("quest_assignments")
    .select("slot_type")
    .eq("id", assignment_id)
    .single();

  let sparkGains = 0;

  // Spark: Anchor completion
  if (assignment.slot_type === "anchor") {
    sparkGains += 1;
  }

  // Spark bonus: Choice on first set (no refresh used)
  if (assignment.slot_type === "choice") {
    const { data: refreshLog } = await supabase
      .from("quest_refresh_log")
      .select("refresh_count_after")
      .eq("user_id", user_id)
      .eq("refresh_date", today)
      .maybeSingle();

    if (!refreshLog || refreshLog.refresh_count_after === 1) {
      // No refresh OR only 1 refresh = first set
      sparkGains += 1;
    }
  }

  // Weekly cycle and other spark bonuses (in separate function)
  const weeklyBonus = await calculate_weekly_sparks(supabase, user_id);
  sparkGains += weeklyBonus;

  // Add Sparks with cap
  if (sparkGains > 0) {
    const { data: currentCurrencies } = await supabase
      .from("user_currencies")
      .select("sparks")
      .eq("user_id", user_id)
      .single();

    const newSparks = Math.min((currentCurrencies?.sparks || 0) + sparkGains, 20);  // Cap at 20

    await supabase
      .from("user_currencies")
      .update({ sparks: newSparks, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);

    // Log transaction
    await supabase.from("currency_transactions").insert({
      user_id,
      currency: "sparks",
      amount: sparkGains,
      balance_after: newSparks,
      reason: `quest_completion_${assignment.slot_type}`,
    });
  }

  // ... rest of completion logic ...
});
```

---

## Part C: Database Additions

### New Tables

```sql
-- Spark economy tracking
CREATE TABLE user_sparks (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  sparks INT NOT NULL DEFAULT 0 CHECK (sparks >= 0 AND sparks <= 20),
  last_earned TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tracking
CREATE TABLE quest_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  refresh_date DATE NOT NULL,
  refresh_count_after INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, refresh_date)
);

-- Anti-cherry-pick enforcement
CREATE TABLE refresh_away_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  domain quest_domain NOT NULL,
  refresh_count INT NOT NULL DEFAULT 1,
  last_refresh TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(user_id, domain)
);
```

### PL/pgSQL Functions

```sql
-- Generate Anchor quest (called by edge function)
CREATE OR REPLACE FUNCTION generate_choice_options(
  p_user_id UUID,
  p_today DATE
)
RETURNS TABLE (option_1 UUID, option_2 UUID, option_3 UUID)
LANGUAGE plpgsql
AS $$
-- Implementation per algorithm section above
$$;

-- Calculate weekly Spark bonuses
CREATE OR REPLACE FUNCTION calculate_weekly_sparks(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_week_cycle RECORD;
  v_sparks INT := 0;
  v_completed_today INT;
  v_streak_days INT;
BEGIN
  -- 5 Anchor completions this week = +2 Sparks
  SELECT COUNT(*) INTO v_completed_today
  FROM quest_completions qc
  JOIN quest_assignments qa ON qa.id = qc.assignment_id
  WHERE qc.user_id = p_user_id
    AND qa.slot_type = 'anchor'
    AND qc.completed_at::date = CURRENT_DATE;

  -- All 3 slots completed today = +1 Spark
  IF v_completed_today = 3 THEN v_sparks := v_sparks + 1; END IF;

  -- 3+ day streak = +1 Spark (on the 3rd day)
  SELECT COUNT(DISTINCT completed_at::date) INTO v_streak_days
  FROM quest_completions
  WHERE user_id = p_user_id
    AND completed_at > NOW() - INTERVAL '7 days';

  IF v_streak_days = 3 OR v_streak_days = 7 THEN
    v_sparks := v_sparks + 1;
  END IF;

  RETURN v_sparks;
END;
$$;
```

---

## Summary: Acceptance Criteria Mapping

| Criteria | Implementation |
|----------|---|
| Anchor: 40% story, 30% weakest stat, 20% energy, 10% anti-rep | Algorithm §1, SQL query with weighted scoring |
| Choice: 3 diverse cards (≥1 tier diff), Option C wildcard | Algorithm §2, diversity check, generate_choice_options() |
| Anti-cherry-pick: force after 3 refreshes away | refresh_away_tracking table + UPDATE logic in refresh function |
| Spark economy: +1 anchor, +1 choice bonus, +2 weekly, +1 three-slot, +1 streak. Max 20. | Process completion logic, weekly calculation, currency cap |
| Refresh: 1 free/day, then Sparks. All-or-nothing. | quest_refresh_log tracking, deduction logic, full replacement |
| Edge functions live | generate-daily-quests, refresh-choice-quests, complete-quest endpoints |

---

## Next Steps (WP6 Part B Implementation)

1. Create `supabase/functions/generate-daily-quests/` and `refresh-choice-quests/`
2. Add PL/pgSQL helpers (select_anchor_quest, generate_choice_options, calculate_weekly_sparks)
3. Add new tables: user_sparks, quest_refresh_log, refresh_away_tracking
4. Update complete-quest to handle Spark rewards
5. Test daily generation flow end-to-end
6. Add UI components: QuestCard, RefreshButton, SparkDisplay

