# WP6 Architecture Diagrams

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Native App                             │
│  (iOS/Android, Expo)                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Quests Screen   │  │  Guide Screen    │  │  Map Screen      │   │
│  │  - QuestCard     │  │  - Chat UI       │  │  - Fog Map       │   │
│  │  - RefreshButton │  │  - Energy Pool   │  │  - Tiles         │   │
│  │  - SparkDisplay  │  │                  │  │                  │   │
│  └─────────┬────────┘  └──────────┬───────┘  └──────────┬────────┘   │
│            │                      │                      │             │
│            └──────────────────────┼──────────────────────┘             │
│                                   ↓                                     │
│            ┌──────────────────────────────────────┐                   │
│            │  Zustand Store (quests.ts)           │                   │
│            │  - dailyQuests: QuestAssignment[]    │                   │
│            │  - sparks: number                    │                   │
│            │                                      │                   │
│            │  Methods:                            │                   │
│            │  - fetchDailyQuests(userId)          │                   │
│            │  - fetchSparks(userId)               │                   │
│            │  - refreshChoiceQuests(userId)       │                   │
│            │  - completeQuest(userId, assignId)   │                   │
│            └──────────────────┬───────────────────┘                   │
│                               │                                        │
│  ┌────────────────────────────┼────────────────────────────┐          │
│  │ HTTP Requests (HTTPS)      │                            │          │
│  └────────────────────────────┼────────────────────────────┘          │
│                               │                                        │
└───────────────────────────────┼────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ↓               ↓               ↓
         ┌────────────┐  ┌────────────┐  ┌─────────────┐
         │  generate- │  │  refresh-  │  │ complete-   │
         │  daily-    │  │  choice-   │  │ quest-wp6   │
         │  quests    │  │  quests    │  │             │
         └─────┬──────┘  └─────┬──────┘  └──────┬──────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │       Supabase      │                     │
         │  (PostgreSQL +      ↓                     │
         │   PL/pgSQL)         │                     │
         │                     │                     │
         ├─────────────────────┼─────────────────────┤
         │                     │                     │
         │  Core Tables:       │  PL/pgSQL           │
         │  - quests           │  Functions:         │
         │  - quest_assignments                      │
         │  - quest_completions    ✓                 │
         │  - user_stats      select_anchor_quest    │
         │  - user_currencies ✓                      │
         │  - user_profiles   generate_choice_       │
         │                    options                │
         │  WP6 Tables:        ✓                     │
         │  - user_sparks      award_sparks_on_      │
         │  - quest_refresh_log  completion          │
         │  - refresh_away_    ✓                     │
         │    tracking         initialize_user_      │
         │  - quest_choice_    sparks                │
         │    history                                │
         │                                           │
         └───────────────────────────────────────────┘
```

---

## Daily Quest Generation Flow

```
┌─────────────────────────┐
│   User Opens App        │
│   (Or daily scheduler   │
│    triggers job)        │
└────────────┬────────────┘
             │
             ↓
   ┌─────────────────────┐
   │  Check if today's   │
   │  quests already     │
   │  generated          │
   └────────┬────────────┘
            │
     ┌──────┴──────┐
     │             │
     NO            YES
     ↓             └─────→ Return "Already generated"
     │
     ↓
