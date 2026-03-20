# Dialogue Integration Reference — For Developers

**Purpose:** Quick lookup for dialogue pool implementation  
**Audience:** Developers building lib/kael.ts and integrating response selection logic

---

## Response Pool Structure

### Pool Naming Convention

```
[Pool-Type].[Tier or Pattern].[Variant]

Examples:
- Ember.Body.FirstCompletion
- Flame.Reach.HighEnergy
- Skip.Micro.TrackB
- Notif.Morning.HighEnergyStreak
```

### Available Pools

| Pool | Tier/Pattern | Contexts | Total |
|---|---|---|---|
| **Ember** | 6 domains (Body, Mind, Heart, Courage, Order, Spirit) | 6 variants each | 36 |
| **Flame** | 8 patterns (Reach, Move, Build, Witness, Release, Root, Summon, Dissolve) | 3 variants each | 24 |
| **Skip** | 4 options (Micro, Rest, Later, RestDay) + Check-in | Track A/B | 15 |
| **Notif** | 7 categories (Day1, Morning, Evening, Milestone, Domain, Dormant, Reengage) | varies | 24 |
| **TOTAL** | | | **99 responses** |

---

## Ember Completion Flow

**When:** User taps "Done" on an Ember quest  
**Where:** app/(app)/(tabs)/quests.tsx → QuestCard.tsx → completion animation  
**Data needed:** `quest.domain`, `user.energy_slider`, `user.stat_history[domain]`, `user.quest_streak`

### Selection Logic

```typescript
function selectEmberResponse(quest: Quest, user: User): string {
  const domain = quest.domain; // "body", "mind", "heart", "courage", "order", "spirit"
  const variant = determineVariant(user, domain);
  
  // Variant determination hierarchy:
  if (user.hasNeverCompletedDomain(domain)) {
    variant = "first_completion";
  } else if (user.energy_slider < 0.33) {
    variant = "low_energy";
  } else if (user.energy_slider > 0.66 && user.streak_count >= 3) {
    variant = "high_energy";
  } else if (user.streak_count >= 3) {
    variant = "streak_active";
  } else if (user.lastDayCompletedQuest === null) { // skipped yesterday
    variant = "after_skip";
  } else {
    variant = "standard";
  }
  
  return getRandomResponse("ember", domain, variant);
}
```

### Response Location

File: `KAEL-DIALOGUE-POOLS.md` § "Domain 1-6: Ember Response Pool"

Example key: `Ember.Body.FirstCompletion`  
Response: `"Your body remembers this. Even when your mind forgets, the ground beneath your feet will remember."`

---

## Flame Completion Flow

**When:** User completes a Flame-tier quest  
**Where:** app/(app)/(tabs)/quests.tsx → completion screen (more dramatic)  
**Data needed:** `quest.archetypal_pattern`, `quest.domain`, `user.energy_slider`, `user.flame_tier_count_in_domain`

### Quest-to-Pattern Mapping

| Archetypal Pattern | Quest Examples | Response Tone |
|---|---|---|
| **Reach** | Message someone, ask for help, show vulnerability | Relational, affirming the bridge-crossing |
| **Move** | Physical challenge, embodied growth | Body-honoring, strength-recognizing |
| **Build** | Create structure, establish routine, organize chaos | Foundation-affirming, load-bearing language |
| **Witness** | Sit with difficulty, acknowledge pattern, listen to truth | Grace-focused, recognition of courage |
| **Release** | Speak something unsaid, forgive, step back from defense | Lightness/freedom, letting go is strength |
| **Root** | Translate insight to action, ground understanding | Activation, translation to reality |
| **Summon** | Call forward unfamiliar courage, act as aspiration | Capacity revelation, you had this inside |
| **Dissolve** | Soften rigid boundary, become permeable | Brave softening, space opens |

### Selection Logic

```typescript
function selectFlameResponse(quest: Quest, user: User): string {
  const pattern = quest.archetypal_pattern; // one of 8 above
  let variant = "standard";
  
  if (user.flameCompletionCountInDomain(quest.domain) === 0) {
    variant = "first_flame_in_domain";
  } else if (user.energy_slider < 0.33) {
    variant = "low_energy";
  } else if (user.energy_slider > 0.66) {
    variant = "high_energy";
  }
  
  return getRandomResponse("flame", pattern, variant);
}
```

### Response Location

File: `KAEL-DIALOGUE-POOLS.md` § "Flame Quest Response Pool"  
Organized by: Reach, Move, Build, Witness, Release, Root, Summon, Dissolve (8 sections)

Example key: `Flame.Reach.FirstFlame`  
Response: `"You reached across the gap. Most people think about doing that. You actually did it..."`

---

## Skip Flow (Not Feeling It Today)

**When:** User taps "Not feeling it today" button  
**Where:** app/(app)/(tabs)/quests.tsx → bottom sheet modal  
**Data needed:** `user.track` (A or B), `user.skip_count_today`, `user.rest_day_count`

### UI Flow

