# Rewire — Complete System Mental Model & Decision Trees

**Date:** 2026-03-16
**Status:** Implementable Specification — Every decision point has a rule.
**Purpose:** A developer reads this and understands the ENTIRE system. No gaps. No "TBD."

---

## Table of Contents

1. [User State Machine](#1-user-state-machine)
2. [Quest Assignment Decision Tree](#2-quest-assignment-decision-tree)
3. [Archetype Evolution Decision Tree](#3-archetype-evolution-decision-tree)
4. [Stat & Economy System](#4-stat--economy-system)
5. [Fog Map Decision Tree](#5-fog-map-decision-tree)
6. [Kael Intelligence Decision Tree](#6-kael-intelligence-decision-tree)
7. [Notification Decision Tree](#7-notification-decision-tree)
8. [Decision Trees (Flowchart-Style)](#8-decision-trees-flowchart-style)
9. [Data Flow Diagram](#9-data-flow-diagram)
10. [Edge Cases & Failure Modes](#10-edge-cases--failure-modes)

---

## 1. User State Machine

### 1.1 Lifecycle States

```
┌─────────────┐
│  PRE_SIGNUP  │ ← App installed, not yet opened
└──────┬──────┘
       │ (opens app)
       ▼
┌─────────────┐
│  ONBOARDING  │ ← Fog intro → Kael intro → "The Question" → Name → "The Breath" → Fog Walk (5 scenarios)
└──────┬──────┘
       │ (completes First Light quest — Day 1)
       ▼
┌─────────────┐
│   PROLOGUE   │ ← Days 1-7. Free trial. No Choice quests. Archetype calibrating.
└──────┬──────┘
       │ (Day 7 complete OR subscribes)
       ▼
┌──────┴──────┐
│  SEASON_1    │ ← Days 8-42 (subscribed) OR Day 7 paywall (not subscribed)
│  ACT_1       │   Act 1: Days 8-14 (Arrival/Exploration)
│  ACT_2       │   Act 2: Days 15-28 (The Path / The Test)
│  ACT_3       │   Act 3: Days 29-42 (The Mirror / The Clearing)
└──────┬──────┘
       │ (completes Season 1 Clearing event)
       ▼
┌─────────────┐
│ POST_SEASON  │ ← Free roam. Daily quests continue. Mentorship unlocks. Season 2 teaser.
└─────────────┘
```

**Transition rules:**

| From | To | Trigger |
|---|---|---|
| PRE_SIGNUP | ONBOARDING | First app open |
| ONBOARDING | PROLOGUE | Completes "The Breath" + Fog Walk. First real quest day begins. |
| PROLOGUE | SEASON_1_ACT_1 | Day 8 AND subscription active. If not subscribed: PAYWALL state (archetype reveal gated). |
| SEASON_1_ACT_1 | SEASON_1_ACT_2 | Day 15 OR 10 Anchor quests completed (whichever comes first) |
| SEASON_1_ACT_2 | SEASON_1_ACT_3 | Day 29 OR 20 Anchor quests completed (whichever comes first) |
| SEASON_1_ACT_3 | POST_SEASON | Completes "The Clearing" boss quest OR Day 42 reached |
| Any → PAYWALL | SEASON_1 | Subscribes |

**Day counting:** "Day N" = Nth calendar day since onboarding completion. If a user completes onboarding on March 1, Day 1 is March 1, Day 7 is March 7.

### 1.2 Track System (A/B)

Two invisible engagement tracks that control difficulty, pacing, and Kael's tone.

**Track A: "Growing"** — For users who are functional or stuck. Standard difficulty.
**Track B: "Steady"** — For users who are struggling or acute. Reduced demands, softer tone.

**Initial assignment (during onboarding check-in):**

```
IF check_in_response == "doing_alright" OR "managing_needs_change"
  THEN track = A
ELSE IF check_in_response == "having_hard_time" OR "just_getting_through"
  THEN track = B
```

**Track transitions (checked daily at quest generation time):**

```
# B → A promotion
IF track == B
  AND completion_rate_last_7_days >= 0.7  (5+ of 7 days had at least 1 quest completed)
  AND days_on_track_B >= 7
  THEN track = A
  # Kael says nothing. Quests just get slightly harder. Choice slot appears if not already.

# A → B demotion
IF track == A
  AND (days_since_any_completion >= 3 OR completion_rate_last_7_days < 0.3)
  AND NOT rest_mode_active
  THEN track = B
  # Kael adjusts tone. Quest difficulty drops. No notification about the change.

# Emergency B assignment
IF crisis_flag_level >= 2 (concern or acute)
  THEN track = B (immediate, regardless of other signals)
```

**Mechanical differences:**

| Aspect | Track A | Track B |
|---|---|---|
| Daily quest slots | Anchor + Choice + Ember | Anchor + Ember (Choice delayed to Week 2) |
| Quest tier ceiling (Week 1) | Flame | Ember |
| Quest tier ceiling (Week 2+) | Blaze | Flame |
| Kael tone | Encouraging, gently challenging | Warm, no "but" after validation |
| "Not feeling it" placement | Small link, bottom of screen | Slightly more visible |
| Micro quest difficulty | Can include standing, walking to window | All completable lying down |
| Rest day grace before check-in | 3 consecutive days | 5 consecutive days |
| Skip-to-check-in threshold | 5 days no engagement | 7 days no engagement |

### 1.3 Engagement States

Orthogonal to lifecycle — tracks how active the user is RIGHT NOW.

```
┌──────────┐
│  ACTIVE   │ ← Opened app in last 48 hours AND completed ≥1 quest in last 72 hours
└────┬─────┘
     │ (no quest completion for 72 hours)
     ▼
┌──────────┐
│ DRIFTING  │ ← 3-5 days since last quest completion. Fog begins dimming.
└────┬─────┘
     │ (no app open for 5+ days)
     ▼
┌──────────┐
│  ABSENT   │ ← 5-14 days since last app open. Stat decay active. Notifications reducing.
└────┬─────┘
     │ (no app open for 14+ days)
     ▼
┌──────────┐
│  DORMANT  │ ← 14+ days. Weekly notification only. App goes quiet.
└──────────┘
```

**Exact thresholds and transitions:**

```
engagement_state = compute_engagement_state(user):

  hours_since_app_open = now() - user.last_app_open_at
  hours_since_quest_completion = now() - user.last_quest_completed_at
  
  IF user.rest_mode_active:
    RETURN RESTING  # Special state. No decay, no notifications, no state transitions.
  
  IF hours_since_quest_completion <= 72:
    RETURN ACTIVE
  ELSE IF hours_since_quest_completion <= 120 (5 days):
    RETURN DRIFTING
  ELSE IF hours_since_app_open <= 336 (14 days):
    RETURN ABSENT
  ELSE:
    RETURN DORMANT
```

**Rest Mode interaction:**

```
IF user activates rest_mode:
  - engagement_state = RESTING (frozen)
  - All notifications disabled
  - Fog decay paused
  - Stat decay paused
  - Weekly cycle timer paused
  - Kael goes silent
  - Crisis resources link shown on activation screen
  
IF user deactivates rest_mode:
  - engagement_state recomputed from current data
  - Kael sends single warm message: "You're back. No questions. What do you need?"
  - Quest board refreshes with appropriate difficulty
  - Weekly cycle restarts fresh (not resumed mid-week)
```

**Return transitions:**

```
# Return from DRIFTING (3-5 days away)
IF engagement_state was DRIFTING AND user completes a quest:
  engagement_state = ACTIVE
  # No special messaging. Normal quest flow resumes.

# Return from ABSENT (5-14 days away)
IF engagement_state was ABSENT AND user opens app:
  Kael: "You're back. That's the only thing that matters."
  Offer single Ember quest to restart.
  engagement_state transitions to ACTIVE once quest completed.
  
# Return from DORMANT (14+ days away)
IF engagement_state was DORMANT AND user opens app:
  IF days_absent < 30:
    Kael: "You're here. I didn't know if you'd come back. I'm glad you did."
    Offer choice: "Where I left off" OR "Fresh start"
    "Where I left off" → resume with recalibrated quests
    "Fresh start" → soft reset: new Anchor, new Choices, same map/stats, clean quest routine
  
  IF days_absent >= 30:
    Kael: "You look different. I look different too."
    Stats decayed to 60% of peak values (floor of 10)
    Full re-onboarding option available (same map preserved)
    Offer choice: "Pick up where I left off" OR "Start fresh" (which resets quest routine, not data)
```

---

## 2. Quest Assignment Decision Tree

### 2.1 Input Variables

The quest assignment algorithm runs once daily at the user's configured morning time (default 8 AM local).

```
INPUTS:
  user.archetype.primary          # e.g., "flame" (Vitality)
  user.archetype.secondary        # e.g., "edge" (Valor)
  user.archetype.confidence       # 0.0-1.0 (low early, grows with behavioral data)
  user.track                      # A or B
  user.engagement_state           # ACTIVE, DRIFTING, etc.
  user.lifecycle_state            # PROLOGUE, SEASON_1_ACT_1, etc.
  user.day_of_season              # 1-42
  user.day_of_week                # 1-7 (Mon-Sun)
  user.stats[6]                   # Current values for all 6 dimensions (0-100)
  user.recent_completions[7]      # Last 7 days: [{quest_id, domain, tier, completed_at}]
  user.recent_skips[7]            # Last 7 days: [{quest_id, domain, tier, skipped_at}]
  user.quest_history[14]          # Last 14 days: all quest IDs shown (for anti-repeat)
  user.weekly_cycle.anchors_done  # 0-7 (how many anchor quests done this week)
  user.mood_signal                # From last check-in or First Light: "heavy"/"restless"/"numb"/null
  user.energy_level               # From First Light slider or recent pattern: 0.0-1.0
  user.max_unlocked_tier          # Highest tier the user has access to
  quest_pool                      # All available quests matching user's unlocked tiers
  current_time                    # For time-window filtering
```

### 2.2 Tier Unlock Rules

```
max_unlocked_tier = compute_max_tier(user):

  IF user.lifecycle_state == PROLOGUE:
    IF user.track == A:
      IF user.day_of_season <= 2: RETURN EMBER
      ELSE: RETURN FLAME
    IF user.track == B:
      RETURN EMBER  # Track B stays Ember through Prologue
  
  IF user.lifecycle_state == SEASON_1_ACT_1:
    IF user.track == A: RETURN FLAME
    IF user.track == B:
      IF user.day_of_season >= 10: RETURN FLAME
      ELSE: RETURN EMBER
  
  IF user.lifecycle_state == SEASON_1_ACT_2:
    IF user.track == A: RETURN BLAZE
    IF user.track == B: RETURN FLAME
  
  IF user.lifecycle_state == SEASON_1_ACT_3:
    RETURN BLAZE  # Both tracks. Inferno is story-gated separately.
  
  # Inferno (boss) quests are NEVER in the regular pool.
  # They appear as special story events at fixed narrative moments.
```

**Tier progression signals (within an act):**

```
# User graduates from current tier to next when ALL conditions met:
tier_up_check(user, current_tier):

  IF current_tier == EMBER:
    required_completions = 5 Ember quests completed
    required_days = day_of_season >= 3
    required_skip_rate = skip_rate_last_7_days < 0.5
    → unlocks FLAME
  
  IF current_tier == FLAME:
    required_completions = 8 Flame quests completed (cumulative)
    required_days = day_of_season >= 14
    required_skip_rate = skip_rate_last_7_days < 0.4
    required_reflection_depth = avg_reflection_depth_last_5 >= 0.4
    → unlocks BLAZE
  
  IF current_tier == BLAZE:
    # Inferno is never "unlocked" by progression. It's story-gated.
    # Boss quests appear at narrative moments: ~Day 28, ~Day 40.
    RETURN no_change
```

### 2.3 The Anchor Quest Selection Algorithm

```
select_anchor_quest(user, quest_pool):

  # Step 1: Determine target domain
  domain_scores = {}
  
  for each domain d in [Body, Mind, Heart, Courage, Order, Spirit]:
    
    # Factor 1: Story act thematic relevance (40%)
    act_theme_weight = get_act_theme_weight(user.lifecycle_state, d)
    # Act 1: all domains equal (0.167 each)
    # Act 2: Courage +0.15, primary archetype domain +0.10
    # Act 3: Spirit +0.15, Heart +0.10, weakest dimension +0.10
    
    # Factor 2: Neglected domain boost (30%)
    days_since_domain_quest = days_since_last_quest_in_domain(user, d)
    neglect_boost = min(days_since_domain_quest / 7.0, 1.0) * 0.3
    # Caps at 1.0 after 7 days. Domain untouched for 7+ days gets max boost.
    
    # Factor 3: Energy-appropriate (20%)
    IF user.energy_level < 0.3:
      energy_fit = 1.0 if d in [Spirit, Mind, Order] else 0.3  # Low-energy-friendly domains
    ELSE IF user.energy_level > 0.7:
      energy_fit = 1.0 if d in [Body, Courage] else 0.6  # High-energy domains
    ELSE:
      energy_fit = 0.8  # Neutral
    energy_weight = energy_fit * 0.2
    
    # Factor 4: Anti-repetition (10%)
    IF d == user.recent_completions[-1].domain AND d == user.recent_completions[-2].domain:
      anti_repeat_penalty = -0.3  # Never same domain 3 days in a row for Anchor
    ELSE:
      anti_repeat_penalty = 0.0
    
    domain_scores[d] = act_theme_weight + neglect_boost + energy_weight + anti_repeat_penalty
  
  target_domain = argmax(domain_scores)
  
  # Step 2: Select quest from pool
  candidates = quest_pool.filter(
    domain == target_domain,
    tier <= user.max_unlocked_tier,
    tier >= max(EMBER, user.max_unlocked_tier - 1),  # Don't assign Ember when Blaze is unlocked
    id NOT IN user.quest_history[14],  # No repeat within 14 days
    time_window includes current_morning_window,
    safety_flags pass user.safety_check
  )
  
  IF candidates is empty:
    # Fallback 1: relax domain constraint — pick from adjacent domain
    target_domain = second_highest(domain_scores)
    candidates = quest_pool.filter(same constraints with new domain)
  
  IF candidates is empty:
    # Fallback 2: relax repeat constraint to 7 days instead of 14
    candidates = quest_pool.filter(
      domain == target_domain,
      tier constraints,
      id NOT IN user.quest_history[7]
    )
  
  IF candidates is empty:
    # Fallback 3: any quest at appropriate tier, any domain, 7-day anti-repeat
    candidates = quest_pool.filter(tier constraints, id NOT IN user.quest_history[7])
  
  # Step 3: Score candidates
  for each quest q in candidates:
    q.score = (
      base_tier_match(q.tier, user.max_unlocked_tier) * 0.4 +
      resistance_value(q.resistance_multiplier, user.track) * 0.3 +
      random_jitter(0.0, 0.3)  # Prevent deterministic selection
    )
  
  RETURN candidates.sort_by(score).first
```

### 2.4 The Choice Quest Selection Algorithm

```
select_choice_options(user, quest_pool, anchor_quest):

  # Choice slot availability:
  IF user.lifecycle_state == PROLOGUE: RETURN empty  # No Choice in Prologue
  IF user.track == B AND user.day_of_season < 8: RETURN empty  # Track B: delayed to Week 2
  
  options = []
  used_domains = [anchor_quest.domain]
  
  # Option A: Primary archetype domain, current tier
  option_a = select_from_pool(
    pool = quest_pool,
    domain = user.archetype.primary_domain,
    tier = user.max_unlocked_tier,
    exclude_domains = used_domains,
    exclude_quest_ids = user.quest_history[7],
    user = user
  )
  IF option_a: 
    options.append(option_a)
    used_domains.append(option_a.domain)
  
  # Option B: Secondary archetype domain OR most-neglected domain (whichever has been untouched longer)
  neglected_domain = most_neglected_domain(user, exclude=used_domains)
  option_b_domain = user.archetype.secondary_domain
  IF days_since_last_quest(user, neglected_domain) > days_since_last_quest(user, option_b_domain) + 3:
    option_b_domain = neglected_domain  # Override if a domain has been really ignored
  
  option_b = select_from_pool(
    pool = quest_pool,
    domain = option_b_domain,
    tier = user.max_unlocked_tier,
    exclude_domains = used_domains,
    exclude_quest_ids = user.quest_history[7],
    user = user
  )
  IF option_b:
    options.append(option_b)
    used_domains.append(option_b.domain)
  
  # Option C: Wildcard — random domain from remaining, tier may be +1 (stretch)
  remaining_domains = all_domains - used_domains
  wildcard_domain = random.choice(remaining_domains)
  wildcard_tier = min(user.max_unlocked_tier + 1, BLAZE)  # Can stretch 1 tier above
  # But if track B, wildcard tier = user.max_unlocked_tier (no stretch)
  IF user.track == B: wildcard_tier = user.max_unlocked_tier
  
  option_c = select_from_pool(
    pool = quest_pool,
    domain = wildcard_domain,
    tier = wildcard_tier,
    exclude_quest_ids = user.quest_history[7],
    user = user
  )
  IF option_c: options.append(option_c)
  
  # Guarantee 3 options. If any slot failed, fill from any available domain/tier.
  WHILE len(options) < 3:
    filler = select_from_pool(
      pool = quest_pool,
      domain = random.choice(all_domains - [o.domain for o in options]),
      tier = user.max_unlocked_tier,
      exclude_quest_ids = [o.id for o in options] + user.quest_history[7],
      user = user
    )
    IF filler: options.append(filler)
    ELSE: break  # Truly exhausted pool — show fewer options
  
  RETURN options  # 1-3 options (ideally 3)
```

### 2.5 The Ember Quest Selection Algorithm

```
select_ember_quest(user, quest_pool, anchor_quest, choice_options):

  used_domains = [anchor_quest.domain] + [o.domain for o in choice_options]
  
  # Ember quest: always Ember tier, quick, different domain from other slots if possible
  preferred_domain = random.choice(all_domains - used_domains) if (all_domains - used_domains) else random.choice(all_domains)
  
  candidates = quest_pool.filter(
    tier == EMBER,
    domain == preferred_domain,
    id NOT IN user.quest_history[7],
    duration_estimate_min <= 5
  )
  
  IF candidates is empty:
    candidates = quest_pool.filter(tier == EMBER, id NOT IN user.quest_history[7])
  
  IF candidates is empty:
    candidates = quest_pool.filter(tier == EMBER)  # Allow repeats — Ember must always exist
  
  RETURN random.choice(candidates)
```

### 2.6 Refresh Mechanics

```
on_refresh_request(user, choice_slot_index):

  # Check if free refresh available
  IF user.daily_free_refreshes_remaining > 0:
    cost = 0
    user.daily_free_refreshes_remaining -= 1
  ELSE:
    cost = 1  # 1 Spark
    IF user.sparks < 1: RETURN error("Not enough Sparks")
    user.sparks -= 1
  
  # Count refreshes today
  user.refreshes_today += 1
  
  IF user.refreshes_today >= 3:
    # Show "all feel wrong" escape hatch
    RETURN offer_escape_hatch(user)
  
  # Generate 3 new options (completely replace — no keeping old ones)
  new_options = select_choice_options(user, quest_pool, anchor_quest)
  
  # Anti-domain-avoidance check:
  avoided_domain = detect_avoided_domain(user)
  IF avoided_domain AND user.consecutive_refresh_aways_from[avoided_domain] >= 3:
    # Force the avoided domain into one slot
    forced_quest = select_from_pool(pool, domain=avoided_domain, tier=user.max_unlocked_tier)
    IF forced_quest:
      new_options[random.randint(0,2)] = forced_quest
      # Kael: "I notice you keep walking past the hard ones. That's fine. But I'm going to keep showing them to you."
  
  RETURN new_options

detect_avoided_domain(user):
  # Check last 3 refreshes. If all 3 had a domain present that was refreshed away:
  for domain in all_domains:
    if user.refresh_away_count[domain] >= 3 (consecutive):
      return domain
  return null

offer_escape_hatch(user):
  RETURN {
    type: "escape_hatch",
    options: [
      {label: "Something easier", action: "offer_ember_in_primary_domain"},
      {label: "Something different", action: "offer_surprise_quest"}
    ]
  }
```

### 2.7 Edge Cases in Quest Assignment

**Pool exhaustion (all quests at tier seen within 14 days):**
1. Relax anti-repeat to 7 days
2. If still exhausted: relax to 3 days
3. If still exhausted: allow same-quest repeats, but Kael reframes: *"This one came back around. Sometimes repetition is the quest."*
4. For Week 3+: trigger LLM quest generation batch to expand pool

**User only does one domain (e.g., Body every time):**
- Anchor algorithm's "neglect boost" (Factor 2) will increasingly force other domains
- After 7 days of a domain being ignored, its neglect_boost hits maximum (0.3)
- Choice options always include at least 1 non-primary domain
- Kael addresses it narratively at Day 14+ if imbalance > 40 points: *"You're growing in one direction. What are you avoiding?"*

**User completed everything at their tier:**
- Tier progression check runs daily
- If all conditions met → unlock next tier
- If conditions not met but pool feels stale → LLM batch generates 2-3 fresh quests
- If at max tier (Blaze) and feeling repetitive → surface Inferno boss quest if story-ready, OR generate novel quests via LLM

**All 3 Choice options are in domains user's been avoiding:**
- This is intentional when neglect is high. It's the system working as designed.
- The free refresh gives them an out
- The Ember quest is always there as a safe fallback
- Option C (wildcard) is from a random domain, so this situation is rare — requires user to be avoiding 3+ domains simultaneously

---

## 3. Archetype Evolution Decision Tree

### 3.1 Data Model

```
archetype_state = {
  vector: [float; 6],           # Running affinity scores: [vitality, clarity, connection, valor, foundation, depth]
  primary: string,               # Current primary archetype name
  secondary: string,             # Current secondary archetype name
  confidence: float,             # 0.0-1.0
  onboarding_signal: [float; 6], # Original Fog Walk scores, preserved
  revealed: bool,                # Has the archetype been revealed to the user?
  revealed_at: datetime | null,  # When the reveal happened
  last_recalc: datetime          # Last time the vector was updated
}
```

### 3.2 Initialization (Fog Walk Onboarding)

After the 5 Fog Walk scenarios, each with a choice mapping to 2 dimensions:

```
initialize_archetype(fog_walk_responses):

  raw_scores = [0, 0, 0, 0, 0, 0]  # [vitality, clarity, connection, valor, foundation, depth]
  
  for each scenario_response in fog_walk_responses:
    raw_scores[response.primary_dimension] += response.primary_weight   # +2
    raw_scores[response.secondary_dimension] += response.secondary_weight # +1
  
  # Normalize to 0.0-1.0 range (max possible per dimension is ~12, typical is 4-8)
  vector = [score / 12.0 for score in raw_scores]
  
  # Tie-breaking: if top 2 scores are within 0.05, use response_time as tiebreaker
  # (faster response = more instinctive = higher confidence in that dimension)
  sorted_dims = sort_by_score_then_speed(vector, fog_walk_response_times)
  
  primary = sorted_dims[0]
  secondary = sorted_dims[1]
  confidence = 0.3  # Low. This is a 5-question signal.
  
  RETURN archetype_state = {
    vector: vector,
    primary: primary,
    secondary: secondary,
    confidence: 0.3,
    onboarding_signal: vector.copy(),
    revealed: false,
    revealed_at: null
  }
```

### 3.3 Daily Update Algorithm

Runs once daily at end-of-day processing (midnight local time).

```
update_archetype_daily(user):

  day = user.day_of_season
  state = user.archetype_state
  
  # Compute behavioral signal from today's data
  behavioral_signal = [0.0; 6]
  
  for each dimension d:
    
    # Signal 1: Quest completion rate in this domain (weight: 0.35)
    quests_offered_in_d = count(user.today_quests where domain == d)
    quests_completed_in_d = count(user.today_completions where domain == d)
    IF quests_offered_in_d > 0:
      completion_rate = quests_completed_in_d / quests_offered_in_d
    ELSE:
      completion_rate = 0.5  # Neutral if not offered
    
    # Signal 2: Quest skip/avoidance inverse (weight: 0.25)
    quests_skipped_in_d = count(user.today_skips where domain == d)
    avoidance_signal = 1.0 - (quests_skipped_in_d / max(quests_offered_in_d, 1))
    
    # Signal 3: Reflection theme presence (weight: 0.15)
    # LLM analysis of today's reflections: how much does dimension d appear in themes?
    reflection_presence = llm_theme_score(user.today_reflections, d)  # 0.0-1.0
    
    # Signal 4: Kael conversation theme presence (weight: 0.10)
    conversation_presence = llm_theme_score(user.today_conversations, d)  # 0.0-1.0
    
    # Signal 5: Quest acceptance speed (weight: 0.08)
    # How quickly did user accept quests in this domain vs others?
    acceptance_speed = normalize_acceptance_speed(user.today_acceptance_times, d)  # 0.0-1.0
    
    # Signal 6: Quest time investment (weight: 0.07)
    # Did user spend more time on quests in this domain?
    time_investment = normalize_time_investment(user.today_quest_durations, d)  # 0.0-1.0
    
    behavioral_signal[d] = (
      completion_rate * 0.35 +
      avoidance_signal * 0.25 +
      reflection_presence * 0.15 +
      conversation_presence * 0.10 +
      acceptance_speed * 0.08 +
      time_investment * 0.07
    )
  
  # Compute decay factor and learning rate based on day
  # Days 1-3: Trust onboarding heavily (decay=0.85, learn=0.15)
  # Days 4-7: Start shifting (decay=0.75, learn=0.25)
  # Days 8-14: Behavioral data dominant (decay=0.60, learn=0.40)
  # Days 15+: Behavioral data strongly dominant (decay=0.50, learn=0.50)
  
  IF day <= 3:
    decay_factor = 0.85
    learning_rate = 0.15
  ELSE IF day <= 7:
    decay_factor = 0.75
    learning_rate = 0.25
  ELSE IF day <= 14:
    decay_factor = 0.60
    learning_rate = 0.40
  ELSE:
    decay_factor = 0.50
    learning_rate = 0.50
  
  # Update vector
  for each dimension d:
    state.vector[d] = state.vector[d] * decay_factor + behavioral_signal[d] * learning_rate
  
  # Normalize vector (keep sum = 1.0 to prevent drift)
  total = sum(state.vector)
  state.vector = [v / total for v in state.vector]
  
  # Recompute primary/secondary
  sorted_dims = sort_descending(state.vector)
  state.primary = sorted_dims[0].dimension
  state.secondary = sorted_dims[1].dimension
  
  # Update confidence
  # Confidence is based on: separation between top dimensions, number of data days, consistency
  top_gap = sorted_dims[0].score - sorted_dims[1].score
  consistency = compute_consistency(state.vector, user.archetype_history_last_7_days)
  data_days = min(day, 14) / 14.0  # Saturates at day 14
  
  state.confidence = (
    top_gap * 2.0 * 0.4 +      # Larger gap = higher confidence (capped at 1.0)
    consistency * 0.35 +          # More consistent daily results = higher confidence
    data_days * 0.25              # More days of data = higher confidence
  )
  state.confidence = clamp(state.confidence, 0.1, 0.95)
  
  state.last_recalc = now()
  RETURN state
```

### 3.4 Key Moments

**Days 1-3: Pure onboarding signal.**
- Archetype vector = Fog Walk scores. Confidence ~0.3.
- Quest assignment uses primary/secondary from onboarding.
- No reveal. Kael says: *"I caught a glimpse. We'll know more soon."*

**Day 7: First archetype adjustment.**
- By now, 7 days of behavioral data have been blended.
- The formula above means behavioral data has been weighted at 0.15-0.25 per day for 7 days.
- Net effect: behavioral data accounts for ~55-65% of the vector by Day 7.
- If primary flipped from onboarding: quest recommendations silently adjust.
- Confidence typically ~0.45-0.55 by Day 7.

**Day 10: Archetype reveal moment.**

```
check_archetype_reveal(user):
  
  IF user.archetype_state.revealed: RETURN  # Already revealed
  
  IF user.day_of_season < 10: RETURN  # Too early
  
  IF user.archetype_state.confidence >= 0.55:
    trigger_reveal(user)
  ELSE IF user.day_of_season >= 12:
    # Force reveal by Day 12 even with lower confidence
    # Kael frames it with more tentativeness
    trigger_reveal(user, tentative=true)
  
trigger_reveal(user, tentative=false):
  user.archetype_state.revealed = true
  user.archetype_state.revealed_at = now()
  
  IF tentative:
    kael_message = generate_tentative_reveal(user.archetype_state)
    # "I think I see something in you. I'm not certain yet — but there's a pull toward {primary}..."
  ELSE:
    kael_message = generate_confident_reveal(user.archetype_state)
    # "I've been watching you. The way you move, the quests you reach for... You burn..."
  
  # This is a major narrative event. Full-screen. Special animation.
  queue_narrative_event("archetype_reveal", kael_message)
```

**Ongoing evolution (post-reveal):**

```
check_archetype_shift(user):
  # Runs weekly as part of weekly processing
  
  IF NOT user.archetype_state.revealed: RETURN
  
  current_primary = user.archetype_state.primary
  vector_primary = argmax(user.archetype_state.vector)
  
  # No shift if primary matches
  IF current_primary == vector_primary: RETURN
  
  # Check if the shift has been sustained
  days_of_mismatch = count_consecutive_days_where(
    user.archetype_daily_snapshots,
    lambda snapshot: argmax(snapshot.vector) != current_primary
  )
  
  IF days_of_mismatch >= 7:
    # Gradual shift — Kael acknowledges narratively
    old_primary = current_primary
    user.archetype_state.primary = vector_primary
    
    kael_message = generate_archetype_shift_message(old_primary, vector_primary)
    # "Something's shifted. I named you a {old}. But there's something else emerging..."
    
    queue_narrative_event("archetype_shift", kael_message)
    
    # User can accept or resist (UI choice)
    # If resist: label stays, but quest recommendations follow vector anyway
```

**Can your primary flip? YES.**
- It requires 7+ consecutive days where the behavioral vector's top dimension differs from the labeled primary.
- Kael handles it narratively as growth, not correction.
- The user can reject the relabeling but quest recommendations follow actual behavior regardless.

**Seasonal reset:**

```
seasonal_archetype_reset(user):
  user.archetype_state.vector = (
    user.archetype_state.vector * 0.7 + 
    user.archetype_state.onboarding_signal * 0.3
  )
  # Re-normalize
  total = sum(user.archetype_state.vector)
  user.archetype_state.vector = [v / total for v in user.archetype_state.vector]
  
  # Confidence drops slightly to allow re-exploration
  user.archetype_state.confidence *= 0.8
  
  # Primary/secondary may shift — celebrated as evolution in Season Wrapped
```

---

## 4. Stat & Economy System

### 4.1 Stat Points — Earning

```
compute_stat_gain(user, quest):

  # Base value by tier
  base = {EMBER: 2, FLAME: 4, BLAZE: 7, INFERNO: 15}[quest.tier]
  
  # Tier multiplier: bonus if quest is in user's weakest 2 dimensions
  user_weakest_2 = sorted(user.stats)[0:2]  # Two lowest stat dimensions
  IF quest.domain_stat in user_weakest_2:
    tier_mult = 1.3
  ELSE:
    tier_mult = 1.0
  
  # Resistance bonus: from quest's resistance_multiplier field (1.0-2.5)
  resistance = quest.resistance_multiplier
  
  # Streak modifier
  current_streak = user.consecutive_days_with_anchor_completion
  IF current_streak >= 7: streak_mod = 1.20
  ELSE IF current_streak >= 5: streak_mod = 1.15
  ELSE IF current_streak >= 3: streak_mod = 1.10
  ELSE: streak_mod = 1.0
  
  # Diminishing returns based on current stat value
  current_val = user.stats[quest.domain_stat]
  IF current_val < 50: dim_returns = 1.0
  ELSE IF current_val < 75: dim_returns = 0.85
  ELSE IF current_val < 90: dim_returns = 0.70
  ELSE: dim_returns = 0.50
  
  # Secondary archetype bonus: 1.15x if quest is in secondary archetype domain
  IF quest.domain_stat == user.archetype_state.secondary_domain:
    secondary_bonus = 1.15
  ELSE:
    secondary_bonus = 1.0
  
  raw_gain = base * tier_mult * resistance * streak_mod * dim_returns * secondary_bonus
  
  # Round to nearest integer, minimum 1
  gain = max(1, round(raw_gain))
  
  # Apply
  user.stats[quest.domain_stat] = min(100, user.stats[quest.domain_stat] + gain)
  
  RETURN gain
```

**Typical gains by scenario:**

| Scenario | Approximate Gain |
|---|---|
| Ember quest, strong dimension, no streak | 2 |
| Flame quest, neutral dimension, 3-day streak | 4-5 |
| Flame quest, weakest dimension, 5-day streak | 6-7 |
| Blaze quest, weakest dimension, 7-day streak, high resistance | 12-16 |
| Inferno boss quest, weak dimension | 20-25 |

### 4.2 Stat Decay

```
apply_stat_decay(user):
  # Runs daily at midnight local time
  
  IF user.rest_mode_active: RETURN  # No decay during rest
  IF user.engagement_state == RESTING: RETURN
  
  for each dimension d in all_dimensions:
    days_since_domain_quest = days_since(user.last_quest_completed_in[d])
    
    IF days_since_domain_quest <= 3:
      decay = 0  # Grace period: no decay for 3 days
    ELSE:
      decay = 0.5 * (days_since_domain_quest - 3)  # 0.5/day starting day 4
      # Cap: maximum 2.0 decay per day (reached after 7 days of neglect)
      decay = min(decay, 2.0)
    
    user.stats[d] = max(10, user.stats[d] - decay)  # Floor of 10, never drops below
```

**Decay examples:**

| Days without domain quest | Daily decay | Cumulative decay after 7 days |
|---|---|---|
| 1-3 | 0 | 0 |
| 4 | 0.5 | 0.5 |
| 5 | 1.0 | 1.5 |
| 6 | 1.5 | 3.0 |
| 7 | 2.0 (capped) | 5.0 |
| 8+ | 2.0 (capped) | 7.0+ |

**Recovery:** A single Flame quest in a decayed domain recovers 4+ stat points. A Blaze quest recovers 7+. Decay is slow enough to be gentle but creates real incentive to maintain balance.

### 4.3 Fragment Economy

**Earning:**

| Activity | Fragments |
|---|---|
| Ember Quest completion | 10-15 (varies by quest) |
| Flame Quest completion | 25-40 |
| Blaze Quest completion | 50-80 |
| Inferno Quest completion | 150-250 |
| Meaningful reflection (depth > 0.6) | +10 bonus |
| 5/7 weekly cycle completion | 100 |
| 7/7 weekly cycle completion | 200 |
| Daily app open | 0 (NO daily login bonus — contradicts anti-guilt philosophy) |

**Spending:**

| Item | Cost | Notes |
|---|---|---|
| Fog map color theme | 200 | Cosmetic |
| Guide voice variant | 500 | Slight personality flavor |
| Lore entry (collectible) | 50 | World-building text |
| Side story chapter | 150 | Branching narratives |
| Essence Compass frame | 300 | Cosmetic stat display border |

**Inflation prevention:**
- Earn rate is FLAT — Day 5 and Day 40 users earn same Fragments per quest tier
- No compound interest, no multiplicative bonuses that scale over time
- Cosmetic catalog refreshes per season: Season 2 items cost 1.5x Season 1 prices
- No trading, no marketplace (currencies are personal)
- Typical weekly earnings for moderate engagement: 400-600 Fragments
- Typical cosmetic purchase cadence: 1 item every 1-2 weeks (feels generous)

### 4.4 Energy Economy

**Earning:**

| Activity | Energy |
|---|---|
| Daily free grant | 3 |
| Ember Quest completion | 0 |
| Flame Quest completion | 1 |
| Blaze Quest completion | 2 |
| Inferno Quest completion | 5 |
| Weekly cycle (5/7) | 3 |

**Spending:**

| Activity | Energy Cost |
|---|---|
| Casual Kael conversation (per exchange) | 1 |
| Deep/exploration Kael conversation | 1 |
| Emotional/crisis Kael conversation | 0 (ALWAYS FREE) |

**Rules:**
- Daily budget for active user: 3 free + 1-3 earned = 4-6 conversations/day
- Subscription users: energy cap REMOVED. Unlimited conversations. Free grant irrelevant.
- Energy does NOT carry over day-to-day. Fresh 3 each day.
- Crisis conversations (Level 1+ distress detected) bypass energy completely
- When energy runs out: Kael says *"My voice grows faint. Complete a quest to strengthen our connection."* Chat input disabled except crisis keywords.
- Energy is narratively framed as "the strength of the connection between worlds"

### 4.5 Fog Light Economy

**Earning:**

| Activity | Fog Light |
|---|---|
| Weekly cycle (5/7) | 1 |
| Weekly cycle (7/7) | 2 |
| Boss Quest (Inferno) completion | 3 |
| Archetype discovery/reveal | 5 |
| Season completion | 10 |
| Dimension hits 50 ("Awakening") | 2 |

**Spending:**

| Action | Cost |
|---|---|
| Reveal one hidden fog tile | 1 |
| Reveal a landmark (hidden POI) | 3 |
| Unlock a side area (bonus map region) | 5 |

**Typical season earnings:** 20-35 Fog Light
**Typical spending:** 100 tiles total. ~80 revealed through quest completion. ~20 are "hidden" and require Fog Light. So 20 Fog Light needed for 100% map completion — achievable for dedicated users, not trivial.

### 4.6 Sparks Economy (Refresh Currency)

**Earning:**

| Activity | Sparks |
|---|---|
| Complete Anchor quest | 1 |
| Complete Choice quest without using any refresh | 1 bonus |
| Complete full weekly cycle (5/7) | 2 |
| Complete all 3 quest slots in one day | 1 |
| 3 consecutive days with Anchor completion | 1 |

**Spending:**
- Each Choice slot refresh beyond the free daily one costs 1 Spark

**Cap:** 20 Sparks maximum. No decay — they persist until spent.

**Economy balance:**
- Moderate user earns 8-12 Sparks/week
- If they refresh 1 extra time per day = 7 Sparks/week spent
- Net: small surplus for occasional heavy-refresh days
- Cap prevents hoarding beyond 20

---

## 5. Fog Map Decision Tree

### 5.1 Map Structure

```
Season 1 Map: 100 tiles in concentric rings

Ring 0 (Center):    5 tiles  — Pre-revealed at app start (user's starting point)
Ring 1 (Inner):    15 tiles  — Revealed during Act 1 (Days 1-14)
Ring 2 (Middle):   25 tiles  — Revealed during Act 2 (Days 15-28)
Ring 3 (Outer):    30 tiles  — Revealed during Act 3 (Days 29-42)
The Clearing:       5 tiles  — Season climax (special event)
Hidden Areas:      20 tiles  — Only revealable via Fog Light spending
                   ─────
Total:            100 tiles
```

### 5.2 Quest-to-Fog Reveal Mapping

Fog reveals are **automatic** upon quest completion. The user does NOT choose where to reveal — the system reveals the next appropriate tile based on ring progression.

```
compute_fog_reveal(user, completed_quest):

  # Base reveal amount by quest type
  base_reveal = {
    "anchor_ember": 0.8,
    "anchor_flame": 1.0,
    "anchor_blaze": 1.2,
    "choice": 0.5,        # Choice quests reveal less than Anchor
    "ember_slot": 0.3,    # Ember slot reveals least
    "boss_inferno": 4.0,  # Major reveal
    "micro_quest": 0.1    # Tiny reveal — but still something
  }[quest_type(completed_quest)]
  
  # Weekly cycle bonus
  IF this_completion_triggers_weekly_cycle(user):
    base_reveal += 1.5  # Bonus for hitting 5/7
  
  # Accumulate into reveal_buffer
  user.fog_reveal_buffer += base_reveal
  
  # Consume buffer: each 1.0 in buffer reveals 1 tile
  while user.fog_reveal_buffer >= 1.0:
    tile = next_revealable_tile(user)
    IF tile:
      reveal_tile(user, tile)
      user.fog_reveal_buffer -= 1.0
    ELSE:
      break  # All non-hidden tiles revealed
  
  # Fractional buffer carries over to next quest

next_revealable_tile(user):
  # Reveal in ring order. Within a ring, reveal adjacently to already-revealed tiles.
  current_ring = get_current_ring(user)
  
  unrevealed_in_ring = current_ring.tiles.filter(
    state == "fogged" AND adjacent_to_revealed_tile
  )
  
  IF unrevealed_in_ring is empty:
    # All adjacent tiles in this ring revealed. Move to next ring.
    next_ring = current_ring.next
    IF next_ring:
      unrevealed_in_ring = next_ring.tiles.filter(adjacent_to_revealed_tile)
  
  IF unrevealed_in_ring is empty:
    RETURN null  # All quest-revealable tiles done. Only hidden areas remain.
  
  # Within candidates, prefer tiles near landmarks (tease effect)
  IF any tile in unrevealed_in_ring is adjacent_to_landmark:
    RETURN that tile  # Reveals near landmarks to create teaser silhouettes
  
  RETURN random.choice(unrevealed_in_ring)
```

### 5.3 Fog Light Manual Reveals (Hidden Areas)

```
on_fog_light_spend(user, target_tile):

  # Only hidden tiles can be manually revealed
  IF target_tile.type != "hidden": RETURN error("This tile is revealed through quests")
  
  # Cost depends on tile contents
  IF target_tile.contains_landmark:
    cost = 3
  ELSE IF target_tile.is_side_area_entrance:
    cost = 5
  ELSE:
    cost = 1
  
  IF user.fog_light < cost: RETURN error("Not enough Fog Light")
  
  user.fog_light -= cost
  reveal_tile(user, target_tile)
  
  # Hidden tiles are visible as glowing markers in the fog once user has Fog Light > 0
  # User can see WHERE hidden areas are, but can't see what's in them until they spend
```

### 5.4 Landmarks

```
Landmark distribution across the map:

Ring 1: 2 landmarks  (revealed through Act 1 quest progression)
Ring 2: 3 landmarks  (revealed through Act 2)
Ring 3: 4 landmarks  (revealed through Act 3)
Hidden: 3 landmarks  (require Fog Light)
The Clearing: 1 landmark (Season climax — the final reveal)

Total: 13 landmarks
```

**Landmark reveal mechanics:**
- Landmarks begin to show as silhouettes through fog when adjacent tiles are cleared
- Full reveal happens when the landmark's tile is revealed
- Each landmark has: a name, a visual icon, a lore text, and a narrative connection to the user's journey
- Landmark names are partially personalized: *"The First Shore — where you decided to look outward instead of inward"*
- First landmark fully reveals on Day 5-6 (creates early "wow" moment)

**Landmark contents:**
- Lore fragment (always)
- Optional: Fragment bonus (50-200)
- Optional: Fog Light bonus (1-2)
- Optional: Cosmetic unlock
- Optional: Kael backstory fragment

### 5.5 Dimming Mechanic

```
apply_fog_dimming(user):
  # Runs daily at midnight
  
  IF user.rest_mode_active: RETURN  # No dimming during rest
  
  IF user.engagement_state in [ABSENT, DORMANT]:
    days_absent = days_since(user.last_quest_completed_at)
    
    IF days_absent > 7:
      # Begin dimming: most recently revealed tiles dim first
      tiles_to_dim = user.revealed_tiles.sort_by(revealed_at, descending)
      
      dim_count = min(
        floor((days_absent - 7) * 0.5),  # 0.5 tiles per day after day 7
        len(tiles_to_dim) * 0.3  # Never dim more than 30% of revealed tiles
      )
      
      for tile in tiles_to_dim[0:dim_count]:
        IF tile.dim_level < 3:  # Max dim level is 3 (30%, 60%, 90% opacity)
          tile.dim_level += 1
        # Tiles NEVER fully re-fog. Dimmed tiles show muted/faded terrain.
  
  # Recovery: a single quest clears ALL dimming on up to 5 tiles
  # (applied in compute_fog_reveal when user returns)

on_return_from_absence(user):
  # Called when user completes first quest after being ABSENT or DORMANT
  dimmed_tiles = user.tiles.filter(dim_level > 0).sort_by(dim_level, ascending)
  
  for tile in dimmed_tiles:
    tile.dim_level = 0  # Full restore
  
  # Kael: "Look. It came back. It always does — when you do."
```

**Dimming is purely visual.** No stat loss, no progress loss, no landmark loss. It's a gentle "garden overgrowing" metaphor. One quest restores all dimmed tiles.

---

## 6. Kael Intelligence Decision Tree

### 6.1 Register Selection

Kael has 4 voice registers: **Mythic**, **Direct**, **Playful**, **Compassionate** (override).

```
select_kael_register(user, context):

  # Override: Compassionate register for distress
  IF context.crisis_level >= 1: RETURN COMPASSIONATE
  
  # Context-based selection
  IF context.type == "quest_completion":
    IF completed_quest.tier == BLAZE or INFERNO: RETURN MYTHIC
    IF completed_quest.tier == EMBER: RETURN PLAYFUL
    IF user.reflection_depth > 0.7: RETURN MYTHIC
    ELSE: RETURN PLAYFUL
  
  IF context.type == "quest_delivery":
    RETURN MYTHIC  # Quest framing is always narrative
  
  IF context.type == "skip_response":
    IF user.skip_count_last_7_days >= 3: RETURN DIRECT
    ELSE: RETURN PLAYFUL
  
  IF context.type == "conversation":
    # Relationship depth determines default register
    IF user.day_of_season <= 7:
      # Early relationship: mostly Mythic + Playful (trust-building)
      RETURN random.weighted_choice({MYTHIC: 0.5, PLAYFUL: 0.4, DIRECT: 0.1})
    
    ELSE IF user.day_of_season <= 21:
      # Growing relationship: balanced
      RETURN random.weighted_choice({MYTHIC: 0.3, PLAYFUL: 0.3, DIRECT: 0.4})
    
    ELSE:
      # Deep relationship: Direct becomes dominant (earned the right to be blunt)
      RETURN random.weighted_choice({MYTHIC: 0.2, PLAYFUL: 0.2, DIRECT: 0.6})
  
  IF context.type == "absence_return":
    RETURN MYTHIC  # Warm, narrative welcome-back
  
  IF context.type == "weekly_review":
    IF user.weekly_completion_rate >= 0.7: RETURN PLAYFUL  # Celebrate
    ELSE: RETURN DIRECT  # Honest assessment
  
  DEFAULT: RETURN MYTHIC
```

### 6.2 Memory System

```
kael_memory = {
  # Layer 1: Full conversation history (rolling 90 days)
  conversations: [
    {date, messages[], topic_tags[], emotional_tone, summary}
  ],
  
  # Layer 2: Compressed daily summaries (permanent)
  daily_summaries: [
    {date, quests_completed, quests_skipped, mood_signal, 
     key_themes: string[], notable_quotes: string[2], 
     behavioral_delta: string}  # "user SAID X but DID Y"
  ],
  
  # Layer 3: Persistent facts (permanent, updated)
  user_facts: {
    name: string,
    initial_question_answer: string,  # "What do you keep meaning to change?"
    archetype: {primary, secondary},
    recurring_themes: [{theme, frequency, last_mentioned}],
    avoidance_patterns: [{domain, evidence_count}],
    breakthrough_moments: [{date, description, quest_id}],
    preferences: {depth_setting, communication_style_notes},
    crisis_history: [{date, level, resolution}]
  },
  
  # Layer 4: Relationship metadata
  relationship: {
    days_active: int,
    total_conversations: int,
    deepest_conversation_topics: string[5],
    trust_level: float,  # 0.0-1.0, based on user engagement depth
    humor_responsiveness: float,  # Does user respond well to playful register?
    directness_responsiveness: float  # Does user respond well to direct register?
  }
}
```

**Compression schedule:**

```
compress_kael_memory():
  # Runs daily at midnight
  
  # Conversations older than 90 days: delete full messages, keep summary
  for conv in kael_memory.conversations where conv.date < 90_days_ago:
    conv.messages = null
    # summary, topic_tags, emotional_tone preserved permanently
  
  # Daily summary compression (weekly):
  # Every 7 days, compress the previous week's daily summaries into a weekly summary
  IF today is Sunday:
    week_summaries = kael_memory.daily_summaries[-7:]
    weekly_digest = llm_compress(week_summaries, max_tokens=200)
    # Store as weekly_summary, delete individual daily summaries older than 30 days
  
  # User facts: updated continuously, never deleted
  # Recurring themes: merge duplicates, increment frequency
  # Avoidance patterns: prune if no evidence in 30 days
```

### 6.3 Response Generation

```
generate_kael_response(user, context, user_message=null):

  register = select_kael_register(user, context)
  
  # Assemble context for LLM
  system_prompt = build_kael_system_prompt(register, user)
  
  # Token budget: 4000 tokens for context, 500 for response
  context_payload = assemble_context(user, budget=4000):
    # Priority order (fill until budget exhausted):
    # 1. User's current state (200 tokens): stats, archetype, track, engagement_state, day_of_season
    # 2. Today's quest data (200 tokens): what was offered, completed, skipped
    # 3. Last 3 conversations (500 tokens): for conversational continuity
    # 4. User facts (300 tokens): persistent facts about the user
    # 5. Recent daily summaries (400 tokens): last 7 days compressed
    # 6. Current context specifics (200 tokens): what triggered this response
    # 7. Weekly summaries (200 tokens): last 4 weeks compressed
    # 8. Behavioral delta (200 tokens): what user says vs. what they do
    # 9. Archetype narrative material (300 tokens): archetype-specific metaphors/stories
    # 10. Backfill with older conversation summaries if budget remains
  
  response = llm_generate(
    system_prompt = system_prompt,
    context = context_payload,
    user_message = user_message,
    max_tokens = 500,
    temperature = 0.7
  )
  
  # Post-processing
  response = enforce_kael_rules(response):
    - Max 3 short paragraphs
    - No exclamation marks more than once
    - User's name used max once per conversation
    - No therapeutic jargon ("cognitive restructuring," "thought records," etc.)
    - No "I'm proud of you" — show through action-specific language
    - Never says "Great job!" or "Well done!" — uses specific observations
    - Crisis language check: if response accidentally minimizes distress, flag for review
  
  RETURN response
```

**System prompt structure (abbreviated):**

```
You are Kael, a guide in the fog world of Rewire.

REGISTER: {mythic|direct|playful|compassionate}
RELATIONSHIP DEPTH: Day {N} of {total_days}. {conversation_count} conversations.
USER STATE: {archetype.primary}/{archetype.secondary}. Track {A|B}. Energy level: {0-1}.
EMOTIONAL STATE ESTIMATE: {based on recent signals}

VOICE RULES:
- Speak in short sentences. Not flowery. Not clinical.
- Use silence (pauses, "...") as a tool.
- {register-specific rules}
  IF mythic: Use metaphor. Reference the fog, the map, the journey. Archetypal language.
  IF direct: Be honest. Almost blunt. Name what you see. No sugar-coating.
  IF playful: Be light. Human. A wry friend. Gentle teasing is okay.
  IF compassionate: Drop all narrative framing. Be a warm presence. Validate. Don't fix.
- You are NOT a therapist. Never diagnose. Never prescribe. Never use clinical language.
- You are a companion with skin in the game — the fog affects you too.
- Reference specific things the user has done (use provided context).
- When the user is struggling: reduce demands, increase warmth, keep the door open.
- Never guilt. Never shame. Never imply disappointment.

BEHAVIORAL DELTA: The user says {X} but their quest data shows {Y}. 
You may gently surface this discrepancy when the relationship is deep enough (Day 14+).

FORBIDDEN:
- "I'm proud of you" (show, don't tell)
- "Great question!" or any sycophantic opener
- Exclamation marks more than once per message
- Walls of text (max 3 paragraphs)
- Therapeutic advice or diagnosis
- Minimizing distress ("It'll be fine")
- "You should try..." for mental health concerns
```

### 6.4 Proactive Messages

```
schedule_proactive_messages(user):
  # Runs daily at midnight, schedules messages for the coming day
  
  messages_today = []
  
  # Morning quest delivery (always, unless rest mode)
  IF NOT user.rest_mode_active:
    morning_time = user.preferred_morning_time OR 08:00 local
    messages_today.append({
      time: morning_time,
      type: "quest_delivery",
      content: generate_morning_message(user)
      # Includes: today's Anchor quest intro, Choice availability, Kael's morning observation
    })
  
  # Evening reflection (only if user completed ≥1 quest today)
  IF user.quests_completed_today >= 1:
    evening_time = user.preferred_evening_time OR 20:00 local
    messages_today.append({
      time: evening_time,
      type: "evening_reflection",
      content: generate_evening_message(user)
      # Asks about the day. References specific quest completed.
    })
  
  # Post-completion acknowledgment (immediate, not scheduled)
  # Handled in quest completion flow, not here.
  
  # Post-skip check (if user skipped Anchor and it's been 6+ hours)
  IF user.anchor_quest_skipped_at AND hours_since(user.anchor_quest_skipped_at) >= 6:
    IF NOT user.any_quest_completed_today:
      # One gentle nudge, maximum
      messages_today.append({
        time: user.anchor_quest_skipped_at + 6_hours,
        type: "gentle_nudge",
        content: "The day is moving. Your quest is waiting."  # NOT "you missed your quest"
      })
  
  # Absence-based proactive messages
  IF user.engagement_state == DRIFTING:
    # Day 3 of no quest: one message
    IF days_since_quest == 3:
      messages_today.append({
        time: 12:00 local,
        type: "drift_check",
        content: "I've got something light for you today. Smaller than yesterday's."
      })
  
  IF user.engagement_state == ABSENT:
    # Day 5: final active notification
    IF days_since_quest == 5:
      messages_today.append({
        time: 10:00 local,
        type: "soft_farewell",
        content: "I won't keep calling. But the map still remembers you. Come back when you're ready."
      })
  
  # Apply daily cap: maximum 2 proactive messages per day
  IF len(messages_today) > 2:
    messages_today = prioritize_messages(messages_today, limit=2)
    # Priority: crisis > quest_delivery > evening_reflection > gentle_nudge > drift_check
  
  # Apply quiet hours: no messages between 23:00-07:00 user local time
  messages_today = messages_today.filter(
    time.hour >= 7 AND time.hour < 23
  )
  
  RETURN messages_today
```

### 6.5 Crisis Detection

```
detect_crisis(user_text):

  # Level 0: Normal — no action
  # Level 1: Distress — compassionate register
  # Level 2: Concern — resources shown
  # Level 3: Acute — full-screen intervention
  
  # Run lightweight classifier on all user text > 10 characters
  crisis_score = crisis_classifier.predict(user_text)  # Returns {level: 0-3, confidence: 0-1}
  
  IF crisis_score.level == 0:
    RETURN {level: 0, action: "none"}
  
  IF crisis_score.level == 1:
    RETURN {
      level: 1,
      action: "switch_register_compassionate",
      kael_override: "Drop narrative framing. Validate emotion. Don't fix.",
      energy_cost: 0  # Crisis conversations are always free
    }
  
  IF crisis_score.level == 2:
    RETURN {
      level: 2,
      action: "show_resources",
      kael_override: "Compassion + surface resource card",
      kael_message: "I'm here with you. And I want you to know — there are people trained for moments like this.",
      resources: ["988 Suicide & Crisis Lifeline (call or text 988)", "Crisis Text Line (text HOME to 741741)"],
      energy_cost: 0,
      log: true,  # Anonymized safety log
      track_override: "B"  # Force Track B immediately
    }
  
  IF crisis_score.level == 3:
    RETURN {
      level: 3,
      action: "full_screen_intervention",
      overlay: {
        message: "I need you to talk to someone right now. Not me — someone who can truly help.",
        resources: [
          "988 Suicide & Crisis Lifeline",
          "Crisis Text Line: text HOME to 741741",
          "Emergency: 911"
        ],
        hide_gamification: true  # All quest/stat UI hidden
      },
      energy_cost: 0,
      log: true,
      flag_human_review: true,  # Must be reviewed within 1 hour
      track_override: "B"
    }
  
  # False positive preference: ALWAYS over-detect rather than under-detect
```

### 6.6 Personality Evolution

Kael's personality does evolve as the relationship deepens. This is controlled by the register weighting and system prompt modifiers:

```
kael_personality_evolution(user):

  days = user.day_of_season
  trust = user.kael_memory.relationship.trust_level
  
  # Days 1-7: New acquaintance
  # - Mostly Mythic + Playful (building trust through wonder and warmth)
  # - Never Direct (hasn't earned it)
  # - Formal-ish. Respectful distance.
  # - Callbacks to onboarding: "remember what you told me?"
  
  # Days 8-14: Growing familiarity
  # - Direct register starts appearing (10-20% of interactions)
  # - Kael starts using user's patterns in conversation: "I notice you always..."
  # - Humor becomes more specific to the user
  # - Kael remembers and references specific quests
  
  # Days 15-28: Real relationship
  # - Direct register is dominant (40-60%)
  # - Kael can be blunt: "You've been avoiding Heart quests for two weeks."
  # - Callbacks to Week 1: "Two weeks ago, you put a light on an empty map."
  # - Kael may gently surface behavioral deltas: "You said X, but you keep doing Y."
  # - Playful register becomes more inside-joke-ish
  
  # Days 29-42: Deep companionship
  # - Direct register dominant (60%)
  # - Kael speaks as an equal, not a guide
  # - Mythic register reserved for big moments (boss quests, season events)
  # - Kael can ask uncomfortable questions: "Is this changing anything? Not the app. You."
  # - Full behavioral delta surfacing
  # - Callbacks span the entire journey
  
  # Additionally: Kael adapts to what works
  IF trust > 0.7 AND user.kael_memory.relationship.humor_responsiveness > 0.6:
    # User responds well to humor → more Playful
    increase_playful_weight(0.1)
  
  IF trust > 0.5 AND user.kael_memory.relationship.directness_responsiveness > 0.7:
    # User responds well to directness → more Direct earlier
    increase_direct_weight(0.15)
```

---

## 7. Notification Decision Tree

### 7.1 Daily Notification Budget

**Hard cap: 2 notifications per day. No exceptions.**

```
select_daily_notifications(user, candidates):

  # Filter: quiet hours (23:00-07:00 local, adjustable)
  candidates = candidates.filter(
    scheduled_time.hour >= user.quiet_hours_end AND   # default 07:00
    scheduled_time.hour < user.quiet_hours_start       # default 23:00
  )
  
  # Filter: rest mode
  IF user.rest_mode_active: RETURN []  # Zero notifications
  
  # Filter: no notification within 2 hours of a dismissed notification
  candidates = candidates.filter(
    scheduled_time > user.last_dismissed_notification + 2_hours
  )
  
  # Priority ranking (highest to lowest):
  priority = {
    "crisis_resource":     100,  # Always sent (doesn't count toward cap)
    "quest_delivery":       90,  # Morning quest message
    "evening_reflection":   70,  # Evening prompt (only if quest completed today)
    "streak_alert":         60,  # "One more. You're close." (max 1/week)
    "gentle_nudge":         50,  # Midday nudge if no quest started
    "story_beat":           40,  # Mon/Wed/Sun narrative beats
    "drift_check":          30,  # After 3+ days of no engagement
    "soft_farewell":        20,  # After 5 days — final active notification
    "dormant_weekly":       10,  # Weekly check-in for dormant users
    "dormant_monthly":       5,  # Monthly check-in for long-dormant users
  }
  
  candidates.sort_by(priority, descending)
  
  RETURN candidates[0:2]  # Max 2
```

### 7.2 Notification Content by State

```
generate_notification(user, type):

  # All notifications are in Kael's voice. Never system-speak.
  
  SWITCH type:
  
  CASE "quest_delivery":
    # Morning — sent at user's preferred time (default 8 AM)
    IF user.engagement_state == ACTIVE:
      content = kael_morning_message(user)
      # Examples:
      # "Something's waiting for you on the map. It's small — but it's real."
      # "Today's quest found you. Not the other way around."
    IF user.engagement_state == DRIFTING:
      content = "A quiet morning. Your quest is here when you are."
    
  CASE "evening_reflection":
    # Evening — only if ≥1 quest completed today
    content = kael_evening_message(user)
    # Personalized: references specific quest they completed
    # "Before the day ends — {reference to what they did}"
    
  CASE "streak_alert":
    # Only sent once per week, on Day 5-6 of weekly cycle, IF 4/5 anchors done
    content = "One more. You're close."
    
  CASE "gentle_nudge":
    # Midday, only if no quest started and 6+ hours since morning notification
    content = "The day is moving. Your quest is waiting."
    
  CASE "drift_check":
    # Day 3 of absence
    content = "The fog is restless. So am I. No rush — but I'm here."
    
  CASE "soft_farewell":
    # Day 5 of absence — LAST active notification
    content = "I won't keep calling. But the map still remembers you."
    
  CASE "dormant_weekly":
    # For users 14-30 days absent. Once per week.
    content = "Still here. That's all."
    
  CASE "dormant_monthly":
    # For users 30+ days absent. Once per month.
    content = "The fog held. So did I."
    # After 60 days with no app open: notifications stop entirely.
```

### 7.3 Absence Notification Cadence

```
absence_notification_schedule(user):

  days = days_since(user.last_app_open)
  
  Day 1: Nothing. Grace day.
  Day 2: 1 notification (quest_delivery at morning time)
  Day 3: 1 notification (drift_check at noon)
  Day 4: Nothing. Let it breathe.
  Day 5: 1 notification (soft_farewell at 10 AM)
  Days 6-13: Nothing. No notifications.
  Day 14: 1 notification (dormant_weekly)
  Day 21: 1 notification (dormant_weekly)
  Day 28: 1 notification (dormant_weekly)
  Day 35+: 1 notification per month (dormant_monthly)
  Day 60+: Notifications stop entirely. User can always return; app doesn't chase.
```

### 7.4 Anti-Disable Strategy

The primary defense against notification disablement is **quality**:
- Notifications are ALWAYS in Kael's voice (a character they care about, not system spam)
- Never more than 2/day (never feels overwhelming)
- Never overnight (never wakes them up)
- Content is personalized (references their quests, their journey)
- First notification they receive is after they've already engaged (Day 1 evening or Day 2 morning)
- If user dismisses 3 consecutive notifications without opening app → reduce to 1/day
- If user dismisses 5 consecutive → reduce to 1/week
- System tracks dismiss rate and adapts cadence automatically

---

## 8. Decision Trees (Flowchart-Style)

### 8.1 Daily Quest Generation

```
DAILY_QUEST_GENERATION (runs at user's morning time):

IF user.rest_mode_active THEN skip_all_generation
ELSE IF user.engagement_state == DORMANT THEN skip_all_generation
ELSE:
  
  1. COMPUTE max_unlocked_tier(user)
  2. SELECT anchor_quest using §2.3 algorithm
  3. IF user.lifecycle_state != PROLOGUE AND (user.track == A OR user.day_of_season >= 8):
       SELECT choice_options[3] using §2.4 algorithm
     ELSE:
       choice_options = empty
  4. SELECT ember_quest using §2.5 algorithm
  5. DELIVER via morning Kael message (push notification if opted in)
```

### 8.2 Quest Completion

```
ON_QUEST_COMPLETION(user, quest):

1. IF quest.completion_type == "reflection":
     REQUIRE reflection_text (min 20 chars)
     COMPUTE reflection_depth = llm_assess_depth(reflection_text)
   
2. COMPUTE stat_gain = compute_stat_gain(user, quest) [§4.1]
   APPLY user.stats[quest.domain_stat] += stat_gain

3. COMPUTE fragment_reward = quest.rewards.fragments
   IF reflection_depth > 0.6: fragment_reward += 10
   APPLY user.fragments += fragment_reward

4. COMPUTE energy_reward = quest.rewards.energy
   APPLY user.energy += energy_reward

5. COMPUTE fog_reveal = quest.rewards.fog_reveal
   APPLY fog_reveal to map [§5.2]

6. IF quest is Anchor:
     user.weekly_cycle.anchors_done += 1
     user.sparks += 1
   IF quest is Choice AND user.refreshes_used_for_this_choice == 0:
     user.sparks += 1  # No-refresh bonus

7. CHECK weekly_cycle_completion(user):
     IF user.weekly_cycle.anchors_done >= 5:
       APPLY weekly_rewards: +100 Fragments, +1 Fog Light, +2 Sparks
     IF user.weekly_cycle.anchors_done >= 7:
       APPLY bonus: +200 Fragments (total), +2 Fog Light (total)

8. CHECK all_slots_completed_today(user):
     IF anchor_done AND choice_done AND ember_done:
       user.sparks += 1

9. CHECK streak(user):
     IF 3 consecutive days with anchor: user.sparks += 1

10. PLAY completion animation (tier-dependent) [§V2 Task 3]
11. GENERATE kael_completion_response(user, quest)
12. CHECK tier_up_check(user) [§2.2]
13. CHECK archetype_reveal(user) [§3.4]
14. UPDATE kael_memory with quest data
15. RUN crisis_detection on reflection_text if present
```

### 8.3 "Not Feeling It" Flow

```
ON_NOT_FEELING_IT(user):

SHOW bottom_sheet with 4 options:

IF user selects "Make it smaller":
  REPLACE quest board with single Micro Quest
  Micro Quest: selected from pool of ultra-low-friction quests (all completable lying down)
  ON Micro Quest completion:
    fog_reveal += 0.1
    streak maintained (but NOT counted as Anchor for weekly cycle)
    Kael: "Small is real. That counted."

ELSE IF user selects "Just be here":
  HIDE quest board
  SHOW ambient fog map view + memory gallery
  ALLOW free Kael conversation (energy cost applies UNLESS distress detected)
  NO stats, NO fog reveal, NO rewards
  LOG as "present" for analytics
  NEXT DAY Kael: "You sat with me yesterday. That takes its own kind of courage."

ELSE IF user selects "Come back later":
  PRESERVE current quests
  START invisible 4-hour timer
  IF user returns within 4 hours:
    Kael: "Hey. You made it back."
    Same quests waiting
  ELSE:
    Anchor quest carries over to tomorrow (24-hour grace)
    Choice/Ember quests expire at midnight

ELSE IF user selects "Rest today":
  CLEAR all quests for the day
  user.rest_days_this_week += 1
  
  IF user.rest_days_this_week <= 2:
    Counts as weekly "grace day" (built into 5/7 design)
  
  Fog: NO decay on explicit rest days
  Stats: NO decay triggered
  Streak: survives 1 consecutive rest day; breaks on 2nd consecutive rest day
  
  IF consecutive_rest_days >= 3 (Track A) OR >= 5 (Track B):
    TRIGGER check-in flow:
      Kael: "It's been a few days. How are you doing?"
      IF "I'm okay, just needed a break":
        Resume normal. Kael offers gentle quest next day.
      IF "Not great":
        Kael: "Is this a rough patch, or more than that?"
        IF "Rough patch": Offer Micro Quest. Stay on current track.
        IF "More than that": 
          Show crisis resources
          IF track == A: offer Track B transition
```

### 8.4 Kael Register Selection

```
SELECT_REGISTER(user, context):

IF crisis_level >= 1                                    → COMPASSIONATE
ELSE IF context == quest_completion AND tier >= BLAZE    → MYTHIC
ELSE IF context == quest_completion AND tier == EMBER     → PLAYFUL
ELSE IF context == quest_completion AND reflection_depth > 0.7 → MYTHIC
ELSE IF context == skip AND skips_last_7 >= 3           → DIRECT
ELSE IF context == conversation AND day <= 7             → MYTHIC (50%) or PLAYFUL (40%)
ELSE IF context == conversation AND day <= 21            → DIRECT (40%) or MYTHIC (30%) or PLAYFUL (30%)
ELSE IF context == conversation AND day > 21             → DIRECT (60%) or MYTHIC (20%) or PLAYFUL (20%)
ELSE IF context == absence_return                        → MYTHIC
ELSE IF context == weekly_review AND completion >= 70%   → PLAYFUL
ELSE IF context == weekly_review AND completion < 70%    → DIRECT
ELSE                                                     → MYTHIC
```

### 8.5 Absence Response

```
ABSENCE_RESPONSE(user):

IF days_since_quest <= 1                                 → NOTHING (grace)
ELSE IF days_since_quest == 2                            → 1 notification (morning quest)
ELSE IF days_since_quest == 3:
  → Fog begins gentle dimming (visual only)
  → 1 notification: "The fog is restless."
  → Quest difficulty auto-reduced for next return
ELSE IF days_since_quest == 5:
  → Stat decay begins (0.5/day per neglected domain)
  → 1 final notification: "I won't keep calling."
ELSE IF days_since_quest 6-13                            → SILENCE. No notifications.
ELSE IF days_since_quest == 14                           → 1 notification (dormant_weekly)
ELSE IF days_since_quest 14-30                           → 1 per week (dormant_weekly)
ELSE IF days_since_quest 30-60                           → 1 per month (dormant_monthly)
ELSE IF days_since_quest > 60                            → SILENCE. Notifications stop.
```

### 8.6 Track Transition

```
CHECK_TRACK_TRANSITION(user):  # Runs daily

# B → A (promotion)
IF user.track == B
  AND completion_rate_7d >= 0.7
  AND days_on_B >= 7
THEN user.track = A (silent — no notification)

# A → B (demotion)  
IF user.track == A
  AND (days_since_completion >= 3 OR completion_rate_7d < 0.3)
  AND NOT rest_mode_active
THEN user.track = B (silent — tone adjusts, difficulty drops)

# Emergency
IF crisis_flag >= 2
THEN user.track = B (immediate)
```

### 8.7 Archetype Reveal Timing

```
CHECK_REVEAL(user):  # Runs daily

IF user.archetype_state.revealed               → SKIP
ELSE IF user.day_of_season < 10                → SKIP
ELSE IF user.archetype_state.confidence >= 0.55 → TRIGGER reveal (confident version)
ELSE IF user.day_of_season >= 12               → TRIGGER reveal (tentative version)
ELSE                                           → WAIT (check again tomorrow)
```

---

## 9. Data Flow Diagram

### 9.1 User Action → Data Writes

```
USER ACTION                    WRITES TO                          TRIGGERS
─────────────────────────────────────────────────────────────────────────────

App open                    → user.last_app_open_at              → engagement_state recompute
                           → analytics.session_start              

Quest completion            → quest_completions table             → stat update
                           → user.stats[domain]                  → fragment/energy/fog_light credit
                           → user.fog_reveal_buffer              → fog tile reveal
                           → user.weekly_cycle.anchors_done      → weekly cycle check
                           → user.sparks                         → tier progression check
                           → kael_memory.daily_summary           → archetype reveal check
                           → user.last_quest_completed_at        → engagement_state recompute
                           → user.streak_counter                 → completion animation trigger

Quest skip                  → quest_skips table                   → avoidance pattern update
                           → kael_memory (noted)                 → archetype vector (negative signal)

Reflection submitted        → reflections table (encrypted)       → LLM depth analysis
                           → kael_memory.daily_summary           → crisis detection
                           → archetype_signals (theme analysis)   → fragment bonus if depth > 0.6

Kael conversation message   → conversations table (encrypted)     → energy deduction (unless crisis)
                           → kael_memory.conversations           → crisis detection
                           → archetype_signals (topic analysis)   → behavioral delta tracking

Choice quest selected       → quest_selections table              → acceptance speed logged
                           → archetype_signals (domain pref)     

Refresh used                → refresh_log table                   → sparks deduction
                           → domain_avoidance_tracker            → anti-gaming check

"Not feeling it" selection  → user_state_events table             → appropriate flow trigger
                           → kael_memory                        

Rest mode toggle            → user.rest_mode_active               → notification pause
                           → user.rest_mode_started_at           → decay pause

Fog Light spend             → fog_light_transactions              → tile reveal
                           → user.fog_light balance              

Fragment spend (cosmetic)   → fragment_transactions               → cosmetic unlock
                           → user.fragments balance              

Notification dismissed      → notification_events                 → dismiss rate tracking
                                                                 → cadence adaptation
```

### 9.2 Scheduled Jobs

```
JOB: daily_midnight_processing
  RUNS: 00:00 user local time
  DOES:
    1. apply_stat_decay(user)                    [§4.2]
    2. apply_fog_dimming(user)                    [§5.5]
    3. update_archetype_daily(user)               [§3.3]
    4. compress_kael_memory()                     [§6.2]
    5. compute_engagement_state(user)             [§1.3]
    6. check_track_transition(user)               [§1.2]
    7. check_archetype_reveal(user)               [§3.4]
    8. check_archetype_shift(user)                [§3.4]
    9. reset_daily_counters:
       - user.daily_free_refreshes_remaining = 1 (per Choice slot)
       - user.refreshes_today = 0
       - user.energy = max(user.energy, 3)  # Replenish to at least 3
    10. expire_uncompleted_choice_quests
    11. IF anchor_quest not completed AND not skipped:
          carry_over_anchor (24-hour grace, then expire)

JOB: morning_quest_generation
  RUNS: user's preferred morning time (default 08:00 local)
  DOES:
    1. generate daily quests (Anchor, Choice, Ember)  [§2]
    2. schedule morning Kael message
    3. send push notification (if opted in and not rest mode)

JOB: weekly_cycle_reset
  RUNS: Monday 00:00 user local time
  DOES:
    1. evaluate previous week's cycle (5/7 or 7/7?)
    2. apply weekly rewards if earned
    3. reset user.weekly_cycle.anchors_done = 0
    4. reset user.rest_days_this_week = 0
    5. generate weekly narrative beat (Monday scene-set)

JOB: weekly_archetype_check
  RUNS: Sunday 23:00 user local time
  DOES:
    1. check_archetype_shift(user) — sustained mismatch check
    2. generate weekly summary for kael_memory

JOB: weekly_llm_quest_batch (Week 3+)
  RUNS: Sunday 02:00 server time (low-traffic)
  DOES:
    1. FOR EACH user in Season 1 Act 2+:
       generate 2-3 personalized quests via LLM
       safety filter: banned content, risk assessment, tier check
       IF flagged: queue for human review
       IF clean: add to user's quest_pool
    2. LOG generation stats (cost, quality scores, flag rates)
```

### 9.3 Kael Context Assembly

```
assemble_kael_context(user, context_type, token_budget=4000):

  payload = {}
  remaining = token_budget
  
  # PRIORITY 1: Current state (always included, ~200 tokens)
  payload.state = {
    day_of_season: user.day_of_season,
    lifecycle: user.lifecycle_state,
    track: user.track,
    engagement: user.engagement_state,
    archetype: user.archetype_state.{primary, secondary, confidence},
    stats_summary: user.stats,  # 6 numbers
    mood_signal: user.mood_signal,
    energy_level: user.energy_level
  }
  remaining -= 200
  
  # PRIORITY 2: Today's quest data (~200 tokens)
  payload.today = {
    anchor: {title, domain, tier, status},
    choice_selected: {title, domain, tier, status} or null,
    ember: {title, domain, tier, status},
    refreshes_used: user.refreshes_today,
    reflections_today: [truncated summaries]
  }
  remaining -= 200
  
  # PRIORITY 3: Last 3 conversations (~500 tokens)
  payload.recent_conversations = user.kael_memory.conversations[-3:]
    .map(c => {date: c.date, summary: c.summary, emotional_tone: c.tone})
  remaining -= 500
  
  # PRIORITY 4: User facts (~300 tokens)
  payload.user_facts = user.kael_memory.user_facts
  remaining -= 300
  
  # PRIORITY 5: Last 7 daily summaries (~400 tokens)
  IF remaining >= 400:
    payload.recent_days = user.kael_memory.daily_summaries[-7:]
    remaining -= 400
  
  # PRIORITY 6: Context specifics (~200 tokens)
  IF remaining >= 200:
    payload.context = {
      trigger: context_type,
      specific_data: get_context_specifics(context_type)
    }
    remaining -= 200
  
  # PRIORITY 7: Weekly summaries (~200 tokens)
  IF remaining >= 200:
    payload.weekly_summaries = user.kael_memory.weekly_summaries[-4:]
    remaining -= 200
  
  # PRIORITY 8: Behavioral delta (~200 tokens)
  IF remaining >= 200:
    payload.behavioral_delta = compute_behavioral_delta(user)
    # "User says they value courage but has skipped 80% of Courage quests"
    remaining -= 200
  
  # PRIORITY 9: Archetype narrative material (~300 tokens)
  IF remaining >= 300:
    payload.archetype_material = get_archetype_narratives(user.archetype_state)
    remaining -= 300
  
  # PRIORITY 10: Older conversation summaries (fill remaining)
  IF remaining > 100:
    payload.older_conversations = user.kael_memory.conversations[-10:-3]
      .map(c => c.summary)
      .truncate_to(remaining)
  
  RETURN payload
```

### 9.4 Quest Generation Pipeline

```
QUEST SOURCES:

1. HANDCRAFTED POOL (500+ quests)
   - Created pre-launch by narrative/design team
   - Covers all 6 domains × 4 tiers
   - Each quest has full narrative_wrapper, rewards, safety_flags
   - Used for: Prologue (exclusively), Act 1 (primarily), fallback (always)
   - Stored in: quest_templates table
   
2. TEMPLATE POOL (expanding)
   - Parameterized quest templates: "Walk for {duration} minutes to {destination}"
   - Variables filled based on user context
   - Used for: Act 2+ (supplementary), prevents repetition
   - Stored in: quest_templates table with type="template"

3. LLM-GENERATED (2-3 per user per week, starting Week 3)
   - Generated in weekly batch job (Sunday night)
   - Input: user archetype, stats, recent completions, avoidance patterns, reflection themes
   - Output: full Quest JSON matching schema
   - Safety pipeline:
     a. LLM generates quest
     b. Rule-based filter: banned words, physical risk, financial risk, tier check
     c. Emotional risk classifier: flags quests touching trauma, heavy topics
     d. IF flagged → human review queue (reviewed within 24 hours)
     e. IF clean → added to user's personal quest_pool
   - Stored in: user_quests table with source="llm_generated"
   - Fallback: if LLM is unavailable, handcrafted pool covers all needs

SELECTION ALGORITHM:
  For each quest slot (Anchor, Choice×3, Ember):
    1. Merge all sources into candidate pool
    2. Apply filters: domain, tier, anti-repeat, safety, time_window
    3. Score candidates using domain scoring algorithm
    4. Select top candidate (with random jitter to prevent determinism)
```

---

## 10. Edge Cases & Failure Modes

### 10.1 User Completes All Quests at Their Tier in Every Domain

```
DETECTION: quest_pool.filter(eligible for user) returns < 5 candidates
RESPONSE:
  1. Relax anti-repeat window: 14 days → 7 days → 3 days
  2. If still exhausted: Kael reframes repeats: 
     "This one came back around. Sometimes repetition IS the quest."
  3. For Week 3+ users: trigger emergency LLM batch (generate 5 quests immediately)
  4. For Week 1-2 users: this shouldn't happen with 500+ handcrafted pool.
     If it does: generate template-based quests by parameterizing existing templates.
  5. Absolute fallback: Kael offers free-form quest:
     "Today, you decide. What's the one thing you know you need to do?"
     (Self-designed quest, Flame tier rewards, self-report completion)
```

### 10.2 User Only Ever Does Body Quests, Ignores Everything

```
DETECTION: 
  domain_completion_ratio(Body) > 0.8 over last 14 days
  AND max(other_domains_completion_ratio) < 0.2

RESPONSE:
  Day 1-7: No intervention. Let them find their groove.
  Day 8-14: Anchor algorithm's neglect_boost naturally pushes other domains.
  Day 14+: Kael addresses narratively:
    "You're growing in one direction. What are you avoiding?"
  Day 21+: If imbalance > 40 points between highest and lowest stat:
    Anchor quests force-assigned from weakest domain 3 days/week.
    Choice options always include at least 2 non-Body options.
  
  NEVER: Remove Body quests or make them feel punished.
  ALWAYS: Frame balance as growth, not correction.
```

### 10.3 User Uses App 5 Minutes on Day 1, Never Comes Back

```
TIMELINE:
  Day 1: Completed onboarding. May or may not have completed First Light.
  Day 2: Quest delivery notification at morning time.
  Day 3: Drift check notification: "The fog is restless."
  Day 5: Soft farewell: "I won't keep calling."
  Days 6-13: Silence.
  Day 14: Dormant weekly: "Still here. That's all."
  Day 21, 28: Same.
  Day 35: Dormant monthly.
  Day 60+: Notifications stop entirely.
  
  DATA PRESERVED: All progress (however minimal) saved indefinitely.
  
  IF THEY RETURN (any time):
    Kael: "You're here. I didn't know if you'd come back."
    Offer "Fresh start" option (re-intro quest system without data wipe).
    Track B if returning from DORMANT (gentle re-entry).
```

### 10.4 User Skips Every Quest for 14 Days Straight

```
DETECTION: days_since_last_completion >= 14 AND user still opens app occasionally

RESPONSE:
  Day 3 of skipping: Kael's morning shifts: 
    "I've got something light for you today."
    Auto-reduce quest difficulty (Anchor becomes Ember tier).
  
  Day 5: Kael names the pattern:
    "We've been quiet for a few days. That's okay — but I want to make sure 
     quiet is what you need, not what the fog is telling you you deserve."
  
  Day 7: Check-in flow triggers:
    "How are you doing? Not about quests. About you."
    Options lead to Micro Quest offer or Track B transition.
  
  Day 10+: Kael reduces to minimal presence.
    One morning message every 3 days.
    No quest delivery — just: "I'm here when you want me."
    Ember quest always available as the only option.
  
  Day 14+: Dormant mode enters.
    Weekly notification. "Still here. That's all."
  
  IF track was A → transition to B at Day 3.
  Stats decay per normal rules (0.5/day after grace).
  Fog dims per normal rules (starts Day 7).
  
  CRITICAL: Never make skipping feel like failure. 
  The goal is keeping the door open, not guilt.
```

### 10.5 User is in Crisis at 3 AM

```
SCENARIO: User opens app at 3 AM. Writes to Kael: "I can't do this anymore."

RESPONSE:
  1. Crisis classifier flags Level 2 or 3.
  
  2. IF Level 2 (concern):
     - Energy cost: 0 (immediate)
     - Kael switches to Compassionate register
     - Kael: "I'm here with you. And I want you to know — there are people 
       trained for moments like this."
     - Resource card shown: 988 Lifeline, Crisis Text Line
     - Conversation continues for as long as user needs (no energy gate)
     - Track immediately set to B
     - Logged (anonymized) for safety review
  
  3. IF Level 3 (acute):
     - Full-screen resource overlay (988, Crisis Text Line, 911)
     - All gamification UI hidden
     - Kael: "I need you to talk to someone right now."
     - Flagged for human review within 1 hour
     - If outside business hours: automated safety follow-up scheduled for 9 AM
  
  4. Quiet hours DO NOT apply to user-initiated conversations.
     (Quiet hours only prevent proactive notifications FROM the app)
  
  5. Next day: Kael follows up gently:
     "I was thinking about last night. How are you today?"
     No quest delivery until user explicitly re-engages.
```

### 10.6 User Games the System (Always Refreshes, Picks Easiest Quests)

```
DETECTION SIGNALS:
  - Refresh rate > 2/day average over 7 days
  - Consistently selects lowest-tier option from Choice
  - Reflection depth consistently < 0.3
  - Completion time consistently < 50% of estimated duration
  - Never selects Wildcard (Option C)

RESPONSE (layered):
  
  Layer 1 (passive): Hidden rewards. Since reward amounts aren't visible before 
  completion, there's nothing to optimize toward. This is the primary defense.
  
  Layer 2 (economic): No-refresh bonus (1 Spark for accepting first option set) 
  creates incentive to not refresh.
  
  Layer 3 (algorithmic): After 3 consecutive refresh-aways from a domain, that 
  domain is forced into the next set.
  
  Layer 4 (narrative): After 2 weeks of shallow engagement pattern:
    Kael: "Your recent reflections feel quick. I'm curious — are these quests 
    feeling too easy, or is something else going on?"
    Offers difficulty recalibration.
  
  Layer 5 (structural): All-or-nothing refresh (can't keep one option and reroll 
  the other two) makes refreshing a real decision.
  
  PHILOSOPHY: Gaming is a sign of disengagement, not malice. The system adjusts 
  difficulty and surfaces the pattern narratively. It never punishes.
```

### 10.7 User Changes Timezone

```
SCENARIO: User moves from EST to PST (or travels).

DETECTION: Device timezone changes OR user manually updates timezone in settings.

RESPONSE:
  1. All scheduled jobs (morning quest, evening reflection, midnight processing) 
     shift to new timezone.
  2. If timezone shift would cause a "double day" (2 quest generations in 24h):
     Skip the second generation. Carry over existing quests.
  3. If timezone shift would cause a "lost day" (>36h between generations):
     Generate quests immediately upon timezone detection.
  4. Weekly cycle boundaries adjust to new Monday 00:00 local.
  5. Quiet hours adjust automatically to new local time.
  6. Kael does NOT comment on the timezone change unless user mentions travel.
  7. Stats and decay calculations use calendar days in NEW timezone going forward.
  
  EDGE: User crosses the International Date Line:
    Same logic — longest gap gets a bridge generation, double-day gets skipped.
```

### 10.8 User Deletes and Reinstalls

```
SCENARIO A: User has an account (logged in before uninstalling)
  - Reinstall → login → full state restored from server
  - Map, stats, quest history, Kael memory: all preserved
  - Kael: "You look different. I look different too." (if absent > 7 days)
  - OR no comment (if reinstall was quick, < 24h)

SCENARIO B: User never created an account (was in free Prologue)
  - Data lost. Fresh start.
  - This is by design — Prologue is ephemeral. Creating an account is the commitment.
  
SCENARIO C: User had account, logged out, reinstalled, can't remember credentials
  - Standard account recovery flow (email reset)
  - All data preserved server-side
  
DATA RETENTION: User data persists on server until explicit account deletion request.
```

### 10.9 Two Users Share a Device

```
SCENARIO: Parent and child, or roommates, sharing an iPad.

RESPONSE:
  - App supports multiple profiles (switch via Self tab → profile selector)
  - Each profile has independent: quests, stats, map, Kael memory, archetype
  - Each profile can have its own account OR be a local-only profile
  - Local-only profiles: data on-device only, no server backup, no cross-device sync
  - Privacy: profile switching requires re-authentication (FaceID/passcode)
  - Kael treats each profile as a completely separate person
  
  EDGE: If two profiles interact (one mentions the other to Kael):
    Kael has no knowledge of other profiles. Complete separation.
```

### 10.10 Server/LLM is Down During Guide Chat

```
SCENARIO A: LLM API is down (can't generate Kael responses)

RESPONSE:
  1. Kael has pre-written "low-connectivity" dialogue for common situations:
     - Quest delivery: pre-generated at batch time (always available)
     - Quest completion: 50+ per-domain, per-tier response templates
     - Skip acknowledgment: 20+ templates
     - Crisis: pre-written compassionate responses + resource cards (ALWAYS available, no API needed)
     - General conversation: "The fog between us is thick today. I can feel you, 
       but my words aren't coming clearly. Do what you need to — I'll be clearer soon."
  
  2. Quests still function (handcrafted pool is local/cached)
  3. Stats, fog map, economy all function (server-side, no LLM dependency)
  4. Reflections are stored and processed when LLM is back
  5. Crisis detection uses lightweight local classifier (not dependent on LLM API)
  
SCENARIO B: Our server is down

RESPONSE:
  1. App has offline mode:
     - Today's quests were cached at morning generation time → still accessible
     - Quest completion: queued locally, synced on reconnect
     - Kael: limited to cached/template responses
     - Fog map: local state (syncs on reconnect)
     - Stats: local calculation (syncs on reconnect)
  2. Push notifications: not sent during server outage (they're server-triggered)
  3. On reconnect: full state sync, queued completions processed, LLM catches up
  
SCENARIO C: LLM is degraded (slow, expensive, or low quality)

RESPONSE:
  1. Weekly LLM quest batch: skip if API cost > 2x normal, use handcrafted pool
  2. Kael conversations: increase template usage, reduce LLM calls
  3. Reflection depth analysis: deferred to batch processing
  4. Quest quality: switch to template-only generation temporarily
  
PHILOSOPHY: LLM is an enhancement layer, not load-bearing infrastructure.
The core loop (quest → complete → fog reveals → stat growth) works without any LLM.
```

### 10.11 Additional Edge Cases

**User completes quest then disputes/wants to undo:**
- No undo. Stats and fog are permanent. Kael: "What's done is done. The fog doesn't forget, and neither do I." 
- If they claim they didn't actually do the quest: note in behavioral model, don't remove rewards. Integrity system handles patterns over time.

**User writes nonsense/gibberish in reflections:**
- LLM depth analysis returns depth < 0.1
- Counts as self_report completion (they get minimal rewards)
- After 3 consecutive low-depth reflections: Kael gently addresses it
- No punishment. Rewards are for the action, not the reflection quality.

**User discovers they're on Track B and feels patronized:**
- Track labels are NEVER visible to the user
- If user notices quests are "too easy": they can tell Kael, who offers difficulty increase
- This effectively promotes them to Track A behavior without revealing the system

**User's primary and secondary archetype are the same dimension (impossible):**
- Can't happen by design. Primary and secondary are always different dimensions.
- If the vector has identical top-2 scores: break tie by response_time (Fog Walk) or recency of behavioral signal.

**User subscribes, then cancels mid-season:**
- Revert to free tier: Anchor + Ember only (no Choice)
- Existing progress preserved
- Kael: "The path narrows. But it's still yours."
- If they resubscribe: full access restored immediately

**User's device clock is manually set to future/past:**
- Server time is authoritative for: quest generation, weekly cycle, streaks, decay
- Device time is used only for: UI display, local notifications, quiet hours
- If device time and server time diverge > 24 hours: use server time for everything

**Leap seconds, DST transitions:**
- All server-side timestamps in UTC
- All user-facing times converted from UTC using stored timezone
- DST: scheduled jobs shift with the timezone (8 AM local means 8 AM in new offset)
- If DST transition causes a missed/doubled generation window: same logic as timezone change

---

## Appendix: System Constants

```yaml
# Quest System
QUEST_ANTI_REPEAT_WINDOW_DAYS: 14        # Primary. Falls back to 7, then 3.
QUEST_MIN_POOL_SIZE: 500                  # Handcrafted minimum before launch
QUEST_LLM_BATCH_SIZE: 3                   # Per user per week
QUEST_LLM_START_DAY: 15                   # Day of season when LLM quests appear
DAILY_FREE_REFRESHES_PER_CHOICE_SLOT: 1
REFRESH_ESCAPE_HATCH_THRESHOLD: 3         # Refreshes in a day before escape hatch

# Stats
STAT_RANGE: [0, 100]
STAT_STARTING_VALUE: 15
STAT_DECAY_GRACE_DAYS: 3
STAT_DECAY_RATE_PER_DAY: 0.5             # After grace period
STAT_DECAY_CAP_PER_DAY: 2.0
STAT_FLOOR: 10                            # Never drops below
STAT_DIMINISHING_RETURNS: {50: 0.85, 75: 0.70, 90: 0.50}

# Economy
FRAGMENTS_DAILY_LOGIN: 0                  # No daily login bonus
ENERGY_DAILY_FREE: 3
ENERGY_CARRYOVER: false                   # Resets daily
SPARKS_CAP: 20
FOG_LIGHT_PER_TILE: 1
FOG_LIGHT_PER_LANDMARK: 3
FOG_LIGHT_PER_SIDE_AREA: 5

# Fog Map
TOTAL_TILES: 100
PRE_REVEALED_TILES: 5
HIDDEN_TILES: 20                          # Require Fog Light
QUEST_REVEALABLE_TILES: 75               # Revealed through quest progression
FOG_DIM_START_DAY: 7                      # Days of absence before dimming begins
FOG_DIM_RATE: 0.5                         # Tiles per day
FOG_DIM_MAX_PERCENT: 0.30                 # Never dim more than 30% of revealed
FOG_DIM_LEVELS: 3                         # Visual stages of dimming
TOTAL_LANDMARKS: 13

# Archetype
ARCHETYPE_INITIAL_CONFIDENCE: 0.3
ARCHETYPE_REVEAL_MIN_DAY: 10
ARCHETYPE_REVEAL_CONFIDENCE_THRESHOLD: 0.55
ARCHETYPE_REVEAL_FORCE_DAY: 12
ARCHETYPE_SHIFT_SUSTAINED_DAYS: 7
ARCHETYPE_SEASONAL_RESET_FACTOR: 0.7

# Engagement
ACTIVE_THRESHOLD_HOURS: 72               # Quest completion
DRIFTING_THRESHOLD_HOURS: 120            # Quest completion
ABSENT_THRESHOLD_DAYS: 14                # App open
DORMANT_NOTIFICATION_STOP_DAYS: 60

# Notifications
MAX_NOTIFICATIONS_PER_DAY: 2
QUIET_HOURS_START: 23                     # 11 PM local (default)
QUIET_HOURS_END: 7                        # 7 AM local (default)
NOTIFICATION_COOLDOWN_HOURS: 2            # After dismiss

# Track B
TRACK_B_PROMOTION_COMPLETION_RATE: 0.7
TRACK_B_PROMOTION_MIN_DAYS: 7
TRACK_A_DEMOTION_DAYS_NO_COMPLETION: 3
TRACK_A_DEMOTION_COMPLETION_RATE: 0.3
TRACK_B_REST_CHECKIN_DAYS: 5              # (vs Track A = 3)
TRACK_B_SKIP_CHECKIN_DAYS: 7              # (vs Track A = 5)

# Weekly Cycle
WEEKLY_CYCLE_TARGET: 5                    # Out of 7 days
WEEKLY_CYCLE_PERFECT: 7
WEEKLY_GRACE_DAYS: 2

# Season
SEASON_1_DURATION_DAYS: 42
ACT_1_DAYS: [1, 14]
ACT_2_DAYS: [15, 28]
ACT_3_DAYS: [29, 42]

# Kael
KAEL_CONVERSATION_MAX_TOKENS: 500        # Per response
KAEL_CONTEXT_BUDGET_TOKENS: 4000
KAEL_CONVERSATION_HISTORY_DAYS: 90       # Full text retention
KAEL_MEMORY_COMPRESSION_INTERVAL: 7      # Days between compressions

# Crisis
CRISIS_LEVEL_1: "distress"
CRISIS_LEVEL_2: "concern"
CRISIS_LEVEL_3: "acute"
CRISIS_HUMAN_REVIEW_SLA_HOURS: 1         # For Level 3
```

---

*This document is the single source of truth for how Rewire's systems interact. Every decision tree is implementable. Every threshold is specified. Every edge case has a rule. Build from here.*
