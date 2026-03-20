# Rewire App — Archetype System Design

**Authored by:** The Personality & Archetype Council  
**Date:** 2026-03-15  
**Status:** Design Spec — Ready for Integration with Product Design Spec  

---

## Council Members

| Name | Lens |
|---|---|
| **Dr. James Hollis** | Jungian analyst — archetypal psychology, individuation, shadow |
| **Dr. Tasha Eurich** | Self-awareness researcher — behavioral vs. aspirational identity |
| **Chani Nicholas** | Astrologer/author — emotional resonance, why people love being "typed" |
| **Dr. Todd Kashdan** | Psychological flexibility — against rigid categories, pro starting points |
| **Karen Curry Parker** | Human Design — energy types, decision strategy, alignment |

---

## Council Debates — Key Tensions

### Debate 1: Can 6 Categories Capture a Person?

**Hollis:** "Six archetypes. Let me be honest — this is reductive. Jung identified far more archetypal patterns, and even he cautioned against treating them as personality types. The archetype is a *field of energy*, not a box. That said... the Self needs a mirror to begin individuation. If these six function as mirrors rather than cages, I can work with them."

**Kashdan:** "Thank you. Rigid categories cause real psychological harm — identity foreclosure, confirmation bias, people ignoring parts of themselves that don't fit their 'type.' But the research also shows people need *starting points* for self-reflection. The key is designing for fluidity. The system needs to say 'this is where you START' not 'this is what you ARE.'"

**Chani:** "You're both overthinking this. Do you know why millions of people read their horoscope? Not because they believe Mercury literally affects their email. Because being *named* feels like being *seen*. The moment Kael says 'I know what you are' — that's the hook. It doesn't need to be scientifically perfect on day one. It needs to feel true enough that they lean in. Accuracy follows engagement, not the other way around."

**Eurich:** "And this is exactly where people get conned. The Barnum effect — vague personality descriptions that feel specific. 'You sometimes doubt yourself but have hidden reserves of strength.' Wow, groundbreaking. If we're going to type people, we need to type them on *behavior*, not vibes. What they DO, not what they think they do."

**Karen:** "In Human Design, we don't ask people who they want to be. We look at their energy mechanics — how they actually make decisions, what depletes them, what sustains them. The archetype system should work the same way. It observes *energy patterns*, not personality traits."

**DECISION:** Six archetypes function as lenses, not labels. They are explicitly presented as starting points that evolve. The system NEVER says "you ARE this" — Kael says "this is how you MOVE through the fog." The 2-specialization model (primary + secondary) provides 30 combinations — enough nuance to feel personal without the overhead of a complex typology. And the correction mechanism ensures wrong initial assignments course-correct within 2-3 weeks.

---

### Debate 2: Onboarding — How Do You Type Someone in 2 Minutes Without Getting It Wrong?

**Eurich:** "You can't. Two minutes of self-report data is worse than random assignment. People will answer who they WANT to be, not who they are. A 22-year-old gamer who hasn't left his apartment in weeks will tell you he values courage because he admires courage. The aspiration-reality gap is enormous in this demographic."

**Chani:** "So don't ask them who they are. Create situations. Every good astrology reading works because the astrologer watches your *reaction* to the reading. The information is in the flinch, not the answer. Kael should present scenarios where there's no 'cool' answer — where every option reveals something real."

**Hollis:** "Jung would agree — the projective method. Don't ask 'are you brave?' Present an image, a scene, a dilemma — and watch where the psyche goes. The unconscious reveals itself through choice under ambiguity, not through direct self-report."

**Kashdan:** "The research backs this up. Situational judgment tests outperform self-report for predicting actual behavior. The key is forced-choice scenarios where every option is equally desirable. If one answer is obviously 'the brave one,' everyone picks it. If every answer feels valid, people default to their actual tendencies."

**Karen:** "And make the questions sensory and immediate. Don't ask what they'd do in an abstract scenario — put them IN the scenario. 'You're standing at a fork. You hear water one way, voices another.' Their body responds before their mind edits. That's what you want to capture."

**Eurich:** "Fine. But even with perfect questions, you'll misclassify at LEAST 30-40% of users in onboarding. The system MUST be designed so initial misclassification doesn't ruin anything. The real typing happens through behavioral observation over weeks 1-3."

**DECISION:** Onboarding gives a *preliminary* archetype signal — enough to personalize the first few days but treated internally as low-confidence. Behavioral data from actual quest completion, skip patterns, and reflection content progressively overwrites the initial signal. By Day 10 (archetype reveal), the system has 10 days of behavioral data to blend with onboarding answers. The onboarding questions are designed as immersive narrative scenarios where all options are equally appealing and there is no "cool" answer.