```
User taps "Not feeling it today"
  ↓
Bottom sheet modal appears with Kael's intro:
  "Kael: What do you want to do?"
  ↓
  [🌿 "Make it smaller"]  
  [🛋️ "Just be here"]
  [🌙 "Come back later"]
  [💤 "Rest today"]
```

### Selection Logic for Each Option

**Option 1: "Make it smaller"**
```typescript
function handleMakeSmaller(user: User) {
  const track = user.track; // "A" or "B"
  const variant = getVariant(user.skip_history);
  // e.g., "general", "after_several_skips", "high_streak_recovery"
  
  const kaelResponse = getResponse("skip", "micro", `${track}.${variant}`);
  const microQuest = selectMicroQuest(user);
  
  showMicroQuestScreen(kaelResponse, microQuest);
}

// Micro quest pool (separate from main response pools):
const microQuests = [
  "Open a window for 10 seconds. Feel the air.",
  "Put your hand on your chest. Take three breaths.",
  "Look at something. Really look at it for 15 seconds.",
  "Drink something slowly.",
  "Move one finger, then two, then your whole hand.",
];
```

**Option 2: "Just be here"**
```typescript
function handleJustBeHere(user: User) {
  const track = user.track;
  const variant = determineRestVariant(user); // general, after_painful_quest, return_after_dormancy
  
  const kaelResponse = getResponse("skip", "rest", `${track}.${variant}`);
  
  showFogMapAmbient(kaelResponse);
  // Fog map with no quests, just ambient animation + landmarks
}
```

**Option 3: "Come back later"**
```typescript
function handleComeLater(user: User) {
  const track = user.track;
  const variant = "general" || "evening";
  
  const kaelResponse = getResponse("skip", "later", `${track}.${variant}`);
  startGraceTimer(4 * 60 * 60); // 4 hours
  
  showAcknowledgment(kaelResponse);
}
```

**Option 4: "Rest today"**
```typescript
function handleRestToday(user: User) {
  const track = user.track;
  let variant = "general";
  
  if (user.highActivityYesterday()) {
    variant = "after_high_activity";
  }
  
  const kaelResponse = getResponse("skip", "rest_day", `${track}.${variant}`);
  registerRestDay(user.id); // counts toward 2/7 built-in grace days
  
  if (user.rest_day_count >= 3) {
    scheduleCheckInPrompt(48 * 60 * 60); // 2 days later
  }
}
```

### Check-In Responses (Multi-Day Rest)

```typescript
function showCheckIn(user: User) {
  const kaelIntro = "It's been a few days. I want to check in — not about quests. About you. How are you doing?";
  
  const options = [
    { text: "I'm okay. Just needed a break.", response: "fine" },
    { text: "Not great.", response: "struggling" }
  ];
  
  user.selection === "fine" 
    ? showFineResponse(user.track)
    : showStrugglingResponse(user.track);
}

// Fine responses direct back to quests with gentle restart
// Struggling responses offer resources + Track B option + pause app option
```

### Response Location

File: `KAEL-DIALOGUE-POOLS.md` § "WP5 Support: Skip Flow Responses"

Example key: `Skip.Micro.TrackB.General`  
Response: `"Small is real. That counted. Full stop. No 'but' after that."`

---

## Notification Flow

**When:** Scheduled time (usually 7-9 AM) or milestone trigger  
**Where:** Push notification to device, + in-app notification if user has app open  
**Data needed:** `user.days_active`, `user.energy_trend`, `user.quest_streak`, `user.last_app_open`, `user.track`

### Notification Categories

**1. Day 1 Welcome (Immediate after onboarding)**
```typescript
if (user.days_active === 0) {
  send(getResponse("notif", "day1", "general"));
  // "Most apps start here with a goal..."
}
```

**2. Daily Morning (7-9 AM, once per day)**
```typescript
function selectMorningNotification(user: User): string {
  let variant = "standard";
  
  if (user.energy_trend === "high" && user.streak_count >= 3) {
    variant = "high_energy_streak";
  } else if (user.energy_trend === "low" && user.streak_count >= 3) {
    variant = "low_energy_streak";
  } else if (user.hasJustReturned()) {
    variant = "energy_recovering";
  } else if (user.days_active === 1) {
    variant = "first_quest_ever";
  } else if (user.justCompletedFirstFlame()) {
    variant = "after_first_flame";
  }
  
  return getResponse("notif", "morning", variant);
}
```

**3. Evening Check-In (Optional, 6 PM, only if conditions met)**
```typescript
function shouldSendEvening(user: User): boolean {
  return user.minutesSinceLastAppOpen() > 360 && // 6+ hours inactive
         user.streak_count >= 3 && // on a streak
         !user.sentEvingInLast48Hours() && // not already sent evening today
         user.track === "A"; // Track A gets evening nudges
}
```

**4. Milestone Notifications (1x only)**
```typescript
const milestones = [3, 7, 14, 30]; // days

if (milestones.includes(user.days_active)) {
  send(getResponse("notif", "milestone", `day_${user.days_active}`));
}
```

