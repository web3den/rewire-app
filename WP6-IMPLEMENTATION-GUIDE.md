# WP6 Implementation Guide — Quest Assignment + Spark Economy

## Overview

This guide walks through integrating WP6 (Quest Assignment Algorithm + Edge Functions + Spark Economy) into the Rewire app backend. It covers:

1. **Database migration** — New tables for Sparks, refresh tracking, anti-cherry-pick
2. **PL/pgSQL functions** — Quest selection algorithm, Spark rewards, anti-gaming logic
3. **Edge functions** — Daily quest generation, refresh handler, quest completion with Spark logic
4. **Client integration** — How UI components call these functions
5. **Testing & deployment** — Verification steps before production

---

## Part 1: Database Setup

### 1.1 Run Migration

```bash
cd ~/projects/rewire-app
supabase migration up
```

This applies `supabase/migrations/20260320000000_wp6_quest_assignment_system.sql`, which creates:

- `user_sparks` — Spark balance per user (capped at 20)
- `quest_refresh_log` — Tracks refresh count per day per user
- `refresh_away_tracking` — Anti-cherry-pick counter (tracks domains user avoids)
- `quest_choice_history` — Analytics log of choice options shown and chosen

Plus PL/pgSQL functions:
- `select_anchor_quest()` — Weighted selection algorithm
- `generate_choice_options()` — 3-card deck generation with diversity
- `award_sparks_on_completion()` — Spark reward calculation
- `initialize_user_sparks()` — Trigger on user creation

### 1.2 Verify Tables Created

```sql
-- Check in Supabase SQL editor:
SELECT * FROM user_sparks LIMIT 1;
SELECT * FROM quest_refresh_log LIMIT 1;
SELECT * FROM refresh_away_tracking LIMIT 1;
\df+ select_anchor_quest
\df+ generate_choice_options
```

---

## Part 2: Edge Function Deployment

### 2.1 Deploy generate-daily-quests

```bash
supabase functions deploy generate-daily-quests
```

**Verify deployment:**

```bash
curl -X POST https://<PROJECT>.supabase.co/functions/v1/generate-daily-quests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"user_id": "<TEST_USER_ID>"}'
```

Expected response (200):
```json
{
  "success": true,
  "anchor": { "id": "...", "title": "...", "domain": "body", "tier": "ember" },
  "choice_options": [
    { "id": "...", "title": "...", "domain": "mind", "tier": "flame" },
    { "id": "...", "title": "...", "domain": "heart", "tier": "flame" },
    { "id": "...", "title": "...", "domain": "courage", "tier": "blaze" }
  ],
  "ember": { "id": "...", "title": "..." }
}
```

### 2.2 Deploy refresh-choice-quests

```bash
supabase functions deploy refresh-choice-quests
```

**Verify deployment:**

```bash
# First refresh (should be free)
curl -X POST https://<PROJECT>.supabase.co/functions/v1/refresh-choice-quests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"user_id": "<TEST_USER_ID>"}'
```

Expected response (200):
```json
{
  "success": true,
  "sparks_cost": 0,
  "new_options": [
    { "id": "...", "title": "...", "domain": "order", "tier": "flame" },
    ...
  ]
}
```

**Second refresh (should cost 1 Spark):**

```bash
curl -X POST https://<PROJECT>.supabase.co/functions/v1/refresh-choice-quests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"user_id": "<TEST_USER_ID>"}'
```

Expected response (200 if Sparks >= 1, else 402):
```json
{
  "success": true,
  "sparks_cost": 1,
  "sparks_available": 5,  // After deduction
  "new_options": [...]
}
```

### 2.3 Deploy complete-quest (WP6 version)

If you have an existing `complete-quest` function, add the Spark logic from `complete-quest-wp6/index.ts` into it. Or:

```bash
supabase functions deploy complete-quest-wp6
```

Then migrate calls in the app from `complete-quest` to `complete-quest-wp6`.

---

## Part 3: Client Integration

### 3.1 Stores: Update quests.ts Store

Add Spark state and refresh logic:

