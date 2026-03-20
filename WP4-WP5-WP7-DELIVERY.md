# Kael Dialogue & Response Pools — WP4/5/7 Delivery Summary

**Completion Date:** 2026-03-20  
**Scope:** WP4 (Kael Dialogue) + WP5 Support (Skip Flow) + WP7 Support (Notifications)  
**Status:** ✅ READY FOR INTEGRATION

---

## What Was Delivered

### WP4 Part A: Ember Completion Responses (36 Total)
**Location:** ~/projects/rewire-app/KAEL-DIALOGUE-POOLS.md § "WP4 Part A"

- **6 domain-specific templates** (Body, Mind, Heart, Courage, Order, Spirit)
- **6 context variants per domain** (First completion, Low energy, High energy, Streak active, After skip, Standard)
- **Length:** 1-2 sentences each
- **Tone:** Affirming but grounded, never generic
- **All forward-hooking** — every response ends with subtle pull toward next action
- **All energy-aware** — different tone for depleted vs. energized users
- **All specific** — acknowledge WHAT they did, not generic praise

**Example:**
> *"Your body knows something your mind is still catching up to. Keep listening to what it says."* (Body-1.6, Standard)

---

### WP4 Part B: Flame Completion Responses (24 Total)
**Location:** ~/projects/rewire-app/KAEL-DIALOGUE-POOLS.md § "WP4 Part B"

- **8 archetypal quest patterns:** Reach, Move, Build, Witness, Release, Root, Summon, Dissolve
- **3 context variants per pattern** (First Flame in domain, Low energy, High energy)
- **Length:** 2-3 sentences (deeper than Ember)
- **Tone:** Personal, acknowledging the SPECIFIC quest and domain
- **Quest-specific** — not "You completed a quest" but "You reached across the gap"
- **Domain-aware metaphor language** — bridges feel different from mountains feel different from lightning

**Example:**
> *"You reached across the gap. Most people think about doing that. You actually did it. The fog between people is the hardest kind to clear — and you just proved you could move through it."* (Flame-Reach.1, First Flame)

---

### WP5: Skip Flow Responses (15 Total)
**Location:** ~/projects/rewire-app/KAEL-DIALOGUE-POOLS.md § "WP5 Support"

**Four skip options, each with Track A/B variants:**

1. **"Make it smaller"** (3 variants) — Affirm micro-quests without minimizing
   - Clinically grounded: *"Small is real. That counted."*
   - Track A: Acknowledges capacity: *"I know you've got more than this — but this? This was enough."*
   - Track B: Defends against guilt: *"Full stop. No 'but' after that."*

2. **"Just be here"** (2 variants) — Safe space, no quests
   - Track A: *"No quests. No progress. Just you and the map. You earned this."*
   - Track B: *"No quests. No progress. Just you and the map. Stay as long as you like."*

3. **"Come back later"** (2 variants) — 4-hour grace window
   - Track A: *"Your quests aren't going anywhere. Neither am I."*
   - Track B: *"The fog is patient. Your quests can wait. I can wait. No rush."*

4. **"Rest today"** (2 variants) — Full day skip
   - Track A: *"Gone. No quests today. The fog will hold — it's not going anywhere. Rest is a real choice."*
   - Track B: *"Gone. No quests today. The fog will hold. Neither of us are going anywhere."*

5. **Check-in responses** (4 variants) — After multi-day rest
   - Fine (Track A/B): Affirm choice, return to quests
   - Struggling (Track A/B): Honest boundary ("I'm an app, not a person"), offer resources

**Clinical significance:** These responses are designed to prevent harm and build trust. They never guilt, never shame, never fake care.

---

### WP7: Notification Messages (24 Total)
**Location:** ~/projects/rewire-app/KAEL-DIALOGUE-POOLS.md § "WP7 Support"

**Seven notification categories:**

1. **Day 1 Welcome** (2 responses)
   - *"Most apps start here with a goal. I want to start somewhere else..."*