---

### Debate 3: The "2 Specializations" Game Mechanic — Does It Work?

**Kashdan:** "I actually like this. In positive psychology, we talk about 'signature strengths' — most people have 2-3 that define how they engage. Primary + secondary maps cleanly to how humans actually think about their strengths."

**Hollis:** "The primary archetype is the persona — the developed, comfortable self. The secondary is closer to what I'd call the aspirational shadow — the dimension they value but haven't fully developed. The TENSION between primary and secondary is where the real growth lives."

**Chani:** "In astrology we have Sun and Rising — who you are vs. how you present. Primary and secondary creates that same narrative richness. A Flame-Edge (Vitality primary, Valor secondary) is a COMPLETELY different person than an Edge-Flame. Same ingredients, different emphasis. That's 30 unique stories Kael can tell."

**Karen:** "In Human Design, we always look at defined vs. undefined centers. The primary is the user's defined center — where they're consistent. The secondary is where they're drawn but inconsistent — it's their growth edge. The system should lean INTO that gap."

**Eurich:** "My concern: are we accidentally telling someone their 'secondary' dimension is who they should become? Because that's prescriptive and potentially wrong. The secondary should influence quest emphasis, not destiny."

**Hollis:** "The secondary isn't destiny. It's the next question. The primary is 'how you naturally move.' The secondary is 'what's calling to you.' The other four dimensions aren't absent — they're the quiet background. This avoids the enneagram problem where people forget they have all nine types."

**DECISION:** Primary archetype = the dimension that most naturally describes how the user engages with growth. Secondary archetype = the dimension they're most drawn to but haven't fully developed. The other four dimensions remain active and visible in the Essence Compass — archetypes influence *emphasis*, not exclusion. Primary/secondary determines: (1) quest weighting in the recommendation engine, (2) Kael's narrative framing, (3) the specific language of the archetype reveal, (4) which of 30 narrative micro-arcs the user enters.

---

## §1 — The Six Archetypes

Each archetype maps 1:1 to a stat dimension. Grounded in personality science, presented in narrative language.

---

### 1.1 The Flame — Vitality

**Stat Mapping:** Vitality (Body)