**5. First-Time Domain (1x per domain)**
```typescript
if (user.justCompletedFirstQuestInDomain(domain)) {
  send(getResponse("notif", "first_domain", domain));
}
```

**6. Dormant Mode (After 7+ day gap)**
```typescript
if (user.days_since_last_completion >= 7) {
  if (user.days_since_last_completion === 7) {
    send(getResponse("notif", "dormant", "day7"));
  } else if (user.days_since_last_completion === 14) {
    send(getResponse("notif", "dormant", "day14"));
  } else if (user.days_since_last_completion === 30) {
    send(getResponse("notif", "dormant", "day30"));
    stopNotifications(user.id); // Silent until return
  }
}
```

**7. Re-engagement (After dormancy + return)**
```typescript
if (user.justReturnedFromDormancy()) {
  if (user.days_since_last_completion === 7 + 1) { // returned after Day 7
    send(getResponse("notif", "reengage", "day7_return"));
  } else if (user.days_since_last_completion >= 14 + 1) { // returned after Day 14+
    send(getResponse("notif", "reengage", "day14_return"));
  }
}
```

### Response Location

File: `KAEL-DIALOGUE-POOLS.md` § "WP7 Support: Notification Messages"

Example key: `Notif.Morning.HighEnergyStreak`  
Response: `"You've got fire today. There's something waiting for you that knows how to use it."`

---

## Database Query Reference

### Load All Responses for a Pool

```sql
SELECT text FROM responses.kael_dialogue_pools 
WHERE pool_type = 'ember' 
  AND context = 'body' 
  AND variant = 'first_completion'
ORDER BY RANDOM() 
LIMIT 1;
```

### Check Response Variants Available

```sql
SELECT DISTINCT variant 
FROM responses.kael_dialogue_pools 
WHERE pool_type = 'skip' 
  AND tier = 'micro';

-- Returns: general, after_several_skips, high_streak_recovery
```

### Load Track A/B Variant

```sql
SELECT text FROM responses.kael_dialogue_pools 
WHERE pool_type = 'skip' 
  AND tier = 'micro' 
  AND track = 'B' 
  AND variant = 'general'
LIMIT 1;
```

---

## Testing Checklist

- [ ] **Ember:** Randomly sample 10 responses. Verify all sound warm and in-character.
- [ ] **Flame:** Verify each archetypal pattern (Reach/Move/Build/etc.) has 3 distinct variants (A/B/C).
- [ ] **Skip:** Verify Track A and Track B have noticeably different tones (A = more optimistic; B = softer).
- [ ] **Notifications:** Verify milestones only send once (3, 7, 14, 30).
- [ ] **Dormant:** Verify notifications stop after Day 30 message until user returns.
- [ ] **Energy variance:** Low-energy Ember should feel different from high-energy Ember of same domain.
- [ ] **No repeats:** If possible, track sent responses to avoid repeating same response on same day.
- [ ] **Micro quests:** Verify all 5-7 micro quests feel achievable from bed (bare minimum friction).

---

## Common Integration Mistakes to Avoid

❌ **Sending same notification variant twice in a row** → Varies by selecting from pool of 6 daily variants  
❌ **Pushing evening notifications on Rest Days** → Check if user chose "Rest today" before sending  
❌ **Not tracking Track A/B cohort** → Ensure user.track is set during onboarding  
❌ **Continuing dormant notifications after Day 30** → Hard stop at Day 30 until return  
❌ **Using clinical language** → If you're tempted to say "behavioral activation," delete it  
❌ **Generic praise** → Every response must name specific action, not "good job"  
❌ **Forgetting forward hooks** → Every completion response needs subtle pull to next action  

---

## Customization Points (Post-MVP)

**Difficulty:** Moderate | **Impact:** High

1. **Quest-specific callbacks:** Layer in recent completion data
   - Current: `"You reached across the gap."`
   - Future: `"Yesterday you reached across the gap. Today that person is still on your mind. That matters."`

2. **Archetype blending:** Personalize by primary/secondary archetype
   - Current: Generic Flame response
   - Future: Flame response written for "Edge primary, Bridge secondary" feels different

3. **Seasonal evolution:** Reference Season 1 in Season 2+
   - Current: `"Your body remembers this."`
   - Future: `"Your body remembers this — it's different than when we started. Stronger. Listening more."`

4. **Micro quest library expansion:** 20+ micro quests instead of 5-7
   - Increases variety and personalization for "Make it smaller" option

5. **Multi-language support:** Translate pools to Spanish, French, etc.
   - Metaphor system (fog, light, ground) translates well
   - Maintain poetic quality in translation, not just literal

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-03-20 | Initial 90-response pool: 36 Ember, 24 Flame, 15 Skip, 24 Notif |
| — | — | Ready for integration + MVP testing |

---

**Questions?** Refer to KAEL-DIALOGUE-POOLS.md for full response text.  
**Voice concerns?** Refer to KAEL-VOICE-AUDIT.md for consistency verification.  
**Integration help?** This reference doc is your quickstart. 🚀