┌─────────────────────────┐
│ SELECT ANCHOR QUEST     │
│                         │
│ Weighted Scoring:       │
│ • 40% story_relevance   │
│ • 30% weakest_stat      │
│ • 20% energy            │
│ • 10% anti_rep          │
│                         │
│ Result: 1 quest ✓       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ INSERT Anchor Quest     │
│ quest_assignments       │
│ slot_type=anchor        │
│ status=active           │
│ expires_at=tomorrow     │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ Check if Choice         │
│ unlocked:               │
│ first_quest_completed   │
│ = true?                 │
└────────┬────────────────┘
         │
    ┌────┴────┐
    NO        YES
    │         │
    │         ↓
    │    ┌────────────────────┐
    │    │ GENERATE CHOICE    │
    │    │ OPTIONS            │
    │    │                    │
    │    │ Option A:          │
    │    │ Primary domain,    │
    │    │ current tier       │
    │    │                    │
    │    │ Option B:          │
    │    │ Secondary domain   │
    │    │ or unexplored,     │
    │    │ current tier       │
    │    │                    │
    │    │ Option C:          │
    │    │ Wildcard,          │
    │    │ stretch tier       │
    │    │                    │
    │    │ Diversity check ✓  │
    │    └─────┬──────────────┘
    │          │
    │          ↓
    │    ┌──────────────────┐
    │    │ INSERT 3 Choice  │
    │    │ assignments      │
    │    │ slot_type=choice │
    │    │ status=active    │
    │    └─────┬────────────┘
    │          │
    └─────┬────┘
         │
         ↓
    ┌────────────────────┐
    │ SELECT + INSERT    │
    │ EMBER QUEST        │
    │ slot_type=ember    │
    │ status=active      │
    └─────┬──────────────┘
         │
         ↓
    ┌────────────────────┐
    │ RETURN:            │
    │ {                  │
    │   anchor: {…},     │
    │   choice_options   │
    │     [1,2,3],       │
    │   ember: {…}       │
    │ }                  │
    │                    │
    │ Status: 200 ✓      │
    └────────────────────┘
```

---

## Refresh Choice Quest Flow

```
┌─────────────────────────┐
│  User taps              │
│  "Shuffle" Button       │
│  (refresh)              │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ Check if free refresh   │
│ available today         │
│                         │
│ COUNT refresh_log       │
│ WHERE user_id=X         │
│   AND refresh_date=today│
└────────┬────────────────┘
         │
    ┌────┴────────────┐
    │                 │
  COUNT=0            COUNT≥1
  (free)             (costs 1 Spark)
    │                 │
    ↓                 ↓
  cost=0          cost=1
    │                 │
    │            ┌────────────────┐
    │            │ Check Spark    │
    │            │ Balance        │
    │            │                │
    │            │ SELECT sparks  │
    │            │ FROM user_sparks
    │            └─────┬──────────┘
    │                  │
    │            ┌─────┴─────┐
    │            │           │
    │         sparks      sparks < 1
    │          ≥ 1           │
    │            │           │
    │            ↓           ↓
    │            │      ┌──────────────┐
    │            │      │ Return 402   │
    │            │      │ "Insufficient
    │            │      │  Sparks"     │
    │            │      └──────────────┘
    │            │
    └────┬───────┘
         │
         ↓