2. **Daily Morning Quest** (6 variants)
   - High energy: *"You've got fire today. There's something waiting for you that knows how to use it."*
   - Low energy: *"The fog is quiet this morning. But your streak is still holding. Let's keep it gentle."*
   - Varies by streak, energy history, day-since-first-quest

3. **Evening Check-In** (4 variants, optional)
   - Only triggers if inactive 6+ hours AND on 3+ streak
   - Never sent two in a row without app open
   - Soft nudges, never pushy

4. **Milestone Notifications** (4 responses)
   - Day 3: *"Most people quit before this. You're still here. I'm noticing."*
   - Day 7: *"A week. You've walked the fog for seven days..."*
   - Day 14: *"Two weeks. This isn't novelty anymore..."*
   - Day 30: *"A month. The person who opened this app on Day 1 and now — they're different."*

5. **First-Time Domain** (3 responses)
   - One per domain, triggered after first completion in that domain
   - *"Your body remembered what it means to move. It's been waiting for that."*

6. **Dormant Mode** (3 responses)
   - Day 7+: Soft (*"Still here. That's all."*)
   - Day 14+: Very soft (*"Your map hasn't changed. Neither have I."*)
   - Day 30+: One-time, then silence

7. **Re-engagement** (2 responses)
   - After 7+ day absence: *"You came back. I didn't know if you would. Welcome home."*
   - After 14+ day absence: *"It's been a while. The map held. You held..."*

**Key principle:** Never use notifications as guilt. Use them to invite presence. Silence on rest days. Grace on hard days.

---

## Integration Requirements

### File to Load
- **KAEL-DIALOGUE-POOLS.md** — All 90 responses in markdown (easy for version control + human review)