```typescript
// stores/quests.ts

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface QuestsStore {
  dailyQuests: any[];
  sparks: number;
  
  // Fetchers
  fetchDailyQuests: (userId: string) => Promise<void>;
  fetchSparks: (userId: string) => Promise<void>;
  
  // Actions
  refreshChoiceQuests: (userId: string) => Promise<void>;
  completeQuest: (userId: string, assignmentId: string, reflectionText?: string) => Promise<void>;
}

export const useQuestsStore = create<QuestsStore>((set, get) => ({
  dailyQuests: [],
  sparks: 0,

  fetchDailyQuests: async (userId: string) => {
    try {
      // Get today's assignments
      const today = new Date().toISOString().split('T')[0];
      const { data: assignments } = await supabase
        .from('quest_assignments')
        .select('*, quest:quests(*)')
        .eq('user_id', userId)
        .eq('assigned_date', today)
        .eq('status', 'active');

      set({ dailyQuests: assignments || [] });
    } catch (error) {
      console.error('Error fetching daily quests:', error);
    }
  },

  fetchSparks: async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_sparks')
        .select('sparks')
        .eq('user_id', userId)
        .single();

      set({ sparks: data?.sparks || 0 });
    } catch (error) {
      console.error('Error fetching sparks:', error);
    }
  },

  refreshChoiceQuests: async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('refresh-choice-quests', {
        body: { user_id: userId },
      });

      if (error) throw error;

      if (data.success) {
        // Update Sparks and refresh daily quests
        set({ sparks: data.sparks_available || 0 });
        await get().fetchDailyQuests(userId);
      } else {
        throw new Error(data.error || 'Refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing choice quests:', error);
      throw error;
    }
  },

  completeQuest: async (userId: string, assignmentId: string, reflectionText?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('complete-quest-wp6', {
        body: {
          user_id: userId,
          assignment_id: assignmentId,
          completion_type: 'self_report',
          reflection_text: reflectionText,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        set({ sparks: data.sparks_balance || 0 });
        // Refresh quests view
        await get().fetchDailyQuests(userId);
      } else {
        throw new Error(data.error || 'Completion failed');
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      throw error;
    }
  },
}));
```

### 3.2 UI Components

#### QuestCard Component

```typescript
// components/QuestCard.tsx

import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useQuestsStore } from '@/stores/quests';

interface QuestCardProps {
  quest: any;
  assignmentId: string;
  onComplete?: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, assignmentId, onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { completeQuest } = useQuestsStore();
  const userId = useAuth().user?.id;

  const handleComplete = async () => {
    if (!userId) return;
    
    try {
      setIsCompleting(true);
      await completeQuest(userId, assignmentId);
      Alert.alert('Quest Complete!', quest.narrative_completion);
      onComplete?.();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to complete quest');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Quest header (collapsed view) */}
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.domain}>{quest.domain}</Text>
        <Text style={styles.tier}>{quest.tier}</Text>
        <Text style={styles.time}>~{quest.duration_estimate_min} min</Text>
      </Pressable>

      {/* Expanded view */}
      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.description}>{quest.description}</Text>
          <Text style={styles.instruction}>{quest.instruction}</Text>
          
          {/* Complete button */}
          <Pressable
            onPress={handleComplete}
            disabled={isCompleting}
            style={[styles.button, isCompleting && styles.buttonDisabled]}
          >
            {isCompleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Complete Quest</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = {
  card: { padding: 12, borderRadius: 8, backgroundColor: '#1a1a24', marginBottom: 8 },
  header: { paddingBottom: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
  domain: { fontSize: 12, color: '#e8a838' },
  tier: { fontSize: 10, color: '#999' },
  time: { fontSize: 12, color: '#666' },
  expanded: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#333' },
  description: { fontSize: 14, color: '#ccc', marginBottom: 8 },
  instruction: { fontSize: 13, color: '#999', marginBottom: 12 },
  button: { backgroundColor: '#e8a838', padding: 12, borderRadius: 6 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#000', fontWeight: '600', textAlign: 'center' },
};
```

#### RefreshButton Component

```typescript
// components/RefreshButton.tsx

import React, { useState } from 'react';
import { Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { useQuestsStore } from '@/stores/quests';
import { useAuth } from '@/stores/auth';

interface RefreshButtonProps {
  sparksAvailable: number;
  refreshCount: number;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ sparksAvailable, refreshCount }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshChoiceQuests } = useQuestsStore();
  const { user } = useAuth();

  const cost = refreshCount === 0 ? 0 : 1;
  const canRefresh = cost === 0 || sparksAvailable >= cost;

  const handleRefresh = async () => {
    if (!user?.id || !canRefresh) return;

    try {
      setIsLoading(true);
      await refreshChoiceQuests(user.id);
      Alert.alert('Quests refreshed!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleRefresh}
      disabled={!canRefresh || isLoading}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: canRefresh ? '#e8a838' : '#666',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Text style={{ color: '#000', fontWeight: '600', marginRight: 6 }}>
            🔄 Shuffle
          </Text>
          <Text style={{ color: '#000', fontSize: 12 }}>
            {cost === 0 ? 'Free' : `${cost} ✦`}
          </Text>
        </>
      )}
    </Pressable>
  );
};
```

#### SparkDisplay Component