┌─────────────────────────┐
│ If cost > 0:            │
│ UPDATE user_sparks      │
│ SET sparks = sparks - 1 │
│ WHERE user_id = X       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ INSERT into             │
│ currency_transactions   │
│ (audit trail)           │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ UPDATE quest_assignments
│ SET status='expired'    │
│ WHERE user_id=X         │
│   AND slot_type=choice  │
│   AND assigned_date=today
│   AND status=active     │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ CALL generate_choice_   │
│ options(user_id,today)  │
│                         │
│ Returns 3 new quest IDs │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ INSERT 3 new Choice     │
│ assignments (fresh set) │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ UPDATE quest_refresh_log│
│ refresh_count_after++   │
│ WHERE user_id=X, today  │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ Track refresh-away      │
│ domains for anti-       │
│ cherry-pick (update     │
│ refresh_away_tracking)  │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ RETURN:                 │
│ {                       │
│   success: true,        │
│   sparks_cost: N,       │
│   new_options: [1,2,3]  │
│ }                       │
│                         │
│ Status: 200 ✓           │
└─────────────────────────┘
```

---

## Quest Completion + Spark Reward Flow

```
┌─────────────────────────┐
│  User taps              │
│  "Complete Quest"       │
│  (on a quest card)      │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ FN: complete-quest-wp6  │
│ INPUT: {                │
│   user_id,              │
│   assignment_id,        │
│   completion_type       │
│ }                       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 1. Fetch assignment details     │
│    (slot_type, quest_id)        │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 2. Fetch quest details          │
│    (domain, tier, rewards)      │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 3. CALCULATE STAT GAINS         │
│    CALL calculate_stat_gain()   │
│    INPUT: domain, tier,         │
│            resistance_mult      │
│    OUTPUT: stat_gain amount     │
│                                 │
│    Factors:                     │
│    • Base (tier dependent)      │
│    • Weakest-2 bonus            │
│    • Streak modifier            │
│    • Diminishing returns        │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 4. UPDATE user_stats            │
│    domain_stat += stat_gain     │
│    last_quest_date = now()      │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 5. UPDATE user_currencies       │
│    fragments += reward_fragments │
│    fog_light += reward_fog_light │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ 6. AWARD SPARKS ★★★ (WP6 KEY!)     │
│                                     │
│ sparks_earned = 0                   │
│                                     │
│ IF slot_type=anchor:                │
│   sparks_earned += 1                │
│                                     │
│ IF slot_type=choice:                │
│   IF first_set (no refresh):        │
│     sparks_earned += 1              │
│                                     │
│ IF weekly_cycle 5/7 completed:      │
│   sparks_earned += 2                │
│                                     │
│ IF all_3_slots_today:               │
│   sparks_earned += 1                │
│                                     │
│ IF streak≥3 days:                   │
│   sparks_earned += 1                │
│                                     │
│ new_balance = MIN(                  │
│   old_balance + sparks_earned, 20   │
│ )                                   │
└────────┬──────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 7. UPDATE user_sparks           │
│    sparks = new_balance         │
│    last_earned = now()          │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 8. INSERT currency_transactions │
│    (sparks transaction log)      │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 9. INSERT quest_completions     │
│    (completion record)           │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ 10. UPDATE quest_assignments    │
│     status = completed          │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ RETURN:                         │
│ {                               │
│   success: true,                │
│   quest_title: "...",           │
│   stat_gains: {                 │
│     [domain]: amount            │
│   },                            │
│   fragments_earned: N,          │
│   sparks_earned: N,             │
│   sparks_balance: N,            │
│   kael_response: "..."          │
│ }                               │
│                                 │
│ Status: 200 ✓                   │
└─────────────────────────────────┘
```

---

## Spark Economy Over Time (Week)

```
Day 1 (Monday)
  Start: 0 Sparks
  • Complete Anchor quest         +1 → 1 Spark
  • Refresh Choice (free)         +0 → 1 Spark
  • Complete Choice quest (1st)   +1 → 2 Sparks
  