**Psychological Grounding:**  
Rooted in embodied cognition research (Damasio's somatic marker hypothesis) and the mind-body connection literature. The Flame represents people whose primary mode of engagement with the world is *physical and sensory*. They think by moving. They process emotion through the body. They feel most alive — and most stuck — in their physical experience.

**Values Dimension:** Aliveness. The felt sense of being in a body, awake and engaged with the physical world.

**Narrative Description (Kael's Voice):**  
*"You burn. Not always visibly — sometimes it's a low heat, banked down under everything else. But your body knows things your mind is still arguing about. When you move, you think. When you're still too long, you fog. Your fire isn't rage — it's life force. It wants to be used."*

**Shadow (What Gets Avoided):**  
Stillness, reflection, emotional processing. The Flame can use physical activity as escape — movement as avoidance of what needs to be felt.

**Quest Emphasis:**  
- Primary: Body quests at higher frequency and tier  
- Growth edge: Spirit and Heart quests (stillness and connection — the Flame's natural discomfort zones)

**Example Quest Differences:**  
- Generic quest: "Take a 20-minute walk"  
- Flame version: "Walk for 20 minutes. No music, no podcast. Just your body and whatever it tells you. It's been trying to say something."  
- Flame Blaze quest: "Do something physical you've never done before. A class, a route, a movement. Your body is bored of the patterns you've given it."

**Who Gets Typed Here:**  
People who gravitate toward Body quests first. People whose reflections mention physical sensations. People who skip Spirit quests consistently. Athletes, gym-goers, but also people whose bodies are *neglected* and who respond strongly when re-engaged physically — the signal is that body-related quests get the strongest response, whether through completion or through resistance.

---

### 1.2 The Lens — Clarity

**Stat Mapping:** Clarity (Mind)

**Psychological Grounding:**  
Rooted in Need for Cognition (Cacioppo & Petty), openness to experience (Big Five), and the intellectualization defense mechanism. The Lens represents people whose primary mode of engagement is *understanding*. They need to make sense of things before they can act. This is both their strength (insight, pattern recognition) and their trap (analysis paralysis, overthinking as avoidance).

**Values Dimension:** Understanding. The drive to make sense of experience, to see clearly, to build mental models.

**Narrative Description (Kael's Voice):**  
*"You see patterns where others see noise. Your mind is a restless thing — always building models, always asking 'why.' That clarity is a gift. But I've watched you use it as a wall. Understanding something isn't the same as changing it. You already know that. You've known it for a while."*

**Shadow:**  
Using understanding as a substitute for action. The insight-rich/action-poor trap. Intellectualizing emotions instead of feeling them. Reading ten books about habits instead of building one.

**Quest Emphasis:**  
- Primary: Mind quests at higher frequency and tier  
- Growth edge: Courage and Body quests (doing before understanding — the Lens's natural discomfort)

**Example Quest Differences:**  
- Generic quest: "Read for 25 minutes"  
- Lens version: "Read for 25 minutes — but not in your usual genre. Pick up something that makes you slightly uncomfortable. What you reach for tells you about where your mind has built fences."  
- Lens Blaze quest: "Teach someone something you know well. Out loud, not in writing. Your mind hoards knowledge — give some away."

**Who Gets Typed Here:**  
People whose reflections are long, analytical, self-aware. People who ask Kael "why" questions. People who complete Mind quests eagerly but skip Body or Courage quests. This is the app's *core* target user — insight-rich, action-poor. The Lens archetype must be honest about this: "You understand the problem. That's not the same as solving it."

> **Eurich's note:** This archetype is going to be over-represented in the user base. The app's target audience IS Lenses. The system needs to avoid making Lens feel like the "default" or "smart" archetype. Every archetype must feel equally specific and equally valued.

---

### 1.3 The Bridge — Connection

**Stat Mapping:** Connection (Heart)

**Psychological Grounding:**  
Rooted in attachment theory (Bowlby, Ainsworth), relational-cultural theory, and the literature on belongingness (Baumeister & Leary). The Bridge represents people whose primary mode of engagement is *relational*. They grow through connection. They understand themselves through others. Their deepest fears and deepest strengths both live in the space between themselves and other people.

**Values Dimension:** Belonging. The need to be known, to be in genuine relationship, to bridge the gap between self and other.

**Narrative Description (Kael's Voice):**  
*"You come alive between people. Not in the small-talk way — in the way where someone sees you, really sees you, and you feel the ground under your feet. But that same need makes you vulnerable. You've learned to protect the bridge by building walls around it. Some of those walls need to come down."*

**Shadow:**  
People-pleasing, codependency, using relationships to avoid self-confrontation. Also: isolation as self-protection — wanting connection deeply but guarding against it.

**Quest Emphasis:**  
- Primary: Heart quests at higher frequency and tier  
- Growth edge: Foundation and Spirit quests (building internal structure instead of relying on external validation)

**Example Quest Differences:**  
- Generic quest: "Tell someone what you appreciate about them"  
- Bridge version: "Tell someone what you appreciate about them — but make it specific. Not 'you're great.' Something they did that only you noticed. Precision is vulnerability."  
- Bridge Blaze quest: "Spend an entire evening alone. No texting, no calls, no social media. Sit with the quiet. Notice what comes up when there's no one to reflect off of."

**Who Gets Typed Here:**  
People who engage most with Heart quests. People whose reflections mention other people frequently. People who skip "solo" quests. People whose Quest skip patterns correlate with social anxiety (skipping courage quests that involve strangers, but completing ones that involve existing relationships).

---

### 1.4 The Edge — Valor

**Stat Mapping:** Valor (Courage)

**Psychological Grounding:**  
Rooted in courage research (Rate, Clarke, et al.), exposure therapy principles (Foa & Kozak), and the psychological concept of "optimal anxiety" (Yerkes-Dodson law). The Edge represents people whose primary mode of engagement is *confrontation with discomfort*. They grow by pushing into resistance. They feel most alive when they're doing something that scares them — and most stuck when life is comfortable and predictable.

**Values Dimension:** Growth through challenge. The drive to meet fear and resistance head-on.

**Narrative Description (Kael's Voice):**  
*"You're not afraid of the edge — you're drawn to it. The place where comfort ends and something unknown begins. That pull has served you. It's also made you reckless. Not every battle needs to be fought today. Sometimes the bravest thing is staying still long enough to feel what you're running from."*

**Shadow:**  
Adrenaline-chasing as avoidance. Mistaking recklessness for courage. Avoiding vulnerability by staying in "challenge mode." Inability to sit with comfort or stillness — needing constant escalation.

**Quest Emphasis:**  
- Primary: Courage quests at higher frequency and tier  
- Growth edge: Heart and Spirit quests (stillness, vulnerability, emotional courage — which is different from action-courage)

**Example Quest Differences:**  
- Generic quest: "Start a conversation with a stranger"  
- Edge version: "Start a conversation with a stranger. But not the easy kind — not someone your age at a bar. Someone different from you. A neighbor. An older person at a bus stop. Courage isn't just about discomfort — it's about where you direct it."  
- Edge Blaze quest: "Tell someone you care about something you've never told them. Not a secret — a feeling. The edge you keep avoiding isn't out there. It's in the space between you and the people who matter."

**Who Gets Typed Here:**  
People who gravitate toward Courage quests AND complete them (not just select them). People whose reflections describe adrenaline, discomfort, pushing limits. But also — critically — people who are *avoiding* courage consistently. The Edge archetype can be assigned as a "growth calling" for users who show high resistance to courage quests but whose other patterns suggest they need them most.

> **Kashdan's note:** Be careful here. The "courage bro" persona is aspirational catnip for the target demographic. Every 25-year-old guy who plays games wants to be The Edge. The onboarding MUST distinguish between "I want to be brave" and "I actually do brave things." This is the single highest-risk archetype for aspirational misclassification.

> **Hollis:** "Precisely. The true Edge personality doesn't *want* to be brave — they can't help it. They're drawn to confrontation instinctively. The persona of courage is the shadow of the Edge — wanting to appear brave while avoiding the real edge, which is usually emotional vulnerability."

---

### 1.5 The Anchor — Foundation

**Stat Mapping:** Foundation (Order)

**Psychological Grounding:**  
Rooted in self-regulation research (Baumeister), environmental psychology (how physical spaces affect cognition), and the "keystone habits" literature (Duhigg). The Anchor represents people whose primary mode of engagement is *building structure*. They grow by creating order, establishing systems, and building the foundations that other growth depends on. They understand intuitively that you can't build a house without a foundation.

**Values Dimension:** Stability. The drive to create order, build systems, and establish reliable ground.

**Narrative Description (Kael's Voice):**  
*"You build. Not castles — foundations. You know that nothing holds without the ground beneath it. While others chase the sky, you make sure the floor is solid. That's rare. It's also a place to hide. Building systems is safe. Living in them — that's where you get tested."*

**Shadow:**  
Perfectionism as paralysis. Using "getting organized" as procrastination. Building elaborate systems to avoid the messier work of emotional or relational growth. Control as a response to anxiety.

**Quest Emphasis:**  
- Primary: Order quests at higher frequency and tier  
- Growth edge: Courage and Heart quests (stepping outside the safe structure)

**Example Quest Differences:**  
- Generic quest: "Clean one space that's been bothering you"  
- Anchor version: "Clean one space — but pay attention to WHY it got messy. Your environment is a mirror. What does this corner of chaos tell you about what you've been avoiding?"  
- Anchor Blaze quest: "Break one of your routines today. Deliberately. Eat at a different time, take a different route, skip your usual ritual. Notice the discomfort. That discomfort is data."

**Who Gets Typed Here:**  
People who complete Order quests most consistently. People whose reflections mention systems, routines, organization, planning. People who show high completion rates but low emotional depth in reflections — the "efficient completer" pattern. Also people whose environment is genuinely chaotic and who respond powerfully when given structure.

---

### 1.6 The Well — Depth

**Stat Mapping:** Depth (Spirit)

**Psychological Grounding:**  
Rooted in meaning-making research (Frankl, Steger), self-transcendence (Maslow's later work), and contemplative psychology. The Well represents people whose primary mode of engagement is *inner depth*. They seek meaning, ask existential questions, and are drawn to reflection and self-understanding. They feel most alive in moments of insight and most stuck when life feels shallow or purposeless.

**Values Dimension:** Meaning. The drive to find purpose, depth, and significance in experience.

**Narrative Description (Kael's Voice):**  
*"You go deep. Deeper than most people are comfortable with. You ask the questions others avoid — not because you're braver, but because the surface was never enough for you. That depth is your compass. It's also your trap. You can drown in your own reflection. At some point, the well has to overflow — depth has to become action."*

**Shadow:**  
Rumination disguised as reflection. Naval-gazing. Using "going deeper" to avoid practical action. Spiritual bypassing — using existential frameworks to avoid dealing with mundane problems (bills, fitness, uncomfortable conversations).

**Quest Emphasis:**  
- Primary: Spirit quests at higher frequency and tier  
- Growth edge: Body and Foundation quests (returning from depth to the embodied, practical world)

**Example Quest Differences:**  
- Generic quest: "Spend 15 minutes in silence"  
- Well version: "You already know silence. Today's silence has a mission: sit for 15 minutes and notice every time your mind tries to make silence 'productive.' The Well's tendency is to turn even stillness into work."  
- Well Blaze quest: "Build something with your hands. Anything physical — cook, clean, repair, create. Your mind is deep but your body is shallow. Give it something to do that has nothing to do with meaning."

**Who Gets Typed Here:**  
People who gravitate toward Spirit quests. People whose reflections are long, introspective, and meaning-oriented. People who ask Kael philosophical questions. People who skip Body and Order quests consistently. This archetype overlaps with Lens but differs: the Lens wants to *understand*; the Well wants to *feel meaning*.

> **Chani:** "This is the archetype where the 'woo' lives. Some users will self-select here because they identify with being 'deep' and 'spiritual.' The onboarding needs to distinguish between people who actually seek depth and people who perform depth. The behavioral data will sort it out, but the initial typing should use scenarios that test actual reflective capacity, not just preference for reflective-sounding answers."

---

## §2 — The 2-Specialization Mechanic

### 2.1 How It Works

Every user has a **Primary** and **Secondary** archetype, determined through onboarding + behavioral observation.

- **Primary** = Your home dimension. Where you naturally live. Your strongest, most developed mode of engagement.
- **Secondary** = Your growth edge. The dimension you're drawn to but haven't fully inhabited. Where you feel the pull but also the resistance.

This creates **30 unique combinations** (6 choose 2, ordered — because Flame/Lens is different from Lens/Flame).

### 2.2 How Primary vs. Secondary Differ

| Aspect | Primary | Secondary |
|---|---|---|
| Quest frequency | ~35% of quests come from this domain | ~25% of quests come from this domain |
| Quest tier | Full tier range available immediately | Tier unlocks slightly delayed (+2 days for each new tier) |
| Kael's framing | "This is your ground" — quests feel like home, even when challenging | "This is your edge" — quests feel aspirational, stretching |
| Stat growth rate | Normal progression | 1.15x multiplier (slightly faster growth to reward investment in growth edge) |
| Narrative role | Defines Kael's metaphor language for the user | Defines the tension/challenge arc of the season |

The remaining 4 dimensions receive ~40% of quests combined (10% each), ensuring balance without overwhelming the user with unfamiliar territory too early.

### 2.3 Example Combination Profiles

**Flame / Edge (Vitality primary, Valor secondary)**  
*"You lead with your body and chase the edge. You're drawn to physical challenge — the harder the better. Your growth isn't in doing more. It's in doing less, and staying present for what rises when you stop."*  
Quest emphasis: Body + Courage. Growth challenge: Heart + Spirit.

**Lens / Well (Clarity primary, Depth secondary)**  
*"You think deep and seek meaning. You've read the books. You know the frameworks. Your mind is a palace. But the door is locked from the inside, and you've been mistaking the blueprints for the building."*  
Quest emphasis: Mind + Spirit. Growth challenge: Body + Courage. (This is the highest-risk profile for the insight-rich/action-poor trap — the system must aggressively push action quests.)

**Anchor / Bridge (Foundation primary, Connection secondary)**  
*"You build the ground and reach for connection. You create order — and then you want someone to share it with. Your growth is in letting the structure be imperfect so other people can actually live in it."*  
Quest emphasis: Order + Heart. Growth challenge: Courage + Spirit.

**Edge / Bridge (Valor primary, Connection secondary)**  
*"You face the hard things and reach for people. You're braver than most — but your bravery has a direction. It always points toward other people. The real edge isn't the stranger conversation. It's telling someone you already know the truth they haven't asked for."*  
Quest emphasis: Courage + Heart. Growth challenge: Foundation + Mind.

### 2.4 Presentation in the Narrative

Kael doesn't say "your primary archetype is The Flame and your secondary is The Edge." Kael says:

*"I've been watching you. The way you move, the quests you reach for, the ones you avoid. You burn — that's what I see first. Your body leads. But underneath the fire, there's something sharper. An edge. You're not just alive — you want to test what alive means. That's rare. And dangerous. Let's see where it takes you."*

The archetype names appear in the "Self" tab as visual identifiers — icons, not labels. The Flame icon with a smaller Edge icon below it. Tapping reveals the full narrative description.

---

## §3 — Onboarding Flow: The Fog Walk

### 3.1 Design Principles

**Eurich:** "Every question must be behavioral or projective — never self-report. 'What would you do?' not 'What are you like?'"

**Chani:** "Every question must feel like Kael is reading you, not testing you. The vibe is divination, not assessment."

**Hollis:** "The images must be archetypal — they should bypass the rational mind and speak to something deeper."

**Kashdan:** "Every option must be equally appealing. No 'cool answer.' No obvious hero choice."

**Karen:** "The questions should feel sensory and immediate — the body should respond before the mind edits."

### 3.2 Timing

The Fog Walk happens during onboarding, AFTER the initial conversation with Kael ("What do you keep meaning to change?" and "The Breath" quest) but BEFORE the first real quest day. It takes approximately 2-3 minutes.

Kael frames it narratively:

*"Before I can guide you, I need to know how you walk. Not what you believe about yourself — those stories are already written. I want to see how you move when the fog is thick and there's no right answer. Ready?"*

### 3.3 The Five Scenarios

Each scenario presents 3 options (not 6 — presenting all 6 would make the system transparent and create decision fatigue). Each option maps to 2 archetypes with different weights. Five scenarios × 3 options × 2 archetype signals = enough data for a preliminary classification.

---

**SCENARIO 1: The Sound in the Fog**

*Kael speaks:*

> "You're walking. The fog is thick. You hear three things at once: the sound of running water somewhere ahead, a voice calling from your left — you can't make out the words — and behind you, the ground shifts. Something just changed where you came from."

*Options (presented as tappable text, not buttons):*

**A) "I move toward the water."**  
→ Vitality +2, Depth +1  
*(Sensory-seeking. Following the body's pull toward something elemental.)*

**B) "I move toward the voice."**  
→ Connection +2, Valor +1  
*(Relational pull. Moving toward another person, even unknown.)*

**C) "I turn back to see what changed."**  
→ Clarity +2, Foundation +1  
*(Need to understand. Need to secure what's behind before moving forward.)*

---

**SCENARIO 2: The Clearing**

*Kael speaks:*

> "The fog breaks. You find a clearing. In it, three things: a fire already burning — warm, steady, inviting. A stone table with something carved into it — you'd need to get close to read it. And a path leading further, steeper, into terrain you can't quite see."

*Options:*

**A) "I sit by the fire."**  
→ Vitality +1, Foundation +2  
*(Drawn to warmth, rest, stability. The body says stay.)*

**B) "I read what's carved in the stone."**  
→ Clarity +1, Depth +2  
*(Drawn to meaning. What was left here? Why?)*

**C) "I take the steeper path."**  
→ Valor +2, Vitality +1  
*(Drawn to challenge. The known isn't interesting enough.)*

---

**SCENARIO 3: The Memory**

*Kael speaks:*

> "A memory surfaces. Not a big one — not a graduation or a heartbreak. A small one. The kind that shouldn't matter but does. What kind of memory is it?"

*Options:*

**A) "A time I was completely alone and it felt right."**  
→ Depth +2, Foundation +1  
*(Comfort with solitude. Internal orientation.)*

**B) "A moment with someone where nothing needed to be said."**  
→ Connection +2, Depth +1  
*(Relational depth. Wordless connection.)*

**C) "A time I did something hard and no one saw."**  
→ Valor +2, Clarity +1  
*(Private courage. Action without audience.)*

---

**SCENARIO 4: The Ruin**

*Kael speaks:*

> "You find something broken in the fog. A structure — maybe it was a tower once, maybe a bridge. It's in pieces. You could try to rebuild it. You could study how it fell. Or you could take a piece of it with you and keep moving."

*Options:*

**A) "I rebuild it."**  
→ Foundation +2, Connection +1  
*(Builder instinct. Create order from chaos.)*

**B) "I study how it fell."**  
→ Clarity +2, Depth +1  
*(Understanding first. What happened here?)*

**C) "I take a piece and keep walking."**  
→ Vitality +1, Valor +2  
*(Forward momentum. Take the lesson, leave the wreckage.)*

---

**SCENARIO 5: The Offer**

*Kael speaks:*

> "I can offer you one thing to carry through the fog. It won't make the journey easier. But it'll change how you experience it. Choose."

*Options:*

**A) "A light. I want to see what's ahead."**  
→ Clarity +2, Valor +1  
*(Vision-seeking. Clarity as power.)*