```typescript
// components/SparkDisplay.tsx

import React from 'react';
import { View, Text } from 'react-native';

interface SparkDisplayProps {
  sparks: number;
}

export const SparkDisplay: React.FC<SparkDisplayProps> = ({ sparks }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 18 }}>✦</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8a838' }}>
        {sparks}/20
      </Text>
    </View>
  );
};
```

### 3.3 Quests Screen Integration

```typescript
// app/(app)/(tabs)/quests.tsx

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useAuth } from '@/stores/auth';
import { useQuestsStore } from '@/stores/quests';
import { QuestCard } from '@/components/QuestCard';
import { RefreshButton } from '@/components/RefreshButton';
import { SparkDisplay } from '@/components/SparkDisplay';

export default function QuestsScreen() {
  const { user } = useAuth();
  const { dailyQuests, sparks, fetchDailyQuests, fetchSparks } = useQuestsStore();
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchDailyQuests(user.id);
      fetchSparks(user.id);
    }
  }, [user?.id]);

  // Group by slot type
  const anchor = dailyQuests.find((q) => q.slot_type === 'anchor');
  const choices = dailyQuests.filter((q) => q.slot_type === 'choice');
  const ember = dailyQuests.find((q) => q.slot_type === 'ember');

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <View style={{ padding: 16 }}>
        <SparkDisplay sparks={sparks} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Anchor */}
        {anchor && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8a838', marginBottom: 8 }}>
              ANCHOR QUEST
            </Text>
            <QuestCard
              quest={anchor.quest}
              assignmentId={anchor.id}
              onComplete={() => fetchDailyQuests(user!.id)}
            />
          </View>
        )}

        {/* Choice */}
        {choices.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8a838' }}>
                CHOOSE 1 OF 3
              </Text>
              <RefreshButton sparksAvailable={sparks} refreshCount={refreshCount} />
            </View>
            {choices.map((choice) => (
              <QuestCard
                key={choice.id}
                quest={choice.quest}
                assignmentId={choice.id}
                onComplete={() => fetchDailyQuests(user!.id)}
              />
            ))}
          </View>
        )}

        {/* Ember */}
        {ember && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 8 }}>
              QUICK QUEST
            </Text>
            <QuestCard
              quest={ember.quest}
              assignmentId={ember.id}
              onComplete={() => fetchDailyQuests(user!.id)}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
```

---

## Part 4: Testing Checklist

### Unit Tests (Database Functions)

```sql
-- Test select_anchor_quest
SELECT * FROM select_anchor_quest(
  (SELECT id FROM user_profiles LIMIT 1),
  CURRENT_DATE
) LIMIT 3;

-- Test generate_choice_options
SELECT option_1, option_2, option_3 FROM generate_choice_options(
  (SELECT id FROM user_profiles LIMIT 1),
  CURRENT_DATE
);

-- Test Spark cap
INSERT INTO user_sparks (user_id, sparks)
SELECT id, 25 FROM user_profiles LIMIT 1;

UPDATE user_sparks SET sparks = LEAST(sparks + 10, 20);

SELECT sparks FROM user_sparks LIMIT 1; -- Should be capped at 20
```

### Integration Tests (Edge Functions)

```bash
# 1. Generate daily quests
USER_ID="<test-user-uuid>"

curl -X POST https://<PROJECT>.supabase.co/functions/v1/generate-daily-quests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d "{\"user_id\": \"$USER_ID\"}"

# Expected: 200, success=true, anchor+choice+ember assigned

# 2. Refresh (first time, should be free)
curl -X POST https://<PROJECT>.supabase.co/functions/v1/refresh-choice-quests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d "{\"user_id\": \"$USER_ID\"}"

# Expected: 200, sparks_cost=0, new_options populated

# 3. Refresh again (should cost 1 Spark)
curl -X POST https://<PROJECT>.supabase.co/functions/v1/refresh-choice-quests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d "{\"user_id\": \"$USER_ID\"}"

# Expected: 200, sparks_cost=1, sparks deducted

# 4. Complete a quest
ASSIGNMENT_ID="<assignment-uuid>"

curl -X POST https://<PROJECT>.supabase.co/functions/v1/complete-quest-wp6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"assignment_id\": \"$ASSIGNMENT_ID\",
    \"completion_type\": \"self_report\"
  }"

# Expected: 200, success=true, sparks_earned populated, stat_gains shown
```

### E2E Test Flow

1. **Create test user** via sign-up
2. **Complete onboarding** (First Light)
3. **Call generate-daily-quests** → Verify Anchor, Choice (if unlocked), Ember assigned
4. **Call refresh-choice-quests** twice → Verify 1st free, 2nd costs 1 Spark
5. **Call complete-quest-wp6** on Anchor → Verify Spark earned (+1)
6. **Check user_sparks** → Verify balance increased
7. **Verify weekly cycle** → Run 5-7 Anchor completions, check +2 Spark bonus
8. **Test anti-cherry-pick** → Refresh away from 1 domain 3 times, verify forced next set
9. **Test Spark cap** → Complete enough quests to reach 20, verify no overage

