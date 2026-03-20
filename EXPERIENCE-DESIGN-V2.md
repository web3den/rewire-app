# Rewire: Experience Design V2 — Council Redesign

## Council
1. **Dr. Sarah Chen** — Clinical psychologist, behavioral activation for depression
2. **Dr. James Rodriguez** — Neuroscientist, dopamine/reward circuits/habit formation
3. **Dr. Mei Lin** — Game designer (Journey, Celeste)
4. **Dr. David Yeager** — Developmental psychologist, "wise interventions"
5. **Dr. Aisha Patel** — Psychiatrist, digital mental health

**Context:** Founder reviewed V1 experience design. Liked overall direction, two-track system, onboarding scenarios. Rejected "The First Stone" text-input quest as too high-friction for day 1. Wants full quest selection/refresh mechanics designed.

---

## TASK 1: Redesign "The First Stone"

### The Debate

**Dr. Chen:** The founder is absolutely right. I was wrong to defend the text field. Self-disclosure on day 1 with a brand-new app is asking for therapeutic-level trust before any trust exists. The clinical insight was sound — honest self-assessment IS behavioral activation — but a text field is the wrong vehicle. We need the same psychological payload in a lower-friction container.

**Dr. Rodriguez:** Think about what made the original concept work neurologically: prediction error. User expects "set your goals!" Gets "tell me something true." We need to preserve that surprise. The new design needs an interaction that *feels* different from every other app they've opened.

**Dr. Mei Lin:** The best game tutorials teach through doing, not through describing. In Journey, your first action is walking toward the mountain. You don't type your feelings about the mountain. You *move*. The first quest should be a *gesture* — something embodied, even on a phone screen.

**Dr. Yeager:** The wise intervention research is clear: brief, one-time exercises work when they shift self-perception. The first quest needs to produce a thought like "this app sees me differently." Tap-based can do that if the choices are designed to feel like self-recognition, not self-reporting.

**Dr. Patel:** For someone in acute depression, even making choices can feel overwhelming if there are too many. Maximum 3-4 options per step. And the whole thing needs to work for someone who is literally lying in bed staring at their phone.

### The Redesign: "First Light"

**Concept:** Instead of typing what's true, the user **places a light** on the fog map through a series of 3 taps that, together, form a honest self-portrait. Each tap is a simple choice. The combination creates something personal without requiring vulnerability through words.

---

**Kael's intro:**
> *"Most apps start here with a goal. 'What do you want to achieve?' As if you haven't already tried that. I want to start somewhere else. I want to know where you actually are — not where you want to be."*

**Step 1: "Right now, you feel more like..."**

Two visual options, side by side. No text labels until tapped.

| Left | Right |
|---|---|
| 🌊 A still, heavy sea | 🔥 A restless, scattered fire |
| *(tapped: "Heavy. Weighed down.")* | *(tapped: "Restless. Can't settle.")* |

A third option at the bottom, smaller:
> *"Honestly? Numb. Neither."* → ❄️ Frost

**Why this works (Chen):** These aren't emotions — they're *textures of experience*. Heavy vs. restless vs. numb maps directly to the clinical depression spectrum (psychomotor retardation vs. agitation vs. anhedonia) without using clinical language. The user is telling us something profoundly useful with one tap.

**Step 2: "And today, your energy is..."**

A single **slider** — no numbers. Left end shows a dim ember icon, right end shows a bright flame. The slider itself is a gradient from dark amber to warm gold.

The user drags to wherever feels right. No labels, no judgment.

Below the slider, Kael says:
> *"There's no right answer. Just drag to where it feels honest."*

**Why (Rodriguez):** This is proprioceptive. The physical act of dragging a slider to "low" is a bodily admission that bypasses the verbal defensiveness of typing "I have no energy." It also gives us a continuous variable (not categorical) for calibration. And it's satisfying — good slider UX has inherent tactile reward.

**Step 3: "One more. If you could clear one patch of fog today, where would you look?"**

Four cards appear, each with an icon and a single phrase. The user taps one.

| Card | Icon | Text | Maps To |
|---|---|---|---|
| 🏔️ | Mountain | "Something in me" | Spirit / Depth |
| 🌿 | Garden | "Something around me" | Order / Foundation |
| 🌉 | Bridge | "Someone in my life" | Heart / Connection |
| ⚡ | Lightning | "Something I've been avoiding" | Courage / Valor |

**Why (Mei Lin):** This is the "choose your first area" mechanic from every great RPG, but the options map to psychological domains instead of character classes. The metaphorical framing ("clear a patch of fog") maintains the game fiction. And it tells us *where they want to start* — which is gold for quest assignment.

---

**The Placement:**

After three taps, Kael says:
> *"That's enough. Look."*

The fog map appears. A light — colored by their Step 1 choice (blue-silver for sea, warm amber for fire, pale white for frost) — descends and places itself at the center of the map. A small circle of fog clears around it. The light pulses gently.

Kael:
> *"That's you. Not a goal. Not a plan. Just... where you are. Everything we do starts from what's real."*