**B) "A thread. Something that connects me to where I started."**  
→ Connection +2, Foundation +1  
*(Connection as anchor. Relationship to origin.)*

**C) "Nothing. I want to feel it all."**  
→ Vitality +2, Depth +1  
*(Raw experience. Embodied engagement. Refusal of mediation.)*

---

### 3.4 Scoring

After 5 scenarios, each dimension has a score from 0 to ~12 (theoretical max if every answer weighted toward it, but practically 4-8 is typical).

**Classification:**
- Highest-scoring dimension → Preliminary Primary archetype
- Second-highest → Preliminary Secondary archetype
- Ties → broken by which scenario was answered fastest (faster response = more instinctive = higher confidence)

**Confidence level:** LOW. This is a 5-question signal. The system internally tags this as `confidence: 0.3` and treats behavioral data from Days 1-10 as progressively overwriting.

### 3.5 Post-Walk Kael Response

Kael doesn't reveal the archetype yet. Instead, a subtle signal:

> *"Interesting. I can't see all of you yet — the fog is still too thick. But I caught a glimpse. We'll know more soon."*

This serves dual purposes:
1. Creates anticipation (the archetype reveal is a Day 10 payoff)
2. Manages expectations (we're not locking you in based on 5 questions)

### 3.6 Why These Questions Work (Anti-Aspiration Design)

**Eurich's analysis:** "Notice what's absent: no question asks 'are you brave?' or 'do you value connection?' Every question puts you IN the fog and asks what you DO. The options aren't hero/coward — they're water/voice/ground, fire/stone/path. There's no social desirability bias because none of the options is obviously 'better.' The gamer-brain user can't optimize because there's nothing to optimize toward."

**Kashdan's analysis:** "The questions also avoid the Barnum trap. They don't feel like personality quiz questions. They feel like a story. The user isn't thinking 'which answer describes me?' — they're thinking 'what would I actually do?' That distinction is everything."

**Chani's analysis:** "And they feel like divination. Kael isn't asking you to categorize yourself — Kael is watching how you move through a dream. That's astrology-brain. That's the emotional hook that makes people feel *seen* even with imperfect data."

---

## §4 — Archetype Correction Mechanism

### 4.1 The Problem

Initial onboarding classification will be wrong for ~30-40% of users. The system must course-correct without the user feeling misunderstood, re-categorized, or like they "failed" their initial assessment.

### 4.2 Data Sources for Correction

| Signal | Weight | When Available |
|---|---|---|
| Onboarding scenarios (Fog Walk) | 0.3 → decays to 0.1 by Day 14 | Day 1 |
| Quest completion patterns (which domains completed vs. skipped) | 0.4 (grows over time) | Day 2+ |
| Quest skip patterns (which domains consistently avoided) | 0.3 | Day 5+ (needs pattern) |
| Reflection content (LLM-analyzed for thematic affinity) | 0.2 | Day 3+ |
| Kael conversation themes (what the user talks about spontaneously) | 0.15 | Day 5+ |
| Response time to quest offers (faster acceptance = higher affinity) | 0.1 | Day 3+ |
| Time spent on quests (longer engagement = higher affinity) | 0.1 | Day 3+ |

### 4.3 The Algorithm

The system maintains a **running archetype vector** — six floating-point values representing affinity to each dimension. Updated daily.

```
archetype_vector = [vitality, clarity, connection, valor, foundation, depth]

# Day 1: initialized from Fog Walk scores, normalized to 0-1
# Daily update:
for each dimension d:
    behavioral_signal = weighted_sum(
        quest_completion_rate_in_domain[d],
        quest_skip_avoidance_in_domain[d],  # inverse — avoiding = low signal
        reflection_theme_presence[d],
        conversation_theme_presence[d],
        quest_acceptance_speed[d],
        quest_time_investment[d]
    )
    
    archetype_vector[d] = (
        archetype_vector[d] * decay_factor +  # decay_factor starts at 0.8, moves to 0.5 by Day 14
        behavioral_signal * learning_rate      # learning_rate starts at 0.2, moves to 0.5 by Day 14
    )

# Primary = argmax(archetype_vector)
# Secondary = second highest
```

### 4.4 Handling Reclassification

**Before Day 10 (pre-reveal):** Silent correction. The archetype hasn't been named yet, so reclassification is invisible to the user. Quest recommendations shift gradually to match the evolving vector.

**After Day 10 (post-reveal):** Reclassification is rare but possible. It happens in two ways:

**Gradual Shift (Weeks 3-4):**  
If the behavioral vector drifts significantly from the revealed archetype (primary dimension drops to 3rd or lower for 7+ consecutive days), Kael acknowledges it narratively:

> *"Something's shifted. I named you a Flame — and you are. But there's something else emerging. Something I didn't see at first. {New primary dimension} is pulling you. I think your shape is changing. That's not wrong — that's growth."*

The user can accept the shift ("Show me what you see") or resist ("I think you had it right"). If they resist, the system notes the preference but continues adjusting quest recommendations based on behavior, not label. The label is the user's — the algorithm doesn't care about the label.

**Sudden Shift (rare):**  
If a major behavioral change happens (e.g., user starts completing Heart quests after weeks of avoidance), Kael frames it as awakening, not correction:

> *"Something broke open in you. I felt it. The Bridge was always there — you were just standing on the other side."*

### 4.5 Anti-Gaming

**Eurich:** "Some users will try to game toward a desired archetype — completing quests in a specific domain to 'become' The Edge, for example."

**Solution:** The system weights *skip patterns* and *reflection authenticity* as much as completion patterns. You can complete every Courage quest offered, but if your reflections are shallow ("yeah it was fine") and you write deeply about Mind quests, the system recognizes the behavioral delta.

Additionally: the system tracks **resistance-completion** differently from **comfort-completion**. Completing a Courage quest when you're naturally courageous is different from completing one when you're naturally avoidant. The quest recommendation engine already accounts for this (§1.7 in the Product Design Spec) — quests in your weak dimensions have a `resistance_multiplier` that gives more stat growth precisely because they're harder for you.

### 4.6 Seasonal Reset

At the end of each season, the archetype vector is partially soft-reset:

```
new_vector = archetype_vector * 0.7 + initial_baseline * 0.3
```

This allows for genuine change across seasons while preserving core identity. A user who was a Lens in Season 1 might become a Lens/Edge in Season 2 as they develop courage. The system explicitly celebrates this evolution.

---

## §5 — Integration Notes

### 5.1 How Archetypes Feed Into the Product Spec

| Product Spec Element | Archetype Influence |
|---|---|
| Quest generation (§1.7) | Archetype vector weights the quest recommendation pool |
| Kael's voice/register (§5.5) | Archetype informs metaphor choice — Flame gets body metaphors, Lens gets sight metaphors, etc. |
| Weekly narrative beats (§5.4) | 30 micro-arc variants (one per combination) for Monday scene-sets and Sunday rewards |
| Archetype reveal (§5.3 → replaces existing) | Day 10 reveal uses the classification from this system |
| Fog map aesthetics (future) | Archetype tints the revealed fog map — Flame reveals show warmer colors, Well reveals show deeper shadows |
| Season Wrapped | Archetype journey is featured: "You started as a Lens. You became a Lens/Edge. Here's what changed." |

### 5.2 Replacing Existing Spec's Archetype Section

This document **replaces** the archetype section in §2.4 of the Product Design Spec and the Discovery Moments in §5.3. The existing spec's 6 dual-dimension archetypes (Forge, Lens, Bridge, Anchor, Mirror, Spark) are superseded by this system's 6 single-dimension archetypes with the primary/secondary mechanic providing the dual-dimension richness.

### 5.3 Mapping Old → New

| Old (Product Spec §2.4) | New Equivalent (Primary/Secondary) |
|---|---|
| The Forge (Vitality + Valor) | Flame / Edge |
| The Lens (Clarity + Depth) | Lens / Well |
| The Bridge (Connection + Valor) | Bridge / Edge |
| The Anchor (Foundation + Vitality) | Anchor / Flame |
| The Mirror (Depth + Connection) | Well / Bridge |
| The Spark (Clarity + Courage) | Lens / Edge |

The new system is strictly more expressive — 30 combinations vs. 6 fixed pairs — while preserving every combination the old system offered.

---

## §6 — Council Final Remarks

**Hollis:** "This system works because it's designed as a mirror, not a cage. The archetypes are starting points for self-encounter, not destinations. The correction mechanism is critical — it tells the user 'you are not fixed. I'm watching who you become, not who you said you were.' That's individuation in game-mechanic clothing. I can live with that."

**Eurich:** "I'm cautiously satisfied. The behavioral observation pipeline will produce dramatically better typing than the onboarding questions alone, which is the point. My remaining concern: the Day 10 reveal. Even with 10 days of data, confidence is still moderate (~0.6). The reveal language must leave room for evolution — 'this is what I see in you right now' not 'this is who you are.' The narrative team needs to nail that nuance."

**Chani:** "The emotional hook is solid. Five questions in a dream world, a guide who watches how you move, and then a reveal 10 days later that feels like prophecy — that's the arc of a good reading. The 30 combinations give enough specificity that users will feel individually seen, not generically categorized. And the names — Flame, Lens, Bridge, Edge, Anchor, Well — they're archetypes people can *feel*, not think about. That's what makes them sticky."

**Kashdan:** "The fluidity is what saves this from being another MBTI. Categories that correct themselves, that the system treats as probabilistic, that the user can push back on — that's psychological flexibility built into the architecture. My one warning: resist the temptation to make the archetypes too central to identity. They should be a useful lens, not a personality replacement. If users start saying 'I'm a Flame' the way they say 'I'm an INFJ,' we've partially failed. But if they say 'Flame is where I start' — we've succeeded."

**Karen:** "What I appreciate is the energy-type thinking underneath this. The Flame isn't a personality — it's an energy strategy. Body-first engagement, sensory processing, movement as cognition. That's observable, adjustable, and true to how humans actually operate. The secondary archetype as 'growth edge' mirrors the Human Design concept of open/undefined centers — the places we're drawn to learn. The system respects that growth isn't about becoming all six equally. It's about developing YOUR configuration. That's alignment, not optimization."

---

*This document was authored by the Personality & Archetype Council on 2026-03-15. It is designed to integrate with and partially supersede the Product Design Spec's archetype sections (§2.4 and §5.3). All mechanical decisions are implementable; narrative content requires final voice-matching with the narrative design team.*