---

## Part 5: Deployment Checklist

- [ ] Database migration applied (`supabase migration up`)
- [ ] All new tables created and indices built
- [ ] PL/pgSQL functions compiled without errors
- [ ] Edge functions deployed:
  - [ ] `generate-daily-quests` tested end-to-end
  - [ ] `refresh-choice-quests` tested (free + Spark cost paths)
  - [ ] `complete-quest-wp6` tested with Spark rewards
- [ ] Client stores updated:
  - [ ] `useQuestsStore` has Spark state + methods
  - [ ] `useAuth` has proper user context
- [ ] UI components integrated:
  - [ ] `QuestCard` renders and completes quests
  - [ ] `RefreshButton` shows cost and calls refresh
  - [ ] `SparkDisplay` shows balance
- [ ] Full user flow tested:
  - [ ] Day 1: Sign up → Onboarding → First Light → First Anchor/Choice generated
  - [ ] Day 1: Complete Anchor → +1 Spark
  - [ ] Day 1: Refresh Choice 1st time (free), 2nd time (-1 Spark)
  - [ ] Weekly: 5 Anchor completions → +2 Spark bonus
- [ ] Analytics logged:
  - [ ] `quest_choice_history` populated on generation
  - [ ] `currency_transactions` logged for Spark changes
- [ ] Error handling verified:
  - [ ] "Insufficient Sparks" returns 402
  - [ ] Invalid assignment_id returns 400
  - [ ] Database errors return 500 with safe message
- [ ] Monitoring set up:
  - [ ] Function logs visible in Supabase dashboard
  - [ ] Errors tracked and alerted

---

## Part 6: Post-Launch Monitoring

### Key Metrics to Watch

1. **Spark Economy Health**
   - Average Sparks per user per day (target: ~1.5)
   - Spark cap % users (should be ~15-20%)
   - Refresh rate per user per day (target: 1-1.5)

2. **Quest Assignment**
   - Anchor completion rate (target: >70%)
   - Choice first-set acceptance rate (target: >60%)
   - Domain balance (should be roughly even across 6 domains)

3. **Anti-Gaming**
   - Cherry-pick refresh rate (should drop after forcing)
   - Spark spend distribution (should be continuous, not bursty)

### Debug Queries

```sql
-- Check Spark balance for a user
SELECT sparks FROM user_sparks WHERE user_id = '<user-id>';

-- Check refresh history
SELECT refresh_date, refresh_count_after FROM quest_refresh_log WHERE user_id = '<user-id>' ORDER BY refresh_date DESC;

-- Check Spark transactions
SELECT reason, amount, balance_after, created_at FROM currency_transactions WHERE user_id = '<user-id>' AND currency = 'sparks' ORDER BY created_at DESC;

-- Check anti-cherry-pick tracking
SELECT domain, refresh_count, last_refresh FROM refresh_away_tracking WHERE user_id = '<user-id>';

-- Check quest selection distribution (last 30 days)
SELECT 
  qa.slot_type,
  q.domain,
  COUNT(*) as count
FROM quest_assignments qa
JOIN quests q ON q.id = qa.quest_id
WHERE qa.user_id = '<user-id>'
  AND qa.assigned_date >= CURRENT_DATE - 30
GROUP BY qa.slot_type, q.domain
ORDER BY slot_type, domain;
```

---

## Next Steps (WP7 + WP8)

- **WP7 (Kael Notifications):** Scheduling, contextual content, opt-out flows
- **WP8 (Analytics Schema):** Event tracking, user state snapshots, cohort analysis

Both build atop WP6 and use similar edge function patterns.

---

## Support & Troubleshooting

**Q: Refresh returns "Invalid JSON"**
A: Ensure `user_id` is a valid UUID string in the request body.

**Q: Sparks not increasing after quest completion**
A: Check function logs in Supabase dashboard. Ensure `user_sparks` table has a row for the user (auto-created on signup via trigger).

**Q: Choice options are repetitive**
A: Check `generate_choice_options()` function — ensure 7-day quest history is being queried correctly. May need to expand candidate pool if quest count is low.

**Q: Anti-cherry-pick not triggering**
A: Verify `refresh_away_tracking` table is populated. Check that 3 refreshes are tracked for the same domain.

---

**Status:** WP6 implementation complete. Ready for integration and testing.
**Estimated Integration Time:** 3-4 hours (testing included)
**Risk Level:** Low (all logic in database/edge functions, UI is thin wrapper)