If their energy slider was in the bottom third:
> *"And you placed it honestly. Most people pretend they're further along than they are. You didn't. That matters more than you think."*

If their energy slider was in the top third:
> *"You've got fire today. Let's not waste it. But first — this is your ground truth. We come back to it."*

---

**The "First Light" stone appears on the map.** It's small, glowing, and it has a visual quality (color, pulse rate) that reflects their choices. No text on it. It's abstract but personal.

**Total interaction time:** 30-45 seconds. Three taps and a slider drag. Zero typing.

### Why This Is Better Than V1

| V1 (Text Input) | V2 (First Light) |
|---|---|
| High friction — blank text field | Low friction — 3 taps + 1 slider |
| Requires self-disclosure vocabulary | Uses visual/metaphorical language |
| Fails for alexithymia (can't name feelings) | Works for anyone — choices are textures, not emotions |
| Same prediction error but slower payoff | Same prediction error, faster payoff, more visual |
| Reveals fog but feels like journaling | Reveals fog and feels like *placing yourself in a world* |
| Doesn't help quest calibration | Directly feeds quest assignment (domain, energy, state) |

**Dr. Patel:** One more thing — this design gives us THREE clinical signals (affect quality, energy level, motivation direction) in under a minute without a single clinical question. That's better assessment than most intake forms.

---

## TASK 2: Full Quest Selection Mechanics

### The Debate

**Dr. Mei Lin:** The founder's instinct is spot-on: 1 guaranteed quest + choice slots that unlock + refresh tokens. This is the "daily quest + optional bounty board" pattern from live-service games. The key question is: how do we prevent the refresh mechanic from turning into "reroll until easy quest?"

**Dr. Rodriguez:** The neuroscience of choice is clear — having *some* choice increases intrinsic motivation (Deci & Ryan), but too much choice causes paralysis (Iyengar & Lepper). 3 options per choice slot is the sweet spot. And refresh tokens activate the same variable-ratio reward schedule as slot machines — powerful but potentially exploitative if we're not careful.

**Dr. Chen:** From a clinical perspective, choice is only therapeutic when it's *meaningful* choice. "Pick between three things I might actually do" is motivating. "Pick between three things and also I can reroll infinitely" is shopping. We need scarcity on refreshes.

**Dr. Yeager:** The wise intervention angle: the act of choosing a quest is itself a self-signaling moment. "I chose the courage quest" → "I'm someone who chooses courage." This only works if the choice feels deliberate, not optimized.

**Dr. Mei Lin:** Agreed. Here's my proposed architecture:

### Quest Selection System — Full Design

#### Daily Quest Structure

```
┌─────────────────────────────────────────────┐
│              DAILY QUEST BOARD               │
│                                              │
│  ┌─────────┐                                 │
│  │ ANCHOR  │  ← Always assigned. One per day │
│  │ (1 of 1)│     Cannot be refreshed         │
│  └─────────┘                                 │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ CHOICE  │  │ CHOICE  │  │ CHOICE  │      │
│  │ Opt A   │  │ Opt B   │  │ Opt C   │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│        ↑ Pick 1 of 3. Can refresh (🔄)       │
│                                              │
│  ┌─────────┐                                 │
│  │  EMBER  │  ← Always available quickie     │
│  │ (bonus) │     Never locked, never gated   │
│  └─────────┘                                 │
└─────────────────────────────────────────────┘
```

#### Slot Mechanics

**1. Anchor Quest (Guaranteed)**
- Assigned automatically each morning
- Algorithm: weighted selection based on:
  - Current story act (thematic relevance — 40% weight)
  - Weakest stat dimension that hasn't been touched in 3+ days (30% weight)
  - User's current energy estimate from recent patterns (20% weight)
  - Anti-repetition — no same domain 3 days in a row (10% weight)
- **Cannot be refreshed.** This is the "eat your vegetables" quest. Kael frames it:
  > *"This one isn't a choice. It's what the fog is asking for today."*
- Tier: Scales with user progression. Week 1 = Ember/Flame. Week 3+ = Flame/Blaze.
- Mandatory for weekly cycle credit (5/7 Anchor completions = full week)

**2. Choice Quest (Pick 1 of 3)**
- **Unlock condition:** Complete your first Anchor quest ever (Day 1 or whenever)
- After that, Choice slot appears every day alongside Anchor
- Three options presented as **cards** — each shows:
  - Quest title (evocative, not clinical)
  - Domain icon (subtle — small colored dot, not a label)
  - Tier indicator (Ember glow / Flame glow / Blaze glow)
  - One-sentence teaser (not the full description)
  - Estimated time
- **Selection UI:** Three cards laid out horizontally. Tap to flip and read full description. Tap "Accept" to lock in. Can browse all three before choosing.
- Once accepted, the other two disappear with a soft fade
- **Can be refreshed** (see refresh mechanics below)

**How the 3 options are generated:**
```
Option A: Primary archetype domain, current tier
Option B: Secondary archetype domain OR a domain they haven't touched in 5+ days, current tier
Option C: Wildcard — random domain, tier may be +1 above current (stretch quest)
```
- Never all three from the same domain
- At least one must be a different tier than the others
- Anti-repetition: no quest they've seen in the last 7 days

**3. Ember Slot (Always Available)**
- One quick quest, always present, always Ember tier
- Exists so that even on the worst day, you can complete *something*
- Rotates daily, but doesn't need selection — it's just there
- **Not refreshable** — it's so quick it doesn't need to be optimized
- Always completable in under 5 minutes, often under 2
- This is the "even on your worst day" safety net

**When does the second Choice slot unlock?**
- **Not in Week 1.** The founder mentioned 1-2 Choice slots, so:
  - Week 1: Anchor + 1 Choice + Ember (3 quests, 2 mandatory-feel)
  - Week 2 (after first weekly cycle): Anchor + 2 Choice + Ember (4 quests)
  - Second Choice slot uses same 3-card selection but generates independently
- Track B users: Choice slot is delayed to Week 2. Week 1 is just Anchor + Ember.

#### Refresh Mechanics — The Mini-Economy

**Dr. Rodriguez:** This is where it gets interesting. Refresh tokens are a secondary currency — lighter than Fragments, designed purely for the quest selection loop. Let me lay out the behavioral economics.

**Free Refreshes:**
- Each Choice slot gets **1 free refresh per day**
- The free refresh replaces all 3 options with 3 new ones
- The old options are gone (no "undo" — this creates commitment pressure)
- Visual: a satisfying shuffle animation, cards flip and re-deal

**Refresh Tokens (Earned Currency):**
- After your 1 free refresh, each additional refresh costs **1 Refresh Token** (called "Sparks" in the fiction)
- Sparks are earned, not bought:

| How to Earn Sparks | Amount |
|---|---|
| Complete an Anchor quest | 1 Spark |
| Complete a Choice quest on the first option set (no refresh used) | 1 bonus Spark |
| Complete a full weekly cycle (5/7) | 2 Sparks |
| Complete all 3 quest slots in one day | 1 Spark |
| Streak of 3 consecutive days with Anchor completion | 1 Spark |

**Earning rate:** A moderately engaged user earns 8-12 Sparks per week.

**Spend rate:** If they refresh once extra per day, that's 7/week. So the economy is balanced for ~1 extra refresh per day with a small surplus for occasional heavy-refresh days.

**Spark Cap:** Maximum 20 Sparks stored. This prevents hoarding and creates a "use it or lose it" pressure without being harsh.

**What prevents gaming/optimization?**

This is the critical game theory question. Here's the multi-layered defense:

1. **Hidden rewards until after completion.** You never see Fragment/stat rewards on the quest card. You can't min-max what you can't see. The card shows title, domain icon, tier, time estimate, and teaser text. That's it. You're choosing based on *what sounds meaningful*, not what gives the most points.

2. **No-refresh bonus.** Completing a quest from your *first* set of options (no refresh used) earns a bonus Spark. This creates a gentle incentive to accept what's offered rather than endlessly shopping.

3. **Refresh replaces ALL options.** You can't keep the one you liked and reroll the other two. It's all or nothing. This makes refreshing a real decision with real tradeoffs.

4. **Anti-cherry-picking algorithm.** The system tracks if a user consistently refreshes away from certain domains (e.g., always refreshing until they avoid Courage quests). After 3 consecutive refresh-aways from the same domain, the system ensures that domain appears as one option in the NEXT set regardless of refresh. Kael might say:
   > *"I notice you keep walking past the hard ones. That's fine. But I'm going to keep showing them to you."*

5. **Refresh tokens are slow-earned.** You can't buy them. You can't grind them. They come from doing quests — the very thing you're trying to select. This creates a healthy closed loop.

6. **Wildcard option is always present.** Option C is always a stretch quest from a less-explored domain. Even if you refresh, one option will always push you slightly outside your comfort zone.

**Dr. Chen:** I want to add one more anti-gaming mechanism: **the "all these feel wrong" escape hatch.** If someone refreshes 3 times in a day (1 free + 2 Sparks spent), they get a special option:

> *"None of these? Tell me what you need today."*

Two choices appear:
- **"Something easier"** → Kael offers an Ember-tier quest in their primary domain. Safe, low-friction, but they don't get the full Choice quest rewards.
- **"Something different"** → Kael offers a completely off-algorithm quest — something weird, creative, from outside the normal pool. "Walk outside and find the most interesting-looking cloud." These are hand-crafted "surprise quests" that exist precisely for this moment.

This prevents the frustration spiral of "nothing works for me" while making it clear that heavy refreshing has diminishing returns.

#### Quest Card UI

```
┌──────────────────────────┐
│  ⚡ Ember                │  ← Tier glow along top edge
│                          │
│  "The Silence Walk"      │  ← Title
│                          │
│  Take a walk without     │  ← One-sentence teaser
│  headphones. Notice what │
│  you hear.               │
│                          │
│  ~15 min    🟢 Body      │  ← Time + domain dot
│                          │
│  [ Accept ]              │  ← Tap to commit
└──────────────────────────┘
```

Tapping the card (not the Accept button) flips it to show the full description from Kael. The Accept button only appears on the back of the card — forcing the user to read before committing.

**Refresh button:** Below the 3 cards, a subtle `🔄 Shuffle (1 free)` or `🔄 Shuffle (1 ✦)` button. After free refresh used, it shows the Spark cost. Greyed out if no Sparks available.

---

## TASK 3: Quest Reward Moment

### The Debate

**Dr. Mei Lin:** This is the moment that determines whether someone does a second quest. The completion moment in Journey is a pulse of light and music. In Celeste, it's a screen shake and a berry collect sound. The key: it has to feel *good in the body* — haptic, visual, and auditory feedback hitting simultaneously.

**Dr. Rodriguez:** Neurologically, the reward moment needs to activate the nucleus accumbens (wanting/liking circuit) AND the medial prefrontal cortex (self-referential processing). Translation: the reward should feel good AND should connect to the user's sense of self. A number going up doesn't do that. A character who *sees you* does.

### The Completion Sequence — By Tier

#### Ember Quest Completion (~3 seconds)

1. **Tap "Done" →** Gentle haptic pulse (single tap vibration)
2. **The quest card dissolves** into warm particles that float upward
3. **Fog map: a small circle of fog lifts** (~0.3 tiles) with a soft light bloom effect. Happens immediately, visible in the corner even if they're not on the map screen. A small "fog cleared" indicator pulses once in the nav.
4. **Kael's response appears** (1-2 sentences, always different):

   Pool of Ember completion responses (randomly selected, contextualized by domain):
   - Body: *"Your body remembers this. Even when your mind forgets, your body will remember."*
   - Mind: *"A small thing. But you're awake now. I can tell."*
   - Heart: *"Connection doesn't need to be big to be real."*
   - Courage: *"You moved toward it instead of away. That's everything."*
   - Order: *"One corner of the world, set right. The fog feels it."*
   - Spirit: *"Quiet, but not empty. There's something growing in that silence."*

5. **Stat change: not shown.** For Ember, no visible stat animation. The growth happens silently. This keeps Ember quests feeling like breathing — natural, not transactional. Stats update internally.
6. **A single Fragment count ticks up** in the corner — subtle, satisfying, not the focus.

**Total duration:** ~3 seconds of animation. Quick. Feels like a breath out.

#### Flame Quest Completion (~5 seconds)

1. **Tap "Complete" →** Stronger haptic (double pulse)
2. **Quest card ignites** — edges glow orange, then the card burns away beautifully (like paper burning in reverse, embers assembling then releasing)
3. **Fog map: a visible area clears** (~0.8 tiles). The clear animation is more dramatic — fog parts like curtains. If a landmark is nearby, its silhouette becomes slightly more visible through the remaining fog.
4. **Kael's response** (2-3 sentences, more personal, references the specific quest):
   
   Example (after "The Reach" — messaging someone you haven't talked to):
   > *"You reached across the gap. Most people think about doing that. You actually did it. The fog between people is the hardest kind to clear."*

5. **Stat change: brief glow on Essence Compass.** The radar chart appears briefly (1.5 seconds) in a small overlay, with the relevant dimension pulsing once as it grows. No numbers — just visual shape shift. Then it fades.
6. **Fragment count animates** — more visibly than Ember. The number rises with a warm glow.
7. **If this completes the Anchor for the day:** Extra beat — Kael adds:
   > *"The fog heard that. You're clear for today. The Choice is yours now."*
   (If Choice slot isn't unlocked yet, this is the unlock moment.)

**Total duration:** ~5 seconds. Feels like an accomplishment.

#### Blaze Quest Completion (~8 seconds)

1. **Tap "Complete" →** Deep haptic (three-pulse crescendo)
2. **Screen briefly warms** — subtle orange-gold vignette at edges, 0.5 seconds
3. **Quest card ERUPTS** — dramatic fire animation, particles scatter across the screen, some drift toward the fog map
4. **Fog map: significant clear** (~2 tiles). Full-screen fog map slides up automatically. The user watches their fog burn away. If a landmark reveals, there's a distinct moment — the shape emerging, glowing, naming itself. Landmarks get a unique sound cue.
5. **Kael's response** (3-4 sentences, deeply personal, references their journey):
   
   Example (after "The Reckoning" — a Courage/Blaze quest about confronting an avoidance pattern):
   > *"Do you feel that? That's not comfort — it's the opposite. It's the feeling of having walked into the fire instead of around it. Most people spend their whole lives going around. You just walked through. I won't forget this, and neither will the map."*

6. **Stat change: full Essence Compass animation.** The compass appears center-screen. The relevant dimension(s) grow visibly. The shape shifts. The growth amount is shown for the first time ("+4 Valor"). Hold for 2 seconds.
7. **Fragment cascade** — fragments rain down like sparks, count animates up satisfyingly.
8. **Bonus reveal:** If this Blaze quest is a first-time tier completion, Kael adds:
   > *"This is the first Blaze-level quest you've completed. Remember how this feels. You'll need it."*

**Total duration:** ~8 seconds. Feels like a *moment*. Something worth screenshot-ing.

#### Inferno (Boss) Quest Completion (~15 seconds, cinematic)

1. **Tap "Complete" →** Long haptic crescendo (5-pulse build)
2. **Full screen takeover.** Background shifts to the fog map world. The sky changes. Music shifts to a distinct boss-completion theme.
3. **The boss quest's thematic animation plays.** Each boss quest has a unique completion visual tied to its narrative. (E.g., if the boss quest was about "saying the thing you've never said," the animation might show a sealed door in the fog world blowing open.)
4. **Kael delivers a monologue** (5-8 sentences, the most personal and powerful writing in the app):
   
   Example:
   > *"I've watched you walk through weeks of fog. I've seen you skip days and come back. I've seen you choose the hard path when the easy one was right there. This — what you just did — this is why I waited for you. Not because it was hard. Because it was YOU. The version of you that doesn't look away. The fog isn't afraid of your quests. It's afraid of that."*

5. **Fog map: DRAMATIC clear.** 3-5 tiles lift away simultaneously. A major landmark fully reveals with its own animation and name. The map audibly "breathes" — ambient sound shifts.
6. **Full Essence Compass ceremony.** Compass appears, ALL dimensions that grew are shown with their gains. A new "high-water mark" ring animates if any dimension hit a new milestone.
7. **Season/Act progress:** A story beat triggers. The fog world's narrative advances.
8. **Fragment + Fog Light awards** shown with fanfare.
9. **A unique "memory" is created** — a card that lives in a collection, capturing this moment with the quest title, date, and Kael's words. This is the boss quest's permanent trophy.

**Total duration:** ~15 seconds. This should make someone put their phone down and sit with it for a second.

### What Makes the User Want to Do the Next Quest?

**Four hooks embedded in the completion moment:**

1. **The fog map tease.** After fog clears, the user can see silhouettes and shapes in the remaining fog. "What is that?" is a more powerful motivator than "+10 XP." Every completion reveals more shapes, which generates curiosity for the next reveal.

2. **Kael's forward-looking line.** Every completion response ends with a subtle forward hook:
   - Ember: *"...tomorrow the fog will have something new."*
   - Flame: *"...I'm already thinking about what comes next for you."*
   - Blaze: *"...the fog noticed. It's shifting. Something's about to change."*

3. **The "next quest preview" nudge.** After completion, if they have remaining quests today, a gentle card slides up: "You have 1 quest waiting" — not pushy, not urgent, just present.

4. **Completion count visibility.** On the quest board, completed quests show as warm, glowing completed cards (not greyed out or checked off). They look *beautiful* completed. An incomplete slot looks slightly dimmer. This creates an aesthetic pull toward "filling the board."

---

## TASK 4: "The Loop" — Retention by Phase

### Day 1: Novelty

**What drives return:** "What IS this? This isn't like other apps."

**Mechanisms:**
- The First Light quest is weird and memorable. They'll think about it.
- Kael said something that felt personal. They want to see if it continues.
- The fog map has shapes visible through it. Curiosity.
- End-of-day notification from Kael (if opted in):
  > *"The fog remembers what you did today. I'll be here when you come back."*
  (Not "Don't forget to open the app!" — it's a *character* speaking.)

**Between sessions:** One notification maximum. From Kael, in character. If they completed their quest:
  > *"Something changed on your map while you were away. Small — but I noticed."*
  If they didn't complete:
  > Nothing. Silence. No guilt. Day 1 gets infinite grace.

**What greets them on Day 2:**
- Fog map shows their First Light, gently pulsing
- Kael: *"You came back. That means something — even if you don't know what yet."*
- New Anchor quest revealed through Kael's morning message
- If they completed Day 1's quest: Choice slot is now unlocked. Kael explains:
  > *"You proved you'll show up. Now you get to choose where to go. Three options — pick the one that pulls at you."*

### Day 3: Momentum

**What drives return:** "I have a streak going. The map is growing. I don't want to stop."

**Mechanisms:**
- By Day 3, they have 3-5 fog tiles revealed. The map is starting to look like something.
- Their Essence Compass has visible shape forming (not a uniform circle anymore)
- The weekly cycle is visible: "3/5 Anchor quests completed this week." The 5/7 target creates a manageable, non-perfectionist goal.
- Between-session notification (evening, after 6+ hours of inactivity):
  > *"I've been thinking about what you said yesterday."* [references their last reflection or quest choice]
  This is the "Kael remembers" hook — the moment they realize the AI is tracking their story.

**What greets them on Day 3:**
- Map has grown. They can see the outline of something in the fog — a landmark emerging.
- Kael references something from Day 1 or 2: *"Remember when you chose [X] on your first day? I'm starting to see why."*
- Morning message is shorter, more familiar — Kael's tone has shifted from "new acquaintance" to "someone who knows you a little"

**The Day 3 hook for tomorrow specifically:**
> After completing Day 3's quest, Kael says: *"Tomorrow something new opens up on the map. I've been waiting to show you."*
> Day 4 introduces either a new quest type (first Flame tier) or a new map area. The promise is specific enough to create anticipation.

### Day 7: Identity

**What drives return:** "This is becoming part of who I am."

**Mechanisms:**
- End of first weekly cycle. The "Clearing" review quest (from V1) — look at your map, pick your most meaningful moment. This forces reflection on *who they've become* in a week.
- First landmark fully reveals. It has a name that connects to their journey. This is a PERMANENT mark — their map is unique to them.
- Archetype hypothesis refines. Kael says something like:
  > *"I've been watching you for a week now. I think I know what drives you. But I could be wrong. Let's see what happens next."*
- **The social seed:** At Day 7, a subtle mention that others are out there:
  > *"You're not the only one clearing fog. Others are walking too. You'll never meet them — but their light is out there."*
  (Like the lights in Journey. No interaction. Just awareness of shared effort.)

**Between-session notifications (by Day 7, cadence established):**
- Morning: Kael's quest delivery message (opt-in, daily)
- Evening: Only if they haven't opened the app AND they're on a 4+ day streak. Gentle:
  > *"The fog is quiet today. No rush."*
- No notification if they've already been active that day.

**The Day 7 hook:**
- The Weekly Review quest gives a preview of Week 2: *"Next week, the fog goes deeper. New territory. New questions. You're ready — your map proves it."*
- Week 2 has genuinely new content: new quest types, new Kael dialogue registers, maybe a new map aesthetic in the second ring.

### Day 14: Habit Formation

**What drives return:** "This is just what I do now."

**Mechanisms:**
- By Day 14, the app should feel like a *place*, not a tool. The fog map is their space.
- They've developed a time-of-day habit (morning quest check, evening reflection).
- Kael's voice has evolved — more casual, more familiar, occasionally funny. By Week 2, Kael can make callbacks to Week 1:
  > *"Two weeks ago, you put a light on an empty map. Look at it now."*
- **The depth hook:** Week 2 introduces deeper quests (first Blaze tier opportunities). The resistance multiplier means more stat growth — visible shape change on the Essence Compass.
- **The fog map pull:** By Day 14, they should be able to see the outline of the Season 1 map and realize how much is still hidden. The shapes in the fog become more defined, more tantalizing.

**Notification cadence (established by Day 14):**
- 1 morning notification: Kael's quest message (personalized)
- 0-1 evening notification: Only meaningful, never nagging
- 0 notifications on intentional rest days
- Kael NEVER sends two notifications in a row without the user opening the app

### Day 30: The Identity Lock

**What drives return:** "I'm the kind of person who does this."

**Mechanisms:**
- By Day 30, they're approaching the end of Act 1 (if Season = 6 acts, each ~10 days)
- Archetype reveal happens (if it hasn't already). This is the big narrative moment.
- Their Essence Compass has a distinct, personal shape. No one else's looks quite like theirs.
- The fog map is 30-40% revealed. They can see the overall geography and it's THEIRS.
- **The commitment escalator:** Around Day 28-30, Kael asks a question that's been building:
  > *"You've been walking this fog for a month. I have one question — and I need you to be honest. Is this changing anything? Not the app. Not the quests. You."*
  
  Two options:
  - *"Yes. Something is different."* → Kael: *"I know. I've been watching it happen. Whatever 'it' is — don't let go."*
  - *"I'm not sure."* → Kael: *"Honest. Good. 'Not sure' is better than 'definitely not.' Can I show you something?"* → Shows their stat growth over 30 days, overlaid on the fog map reveal timeline. Visual proof of change they may not have consciously registered.

- **Social comparison (opt-in):** By Day 30, users can see anonymized aggregate stats — "Users who started in the same week as you have revealed an average of X tiles." This creates gentle comparison motivation without direct competition.

### How the Fog Map Creates Curiosity/Pull

The fog map isn't just a progress bar in 2D. It's designed to CREATE wanting:

1. **Silhouettes through fog.** As nearby fog clears, you can see hazy shapes of what's behind the next layer. A mountain? A structure? You can't tell until you clear more. This is the "what's over the next hill" drive that makes open-world games addictive.

2. **Fog depth varies.** Some areas have thin fog (you can almost see through them) and some have dense fog (total mystery). Thin-fog areas near cleared zones create maximum curiosity — you're SO CLOSE to seeing what's there.

3. **Landmarks have names and lore.** When a landmark reveals, it has a name (generated or curated) and a short piece of lore that connects to the user's journey. "The First Shore — where you decided to look outward instead of inward." These are collectible, meaningful, personal.

4. **Map events.** Occasionally, something happens in the fog — a light flickers, a distant sound plays (if audio is on), a shape moves. These are rare (weekly) and create "what was that?" moments that drive return visits.

5. **Hidden areas are marked.** Once you earn Fog Light, you can see small glowing markers in the fog indicating where hidden areas are. You know there's something there, but you need to invest Fog Light to reveal it. Classic "visible lock, invisible key" motivation pattern.

---

## TASK 5: The "I Can't Do This Today" Flow

### The Debate

**Dr. Patel:** This is the most clinically important flow in the entire app. For someone with depression, the gap between "I see my quests" and "I can do them" can be a canyon. If we get this wrong — if the app makes them feel worse for not being able to participate — we've done harm.

**Dr. Chen:** Behavioral activation research says the worst thing we can do is validate avoidance as permanent. But we also can't push. The sweet spot: acknowledge the difficulty, reduce the demand, keep the door open.

**Dr. Mei Lin:** From a game design perspective, "I can't play today" is normal. Good games let you walk away without losing your save file. The key: when you come back, your world is still there, still warm, still yours.

**Dr. Yeager:** The language Kael uses here IS the intervention. This is a wise intervention moment — how the app frames "not doing it" changes what "not doing it" means to the person.

### The "Not Today" UI

**Location:** A small, non-prominent link at the bottom of the quest board. Not a big button — we don't want to make skipping as visually salient as doing. But it's always visible, always accessible. No shame in reaching for it.

Text: `"Not feeling it today"` (not "Skip" — too transactional. Not "I can't" — too helpless.)

**Tapping "Not feeling it today" opens a bottom sheet:**

```
┌─────────────────────────────────────────────┐
│                                              │
│  Kael: "That's okay. Really.                │
│  What do you want to do?"                   │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │  🌿 "Make it smaller"               │     │
│  │  Give me something I can actually do │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │  🛋️ "Just be here"                  │     │
│  │  I want to stay in the app but not  │     │
│  │  do a quest                         │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │  🌙 "Come back later"               │     │
│  │  Keep my quests for later today      │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │  💤 "Rest today"                     │     │
│  │  I'm taking a break                  │     │
│  └─────────────────────────────────────┘     │
│                                              │
└─────────────────────────────────────────────┘
```

### What Each Option Does

#### 🌿 "Make it smaller"

The current quests are replaced with a single **Micro Quest** — the smallest possible meaningful action.

Micro Quest pool (Kael picks contextually):
- *"Open a window or a door for 10 seconds. Feel the air."*
- *"Put your hand on your chest. Take three breaths. Feel them."*
- *"Look at something in the room. Really look at it for 15 seconds."*
- *"Drink something. Water, tea, whatever. Just drink slowly."*
- *"Move one finger, then two, then your whole hand. That's a start."*

These are clinically-grounded behavioral activation micro-steps. Every one is completable while lying in bed. Every one engages the body-mind connection at the minimum possible level.

**Completing a Micro Quest:**
- Counts toward daily activity (the app registered you as "present")
- Earns 0.1 fog tiles (a tiny, barely visible clear)
- Kael responds:
  > *"Small is real. That counted. Don't let anyone tell you it didn't — including yourself."*
- Does NOT count as an Anchor for weekly cycle purposes — but it counts for streak maintenance. (The 5/7 weekly cycle still requires Anchor completions, but "showing up" maintains their habit-tracking streak even if the Anchor specifically wasn't done.)

**Dr. Chen:** This is the clinical sweet spot. We've reduced the demand to near-zero but maintained the behavior of *engaging with the app.* The act of choosing "make it smaller" and completing a micro quest IS behavioral activation. They chose to do something instead of nothing. That's the muscle we're building.

#### 🛋️ "Just be here"

The quest board disappears. The screen transitions to a gentle, ambient fog map view. Soft ambient sound (if audio enabled). Kael says:

> *"No quests. No progress. Just you and the map. Stay as long as you like."*

The user can:
- Browse their fog map. Zoom in on landmarks. Re-read lore.
- Open a "memory" view — cards from past quest completions they can revisit.
- Just... sit. The ambient animation is designed to be calming, like watching a campfire or rain.
- Talk to Kael (free, non-quest conversation). This triggers the casual conversation energy cost UNLESS Kael detects emotional distress, in which case it's free.

**This option generates no stats, no fog clear, no rewards.** It's purely a "the app is a safe space to be" moment. But it counts as an app open for internal analytics, and Kael remembers:
> Next time they open the app, Kael says: *"You sat with me yesterday. That takes its own kind of courage."*

#### 🌙 "Come back later"

Quests are preserved. A 4-hour gentle timer starts (invisible to user). If they re-open within that window, their same quests are waiting — Kael greets them:
> *"Hey. You made it back. No rush — your quests are right where you left them."*

If they don't return that day, the quests roll over to tomorrow's Anchor (the same one, given a second chance). Choice quests expire normally at midnight.

This option exists for the "I'm overwhelmed right now but might feel better tonight" user. It preserves momentum without forcing it.

#### 💤 "Rest today"

Full skip. No quests today. The day is released.

Kael:
> *"Gone. No quests today. The fog will hold — it's not going anywhere. Neither am I."*

**What happens mechanically:**
- Weekly cycle counter: this day counts as a "grace day" (users get 2/7 built in)
- Fog: no decay on explicit rest days (different from just disappearing — the app knows you chose to rest)
- Streak: maintains for 1 day. Two consecutive Rest days break the streak (gently, no punishment notification)
- Stats: no decay triggered for this day

**If they Rest 3 days in a row:**
On the 4th day, instead of the normal quest board, Kael opens with:
> *"It's been a few days. I want to check in — not about quests. About you. How are you doing?"*

Two options:
- *"I'm okay. Just needed a break."* → Kael: *"Good. Breaks are real. I'll have something for you when you're ready."* → Quest board returns.
- *"Not great."* → Kael: *"Thanks for being honest. Can I ask — is this a rough patch, or does it feel like more than that?"*
  - *"Rough patch."* → Track stays the same. Kael offers a gentle Micro Quest. *"Start here. Just this."*
  - *"More than that."* → Kael pivots to support resources, offers Track B if they're on Track A. *"I'm an app, not a person. But I can point you toward people who get this."* → Crisis resources shown.

### Track A vs Track B Differences

**Track A (Growing — functional/stuck users):**

- "Not feeling it today" is a small, tasteful link
- Kael's tone is understanding but gently encouraging: *"That's okay. But I know you've got more than you think."*
- Micro Quests are still genuinely easy but slightly more active (walk to the window, not just breathe)
- 3 consecutive Rest days triggers the check-in
- The "come back later" option is prominent — encouragement to try again today

**Track B (Steady — struggling/acute users):**

- "Not feeling it today" is more visible — slightly larger, no judgment in placement
- Kael's tone is warmer, softer: *"That's okay. Full stop. No 'but.'"*
- Micro Quests are at absolute minimum (can all be done lying down, eyes closed if needed)
- 5 consecutive Rest days triggers the check-in (more grace)
- The "Just be here" option is most prominent — the app as a safe space, not a task manager
- If Track B user hasn't engaged in 7 days, ONE notification:
  > *"I'm still here. No quests, no plans. Just here if you need me."*
  Then silence until they return.

### Preventing "Always Skip" From Becoming the Habit

**The progressive nudge system (invisible to user):**

1. **Days 1-2 of skipping:** Full grace. No change in Kael's behavior.
2. **Day 3:** Kael's morning message subtly shifts: *"I've got something light for you today. Smaller than yesterday's."* (Automatically reduces quest difficulty for that day.)
3. **Day 5:** Kael names the pattern without judging: *"We've been quiet for a few days. That's okay — but I want to make sure quiet is what you need, not what the fog is telling you you deserve."*
4. **Day 7:** The check-in flow triggers (described above).
5. **Day 10+:** Kael reduces to minimal presence. One morning message every 3 days. No quest delivery — instead, a simple: *"I'm here when you want me."*
6. **Day 14+:** The app enters "dormant mode" — a single weekly notification. Kael: *"Still here. That's all."*
7. **Day 30+:** Monthly notification. If no response, notifications stop entirely. The user can always come back — the map, the progress, everything is preserved. But the app doesn't chase them.

**The re-engagement moment (when they finally return):**

Kael doesn't say "Welcome back!" with fake enthusiasm. Instead:
> *"You're here. I didn't know if you'd come back. I'm glad you did."*

Then:
> *"Your map held. Nothing was lost. Where do you want to start?"*

Two options:
- *"Where I left off"* → Resume with the same quest structure, calibrated to current energy.
- *"From the beginning"* → Soft reset. Not a data wipe — but Kael re-introduces the quest system as if it's fresh. New Anchor quest, new Choice options. Same map, same stats, but a clean start to the routine.

**Dr. Patel's final note:** The entire "I can't" flow should feel like talking to a wise friend who has depression literacy. Not a therapist. Not a coach. A friend who gets it and doesn't make you feel broken for having a hard day. Kael's voice in these moments is the most important writing in the entire app.

---

## Summary of Changes from V1

| Element | V1 | V2 |
|---|---|---|
| First Quest | Text input ("truest thing") | 3 taps + slider ("First Light") |
| First Quest friction | Medium-high | Very low |
| Quest selection | 3 slots assigned daily | Anchor (assigned) + Choice (pick 1 of 3) + Ember (always there) |
| Choice mechanic | None | 3 cards, flip to read, tap to accept |
| Refresh mechanic | None | 1 free/day + Sparks currency for more |
| Anti-gaming | Hidden rewards only | Hidden rewards + no-refresh bonus + all-or-nothing refresh + domain persistence |
| Reward moment | Generic description | Tier-specific sequences with escalating drama |
| Skip flow | "Not today" button + Kael line | Full 4-option bottom sheet with micro quests and safe space |
| Retention hooks | Fog map curiosity only | Kael callbacks + fog silhouettes + map events + identity escalation + weekly review |
| Track B skip grace | 3 days to check-in | 5 days to check-in, warmer language, "just be here" prominent |

---

## Implementation Priority

1. **First Light quest** — ship this in MVP. It's the front door.
2. **Anchor + Choice + Ember structure** — core loop, ship in MVP.
3. **Completion sequences** — Ember and Flame tiers for MVP. Blaze and Inferno can wait for Week 2+ content.
4. **Refresh/Spark economy** — ship with Choice slot. Critical for engagement.
5. **"Not feeling it" flow** — ship in MVP. This is a safety feature, not a nice-to-have.
6. **Retention notifications** — ship Kael's morning message and one evening variant. The full cadence system can iterate.
7. **Fog map silhouettes/events** — can be Week 2+ polish. Basic fog clear is enough for MVP.
8. **Re-engagement flow** — build after Day 14 data exists. Dormant mode can be manual initially.