Day 2 (Tuesday)
  Start: 2 Sparks
  • Complete Anchor               +1 → 3 Sparks
  • Refresh Choice (1st paid)     -1 → 2 Sparks
  • Complete Choice               +1 → 3 Sparks
  • Complete Ember (bonus)        +0 → 3 Sparks (Ember doesn't earn)
  
Day 3 (Wednesday)
  Start: 3 Sparks
  • Complete Anchor               +1 → 4 Sparks
  • Refresh Choice (1st paid)     -1 → 3 Sparks
  • Complete all 3 slots          +1 → 4 Sparks ← 3-slot bonus
  
  (3-day Anchor streak!) 
  • Streak bonus (day 3)          +1 → 5 Sparks
  
Day 4 (Thursday)
  Start: 5 Sparks
  • Complete Anchor               +1 → 6 Sparks
  • Complete Choice (refresh#2)   -1 → 5 Sparks
  
Day 5 (Friday)
  Start: 5 Sparks
  • Complete Anchor               +1 → 6 Sparks
  • Complete Choice               +1 → 7 Sparks
  
Day 6 (Saturday)
  Start: 7 Sparks
  • Complete Anchor (5th this week) → +2 → 9 Sparks ← WEEKLY BONUS!
  • Refresh Choice (1st paid)     -1 → 8 Sparks
  • Complete Choice               +1 → 9 Sparks
  
Day 7 (Sunday)
  Start: 9 Sparks
  • Complete Anchor (6th)         +1 → 10 Sparks
  • Complete Choice               +1 → 11 Sparks
  
End of Week: 11 Sparks (stable around 8-12 range)

Next week resets — cycle continues.
```

---

## Spark Spending Pattern (Typical User)

```
If 1 refresh per day:
  • Day 1-7: 7 free refreshes (cost 0)
  • Day 8+: Paid refreshes
  • Cost: ~7 Sparks/week
  
Spark earning rate: ~8-12/week
Net: +1 to +5 Sparks/week (equilibrium)

User with 2 refreshes/day:
  • First refresh: free
  • Second refresh: 1 Spark × 7 days = 7 Sparks
  • Total spend: 7 Sparks/week
  • Result: Marginal

User with 5 refreshes/day (power user):
  • Cost: 4 × 7 = 28 Sparks/week
  • But earning ~12/week
  • Result: Spark balance steadily drops
  • Hits cap at 0 Sparks → Can only use 1 free refresh/day
  • ← Self-regulating mechanic!
```

---

## Anti-Cherry-Pick Example

```
Day 1: User avoids Courage
  • Generated: Courage, Mind, Order
  • User refreshes
  • Courage marked as "refresh-away" #1

Day 2: User avoids Courage again
  • Generated: Courage, Spirit, Heart
  • User refreshes
  • Courage marked as "refresh-away" #2

Day 3: User avoids Courage AGAIN
  • Generated: Courage, Body, Mind
  • User refreshes
  • Courage marked as "refresh-away" #3 ← THRESHOLD
  
Day 4: ENFORCEMENT
  • Generated options normally
  • But: Courage is FORCED into set (either A, B, or C)
  • Cannot be refreshed away again that day
  • ← User must face Courage eventually

Day 11: Reset (7 days since day 4)
  • Refresh-away counter for Courage resets to 0
  • User can avoid it again (cycle repeats)
```

---

## Database Schema (Simplified)

```
┌─────────────────────────────────────────────┐
│            user_sparks                      │
├─────────────────────────────────────────────┤
│ user_id (PK, FK → user_profiles.id)         │
│ sparks (INT, 0-20)                          │
│ last_earned (TIMESTAMPTZ)                   │
│ updated_at (TIMESTAMPTZ)                    │
└─────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│           quest_refresh_log                  │
├──────────────────────────────────────────────┤
│ id (UUID, PK)                                │
│ user_id (FK → user_profiles.id)              │
│ refresh_date (DATE, PK part 2)               │
│ refresh_count_after (INT)                    │
│ updated_at (TIMESTAMPTZ)                     │
│ UNIQUE(user_id, refresh_date)                │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│       refresh_away_tracking                  │
├──────────────────────────────────────────────┤
│ id (UUID, PK)                                │
│ user_id (FK → user_profiles.id)              │
│ domain (quest_domain, PK part 2)             │
│ refresh_count (INT, 1-3)                     │
│ last_refresh (TIMESTAMPTZ)                   │
│ reset_at (TIMESTAMPTZ, now+7days)            │
│ UNIQUE(user_id, domain)                      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│        quest_choice_history (analytics)      │
├──────────────────────────────────────────────┤
│ id (UUID, PK)                                │
│ user_id (FK → user_profiles.id)              │
│ assignment_date (DATE)                       │
│ option_1_quest_id (FK → quests.id)           │
│ option_2_quest_id (FK → quests.id)           │
│ option_3_quest_id (FK → quests.id)           │
│ chosen_quest_id (FK → quests.id)             │
│ refresh_count (INT)                          │
│ created_at (TIMESTAMPTZ)                     │
│ UNIQUE(user_id, assignment_date, refresh_cnt)│
└──────────────────────────────────────────────┘
```

---

**All diagrams are ASCII art for easy copying and reference.**  
**Use these with the detailed spec documents for full understanding.**

