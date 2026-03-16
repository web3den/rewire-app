-- ============================================================
-- Rewire App — Seed Data
-- 15 sample quests across all 6 domains, tiers ember & flame
-- ============================================================

INSERT INTO quests (
  title, domain, tier, source,
  description, instruction, why,
  duration_estimate_min, time_window, completion_type, reflection_prompt,
  reward_fragments, reward_fog_reveal,
  narrative_intro, narrative_completion, narrative_skip
) VALUES

-- ── BODY (ember & flame) ──────────────────────────────────────

(
  'Morning Stretch Ritual',
  'body', 'ember', 'handcrafted',
  'A simple stretch to reconnect with your body first thing.',
  'Spend 5 minutes stretching — focus on areas that feel tight. No routine required, just move.',
  'Morning movement activates the parasympathetic nervous system, reducing cortisol and priming your brain for focus.',
  5, 'morning', 'self_report', NULL,
  10, 0.3,
  'The path ahead is long, Traveler. Let your body remember it knows the way.',
  'Your muscles hum with quiet energy. The fog thins around your feet.',
  'Rest is its own wisdom. The body will be ready when you return.'
),
(
  'Cold Water Challenge',
  'body', 'flame', 'handcrafted',
  'A brief cold exposure to build resilience and presence.',
  'End your shower with 30 seconds of cold water. Focus on your breathing — slow, steady inhales.',
  'Cold exposure triggers norepinephrine release, improving mood and training the prefrontal cortex to override avoidance impulses.',
  3, 'morning', 'self_report', NULL,
  20, 0.5,
  'The forge does not fear the cold. It uses it.',
  'You stood in the current and did not flinch. Vitality pulses through you.',
  'Not every flame needs to be tested today. It will burn just as bright tomorrow.'
),

-- ── MIND (ember & flame) ──────────────────────────────────────

(
  'Single-Task Focus Block',
  'mind', 'ember', 'handcrafted',
  'Train your attention by committing to a single task.',
  'Pick one task. Work on it for 15 minutes without switching tabs, checking your phone, or multitasking.',
  'Sustained attention strengthens the dorsolateral prefrontal cortex and builds resistance to distraction over time.',
  15, 'anytime', 'timed', NULL,
  15, 0.3,
  'Clarity is not the absence of noise — it is choosing which sound to follow.',
  'Fifteen minutes of presence. The lens sharpens.',
  'The mind wanders. That is not failure — it is practice for the next attempt.'
),
(
  'Thought Journaling',
  'mind', 'flame', 'handcrafted',
  'Externalize your thoughts to gain perspective.',
  'Write for 10 minutes about whatever is on your mind. Do not edit, do not censor. Stream of consciousness.',
  'Expressive writing reduces intrusive thoughts and engages the anterior cingulate cortex, improving emotional regulation.',
  10, 'evening', 'reflection',
  'What surfaced that you did not expect? Write one sentence about it.',
  25, 0.5,
  'The lens turns inward. What will you find in the fog of thought?',
  'Words on the page. Thoughts given form. Clarity earned.',
  'Some thoughts prefer silence. They will be there when you are ready.'
),
(
  'Learn Something New',
  'mind', 'ember', 'handcrafted',
  'Feed your curiosity with deliberate learning.',
  'Spend 10 minutes learning about a topic you know nothing about. Read an article, watch a video — follow your curiosity.',
  'Novel information activates the hippocampus and dopaminergic reward pathways, strengthening memory formation and cognitive flexibility.',
  10, 'anytime', 'self_report', NULL,
  10, 0.3,
  'Every unknown is a door. Today you open one.',
  'New connections form. The world grows wider.',
  'Curiosity rests but never dies. It will spark again.'
),

-- ── HEART (ember & flame) ──────────────────────────────────────

(
  'Gratitude Message',
  'heart', 'ember', 'handcrafted',
  'Strengthen a connection with a simple act of gratitude.',
  'Send a message to someone you appreciate. Tell them one specific thing they did that mattered to you.',
  'Expressing gratitude activates the medial prefrontal cortex and releases oxytocin, deepening social bonds and boosting your own well-being.',
  5, 'anytime', 'self_report', NULL,
  10, 0.3,
  'Connection is not found — it is built, one word at a time.',
  'A bridge extended. The fog retreats where warmth exists.',
  'Some words need more time to form. The bridge will wait.'
),
(
  'Deep Listening',
  'heart', 'flame', 'handcrafted',
  'Practice the art of truly hearing another person.',
  'In your next conversation, commit to listening without planning your response. Ask one follow-up question based on what they said.',
  'Active listening engages mirror neurons and the temporoparietal junction, building empathy and strengthening relational trust.',
  15, 'anytime', 'reflection',
  'What did you hear that you might normally have missed?',
  25, 0.5,
  'To hear another is to see them. And to be seen is the deepest gift.',
  'You listened, and in listening, you connected. The bridge holds firm.',
  'Not every moment calls for depth. Surface conversations have their own warmth.'
),