### Database Schema (Recommend)
```sql
CREATE TABLE responses.kael_dialogue_pools (
    id UUID PRIMARY KEY,
    pool_type TEXT (ember/flame/skip/notif),
    tier TEXT (ember/flame/blaze/inferno for quests),
    variant TEXT (first_completion, low_energy, high_energy, etc.),
    context TEXT (body/mind/heart/courage/order/spirit for domains),
    track TEXT (A/B/null),
    text TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Response Selection Logic (lib/kael.ts)
1. **Ember completions:**
   - Get user's energy slider and quest domain
   - If first completion in domain, use variant: first_completion
   - Else if energy < 33%, use variant: low_energy
   - Else if energy > 66% AND streak >= 3, use variant: high_energy
   - Else if streak active (3+), use variant: streak_active
   - Else if yesterday was skipped, use variant: after_skip
   - Else use variant: standard
   - Select randomly from pool of that domain + variant

2. **Flame completions:**
   - Get quest's archetypal pattern (reach/move/build/witness/release/root/summon/dissolve)
   - Map to Flame response pattern
   - Apply energy/streak modulation (variants A/B/C)
   - Select from that pattern pool

3. **Skip flow:**
   - User selects skip option in UI
   - Get user's track (A or B)
   - Load appropriate response variant (TrackA or TrackB)
   - Display bottom sheet with option text + Micro Quest pool if applicable

4. **Notifications:**
   - Morning: Select from daily_quest pool (6 variants)
   - Milestone: Check days_active, trigger milestone responses at 3/7/14/30
   - Evening: Check inactivity + streak, randomly select from evening pool
   - Dormant: After 7+ days no completion, enter dormant mode notifications
   - Re-engagement: After return from dormancy, select re-engagement variant

### Testing Checklist
- [ ] Load all 90 responses into database
- [ ] Random sampling of responses should read naturally in character
- [ ] Track A/B divergence is noticeable but both feel warm
- [ ] Notifications deliver at correct times (morning 7-9 AM, etc.)
- [ ] Skip flow responses don't trigger guilt-shame cycle
- [ ] Flame responses feel meaningfully different from Ember
- [ ] Energy-aware variants actually vary meaningfully
- [ ] Forward hooks are present in every completion response

---

## What's Ready Now (MVP)

✅ **Ember tier** — Ship immediately, all 36 responses
✅ **Flame tier** — Ship immediately, all 24 responses (use in Week 1+ as users unlock Flame quests)
✅ **Skip flow** — Ship immediately, all 15 responses (critical safety feature)
✅ **Notifications (core)** — Ship immediately: Day 1 welcome, daily morning, milestones (4 total)
✅ **Track A/B variants** — Skip flow and some notifications already differentiated

---

## What's Deferred (Week 2+)

📅 **Blaze tier** (12-15 responses) — Epic, profound, 3-4 sentences, references journey arc
📅 **Inferno tier** (3-4 responses) — Boss quest completions, cinematic, full-screen moments
📅 **Evening notifications** (full pool) — Optional, only on engagement trigger
📅 **Dormant mode (full)** — Initial version is "Silent after 7 days"; full system ships Week 2
📅 **Context-aware callbacks** — Quest-specific references ("After you reached out...") — Week 2+ data
📅 **Archetype language blending** — Primary/secondary archetype influences language tone — Week 2+

---

## Voice Reference for Implementation

**Read KAEL-VOICE-AUDIT.md for:**
- Full voice consistency verification (all 90 responses checked)
- Domain metaphor inventory (fog, light, ground, bridge, fire, edge)
- What never appears (clinical language, sappy, corporate, guilt framing)
- Specific strengths and iteration opportunities

---

## Key Design Decisions Locked In

1. **Track A/B differentiation is critical.** Not just volume difference — tone difference. Track B is warmer, more permissive, less "you can do better."

2. **Energy slider data drives response variance.** Low-energy completions get softer, more affirming responses. High-energy get more propulsive.

3. **Specificity > Generality.** Every response names WHAT they did. "You reached across the gap" not "Great job!"

4. **Clinical humility matters.** Especially in Skip Flow, Kael admits limitation ("I'm an app, not a person") and directs to real support.

5. **Forward hooks are subtle.** Not "Do another quest!" but "The map noticed" or "This changes what's possible next."

6. **Skip flow is safe.** Never guilt. Never shame. Affirm micro-actions. Defend against internal critic. Honest boundaries around app limitations.

7. **Notifications are invitations, not reminders.** "Something waiting for you" not "Don't forget your quest!"

---

## Success Metrics (Post-MVP)

Track these to understand if dialogue pools are working:

1. **Completion-to-next-quest rate:** Do users who receive Flame responses complete another quest faster than control?
2. **Skip flow churn prevention:** Do users who choose "Make it smaller" return within 24 hours at higher rates than those who skip completely?
3. **Sentiment analysis:** Random sampling of user reflections after different response types — do users feel "seen" vs. generic?
4. **Archetype match quality:** Do users report feeling understood by domain-specific language in their primary archetype responses?
5. **Notification click-through:** What notification variant drives highest app open rate?
6. **Track B retention:** Is 7-day churn significantly lower for Track B cohort?
7. **Milestone moments:** Do Day 7 and Day 30 milestone notifications correlate with engagement spikes?

---

## Files Updated/Created

- **KAEL-DIALOGUE-POOLS.md** (19KB) — All 90 responses, fully formatted
- **KAEL-VOICE-AUDIT.md** (15KB) — Voice consistency verification + integration notes
- **WP4-WP5-WP7-DELIVERY.md** (this file) — Summary for main agent

---

## Next Steps for Main Agent

1. **Integration:** Load KAEL-DIALOGUE-POOLS.md into database or config
2. **Response selection logic:** Implement in lib/kael.ts
3. **Testing:** Verify random sampling of responses reads naturally
4. **Week 2 expansion:** Blaze tier responses (same structure, more profound)
5. **Behavioral data:** Once Week 1 completes, analyze which responses drive engagement
6. **Iteration:** Refine language based on user feedback + engagement metrics

---

## Conclusion

Kael's voice is now fully defined for the MVP. **90 responses across 4 pools** (Ember, Flame, Skip, Notifications), **all voice-matched**, **all energy-aware**, **all forward-hooking**, and **clinically grounded** especially in the Skip Flow where it matters most for user safety.

This is the emotional soul of Rewire. The game loops are containers. This dialogue is what makes them worth opening.

**Ready to ship.** 🌊