-- ── COURAGE (ember & flame) ────────────────────────────────────

(
  'Speak Up Once',
  'courage', 'ember', 'handcrafted',
  'Practice using your voice in a small but meaningful way.',
  'Share an opinion, idea, or preference you would normally keep to yourself. In a meeting, a chat, or at dinner.',
  'Voluntary self-disclosure activates the ventral striatum reward circuit, gradually reducing the threat response associated with vulnerability.',
  5, 'anytime', 'self_report', NULL,
  10, 0.3,
  'Valor is not the absence of fear. It is one word spoken despite it.',
  'You spoke. The silence did not swallow you. It never does.',
  'Silence has its own courage. Tomorrow the words may come easier.'
),
(
  'Embrace a Small Discomfort',
  'courage', 'flame', 'handcrafted',
  'Deliberately step outside your comfort zone.',
  'Do one thing today that makes you slightly uncomfortable: sit in a different spot, take a new route, start a conversation with a stranger, try an unfamiliar food.',
  'Controlled exposure to novelty and discomfort strengthens stress resilience by recalibrating the amygdala threat threshold.',
  10, 'anytime', 'reflection',
  'What was the discomfort? Did it shift as you moved through it?',
  25, 0.5,
  'The edge of comfort is where growth lives. You do not have to leap — just lean.',
  'You leaned into the unknown and found solid ground. The edge expands.',
  'The edge does not move without you, and it will be here tomorrow.'
),

-- ── ORDER (ember & flame) ──────────────────────────────────────

(
  'Two-Minute Tidy',
  'order', 'ember', 'handcrafted',
  'Create a small pocket of order in your environment.',
  'Set a timer for 2 minutes. Tidy one surface — a desk, a counter, a shelf. Stop when the timer ends.',
  'Environmental order reduces cognitive load. Even small tidying tasks activate the brain''s reward system and improve executive function.',
  2, 'anytime', 'timed', NULL,
  10, 0.3,
  'Foundation begins with a single surface. Order the world, one corner at a time.',
  'A surface cleared. A small anchor in a shifting world.',
  'Disorder is patient. It will still be there when you have the energy.'
),
(
  'Plan Tomorrow Tonight',
  'order', 'flame', 'handcrafted',
  'Reduce morning decision fatigue by planning ahead.',
  'Before bed, write down your top 3 priorities for tomorrow. Note when you will do each one.',
  'Implementation intentions (deciding what/when/where in advance) dramatically increase follow-through by offloading decision-making from the morning brain.',
  5, 'evening', 'self_report', NULL,
  20, 0.5,
  'The anchor holds best when set before the storm.',
  'Tomorrow has a shape now. You will meet it prepared.',
  'Some nights call for rest, not planning. The morning will find its own way.'
),
(
  'Inbox Zero Sprint',
  'order', 'ember', 'handcrafted',
  'Reclaim control of a digital space.',
  'Spend 5 minutes clearing your inbox or notifications. Archive, delete, or respond. No overthinking.',
  'Digital clutter creates open loops that consume working memory. Closing loops frees cognitive resources for deeper work.',
  5, 'anytime', 'timed', NULL,
  10, 0.3,
  'Every unread message is a thread pulling at your attention. Cut a few loose.',
  'The noise quiets. Space made. Foundation strengthened.',
  'The inbox will wait. Sometimes the best order is knowing what to ignore.'
),

-- ── SPIRIT (ember & flame) ─────────────────────────────────────

(
  'Three Breaths',
  'spirit', 'ember', 'handcrafted',
  'A micro-meditation to find stillness in the day.',
  'Stop what you are doing. Take three slow, deep breaths. On each exhale, let your shoulders drop. That is all.',
  'Controlled breathing activates the vagus nerve, shifting the nervous system toward parasympathetic dominance and reducing baseline anxiety.',
  2, 'anytime', 'self_report', NULL,
  10, 0.3,
  'Depth is not found in grand gestures. It begins with a single breath.',
  'Three breaths. A moment reclaimed from the current. The well deepens.',
  'Even choosing not to pause is a form of awareness. The breath will be there.'
),
(
  'Sit With a Question',
  'spirit', 'flame', 'handcrafted',
  'Practice being with uncertainty instead of solving it.',
  'Think of a question you have been trying to answer. For 5 minutes, sit with it. Do not try to solve it — just hold it.',
  'Tolerance for ambiguity strengthens the default mode network and fosters insight. Solutions often emerge from spaciousness, not effort.',
  5, 'evening', 'reflection',
  'Did the question shift or change shape while you sat with it?',
  25, 0.5,
  'Not all questions demand answers. Some ask only to be held.',
  'You sat in the not-knowing and did not run. That is depth. That is courage.',
  'The question keeps. It has waited this long — it can wait a little longer.'
);
