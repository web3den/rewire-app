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
-- ============================================================
-- Rewire App — Seed Data Batch 2
-- 60 quests: 10 per domain, mix of ember & flame tiers
-- Append after seed.sql
-- ============================================================

INSERT INTO quests (
  title, domain, tier, source,
  description, instruction, why,
  duration_estimate_min, time_window, completion_type, reflection_prompt,
  reward_fragments, reward_fog_reveal,
  narrative_intro, narrative_completion, narrative_skip
) VALUES

-- ══════════════════════════════════════════════════════════════
-- ── BODY (10 quests) ─────────────────────────────────────────
-- ══════════════════════════════════════════════════════════════

(
  'Cook Something Real',
  'body', 'flame', 'handcrafted',
  'You''ve been eating like someone who doesn''t live here. Today, you cook.',
  'Cook a meal from scratch — at least 3 ingredients, combined with heat. No microwave-only meals. Eat it at a table, not over the sink.',
  'Cooking engages procedural memory, executive planning, and sensory integration simultaneously. The act of feeding yourself with intention rebuilds self-care neural pathways that atrophy during depressive or avoidant periods.',
  30, 'anytime', 'self_report',
  'What did you make? Did the act of cooking shift your energy at all?',
  25, 0.5,
  'There is an old truth the fog cannot touch: the one who feeds themselves is never truly lost.',
  'You made something with your hands and ate it with intention. The body remembers how to be cared for.',
  'The kitchen will be there tomorrow. Sometimes rest is its own nourishment.'
),
(
  'Walk Without Input',
  'body', 'ember', 'handcrafted',
  'No podcast. No music. No phone call. Just you and the ground.',
  'Walk for 10 minutes without headphones or looking at your phone. Notice what you see, hear, and feel. That''s the whole quest.',
  'Walking without audio input activates the default mode network, which is essential for self-reflection and creative problem-solving. Sensory engagement with your environment also reduces rumination.',
  10, 'anytime', 'self_report',
  'What did you notice that you usually miss?',
  10, 0.3,
  'The fog remembers those who move. It parts for them, slowly, like it knows their name.',
  'Ten minutes on the earth without a screen between you and the sky. The path thanks you.',
  'The path is patient. It does not judge those who rest.'
),
(
  'Reset Your Sleep Launchpad',
  'body', 'flame', 'handcrafted',
  'Your bed should be a place of rest, not a doom-scrolling station. Tonight, we fix that.',
  'One hour before bed: phone leaves the bedroom. Set it to charge in another room. Read, stretch, or just exist — but the screen stays gone until morning.',
  'Phone-in-bedroom is the #1 predictor of poor sleep quality in adults under 35. Removing it forces the brain to downshift, allowing melatonin production and reducing blue-light-induced cortisol spikes.',
  60, 'evening', 'self_report',
  'How was falling asleep without the phone nearby? What did you do instead?',
  25, 0.5,
  'You''ve been giving the last hour of your day to a glowing rectangle. Tonight, you take it back.',
  'A night reclaimed. The body knows how to sleep — it just needed you to stop interfering.',
  'Old habits have deep roots. Tomorrow is another chance to plant new ones.'
),
(
  'The 20-Minute Walk',
  'body', 'flame', 'handcrafted',
  'Not a workout. Not a hike. Just a walk long enough for your thoughts to settle.',
  'Walk for 20 minutes at a comfortable pace. You can go anywhere — around the block, a park, a parking lot. The point is sustained, easy movement.',
  'Twenty minutes of walking triggers BDNF (brain-derived neurotrophic factor) release, which strengthens neural connections and improves mood regulation. It also breaks the sitting-scrolling cycle that characterizes avoidant loops.',
  20, 'anytime', 'timed',
  NULL,
  20, 0.5,
  'Twenty minutes. Not to get somewhere. Just to move. The body has been waiting for this.',
  'You walked, and something shifted. The fog cannot keep up with someone who moves.',
  'The road does not disappear. It will be here when your legs are ready.'
),
(
  'Make Your Bed',
  'body', 'ember', 'handcrafted',
  'Small. Unglamorous. Effective. Make the damn bed.',
  'As soon as you get up, make your bed. Smooth the sheets, arrange the pillows. Takes 2 minutes.',
  'Making your bed creates a "keystone habit" — a small win that cascades into greater self-regulation. It also removes a visual cue of disorder that the brain processes as low-level stress.',
  2, 'morning', 'self_report',
  NULL,
  10, 0.3,
  'The smallest act of order is still an act. Begin here.',
  'One surface, claimed. One corner of chaos, tamed. This is how it starts.',
  'The bed will be unmade again tomorrow anyway. But so will the choice to make it.'
),
(
  'Hydration Check',
  'body', 'ember', 'handcrafted',
  'When did you last drink water? Not coffee. Not soda. Water.',
  'Drink a full glass of water right now. Then fill the glass again and keep it near you for the next hour.',
  'Even mild dehydration (1-2%) impairs cognitive performance, mood, and energy. Many people in avoidant cycles mistake dehydration symptoms for fatigue or depression.',
  2, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'Your body is mostly water, Traveler. When did you last honor that?',
  'A glass of water. Not dramatic. Not heroic. Just... necessary. Well done.',
  'Even skipping water is information. Notice what you reach for instead.'
),
(
  'Gym Gravity',
  'body', 'flame', 'handcrafted',
  'You don''t have to have a great workout. You have to show up and touch a weight.',
  'Go to the gym. That''s the quest. Once you''re there, do at least one exercise — even just one set. Permission to leave after that.',
  'The hardest part of exercise adherence is initiation, not intensity. The "just show up" approach leverages behavioral activation — once the environment changes, momentum follows. Reducing the commitment threshold eliminates the all-or-nothing thinking that prevents action.',
  30, 'anytime', 'self_report',
  'Did you stay longer than planned? What was the resistance like before vs. after arriving?',
  25, 0.5,
  'You don''t need a perfect session. You need to walk through the door. Gravity does the rest.',
  'You went. That was the hard part. Everything after the door was momentum.',
  'The iron will wait. It has infinite patience for those who return.'
),
(
  'Clean One Dish Immediately',
  'body', 'ember', 'handcrafted',
  'The sink is a mirror. What does yours say about your current state?',
  'After your next meal, wash at least one dish immediately — before sitting down, before checking your phone. Just one.',
  'Immediate action after eating interrupts the post-meal avoidance pattern (eat → guilt → ignore mess → increased guilt). Breaking this micro-cycle trains the brain to act before the avoidance impulse consolidates.',
  3, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'One dish. Not the whole sink. Just prove to yourself that you can act before the fog settles in.',
  'One dish, clean. A small rebellion against the pull of inertia.',
  'The dishes aren''t going anywhere. Neither is your ability to choose.'
),
(
  'Sunlight in the First Hour',
  'body', 'ember', 'handcrafted',
  'Your circadian rhythm has been begging for this.',
  'Within the first hour of waking, get outside for at least 5 minutes of natural sunlight. No sunglasses. Face the sky.',
  'Morning sunlight exposure sets the circadian clock via melanopsin receptors in the retina, improving sleep quality 14-16 hours later. It also suppresses melatonin and triggers cortisol rise — the healthy kind that creates alertness.',
  5, 'morning', 'self_report',
  NULL,
  10, 0.3,
  'The sun has been rising without you. Today, meet it.',
  'Light on your face. The oldest medicine there is. Your body clock resets.',
  'The sun will rise again tomorrow. It always does.'
),
(
  'Tension Scan',
  'body', 'ember', 'handcrafted',
  'Where are you holding it? Jaw? Shoulders? Stomach? Find out.',
  'Close your eyes for 2 minutes. Scan from head to feet. Where do you feel tightness? Consciously relax each area you find. Unclench the jaw. Drop the shoulders.',
  'Body scanning activates interoceptive awareness through the insula cortex, a key area for emotional regulation. Chronic stress creates unconscious muscle tension that perpetuates the stress response in a feedback loop.',
  2, 'anytime', 'self_report',
  'Where was the tension? Were you surprised by any of it?',
  10, 0.3,
  'The body keeps score even when the mind looks away. Let''s check the ledger.',
  'Found it. Named it. Released it. The body exhales.',
  'The tension will announce itself when it''s ready. No rush.'
),

-- ══════════════════════════════════════════════════════════════
-- ── MIND (10 quests) ─────────────────────────────────────────
-- ══════════════════════════════════════════════════════════════

(
  'Read for 20 Minutes',
  'mind', 'flame', 'handcrafted',
  'Not a tweet thread. Not a Reddit post. An actual sustained piece of writing.',
  'Read a book, a long-form article, or an essay for 20 uninterrupted minutes. Physical pages preferred. If digital, turn off notifications first.',
  'Sustained reading rebuilds linear attention capacity that fragmented media consumption erodes. It engages the left temporal cortex and strengthens the brain''s ability to hold complex, sequential information.',
  20, 'anytime', 'timed',
  'What did you read? Did your attention wander, and if so, when?',
  20, 0.5,
  'There was a time when you could lose yourself in a book for hours. That capacity isn''t gone — it''s buried. Let''s excavate.',
  'Twenty minutes of sustained attention. The lens sharpens.',
  'The book holds your place. Return when the mind is willing.'
),
(
  'Write 300 Words About Anything',
  'mind', 'flame', 'handcrafted',
  'It doesn''t have to be good. It has to exist.',
  'Open a blank document or grab paper. Write 300 words about literally anything — a memory, an opinion, a rant, fiction, instructions for making toast. Quality is irrelevant. Volume is the point.',
  'Generative writing activates Broca''s area and the prefrontal cortex simultaneously, building the neural bridge between thought and expression. Lowering the quality bar removes perfectionism paralysis, the #1 block to creative output.',
  15, 'anytime', 'self_report',
  'What did you write about? Was starting or continuing harder?',
  20, 0.5,
  'The blank page is not your enemy. It is the most honest mirror you will ever find.',
  '300 words exist that didn''t before you sat down. That is creation. That is clarity.',
  'The words will come when they''re ready. Sometimes silence is its own kind of writing.'
),
(
  'The Phone Lockout',
  'mind', 'ember', 'handcrafted',
  'You know exactly what you do when you pick up the phone "just to check." Today, we interrupt the loop.',
  'Put your phone in another room for 30 minutes. Not on silent — physically away. Do whatever you want in those 30 minutes, but without the phone.',
  'Physical separation from the phone eliminates the micro-decision fatigue of resisting checking. It breaks the cue-routine-reward loop of compulsive phone checking, allowing the prefrontal cortex to engage with deeper tasks.',
  30, 'anytime', 'timed',
  'What did you do with those 30 minutes? What was the pull like?',
  15, 0.3,
  'You know what you reach for when the silence gets uncomfortable. Today, we take it away and see what''s underneath.',
  'Thirty minutes without the tether. You survived. More than survived — you were free.',
  'The phone is powerful. So are you. The contest continues.'
),
(
  'Learn One Concept Deeply',
  'mind', 'flame', 'handcrafted',
  'Not a Wikipedia skim. Pick one thing and actually understand it.',
  'Choose a concept you''ve heard of but don''t really understand. Spend 20 minutes learning it well enough to explain it to someone else. Write a 2-3 sentence explanation when you''re done.',
  'Deep encoding (the "teaching effect") activates the hippocampus and creates durable long-term memories. Surface scanning creates recognition without understanding, which provides the illusion of learning without the cognitive benefit.',
  20, 'anytime', 'reflection',
  'What concept did you choose? Write your explanation here.',
  20, 0.5,
  'Every unknown is a door. But skimming the surface is just pressing your face against the glass. Today, you open it.',
  'A concept understood, not just recognized. Knowledge forged, not collected.',
  'Understanding takes time. The concept will be there when curiosity returns.'
),
(
  'Build Something Small',
  'mind', 'flame', 'handcrafted',
  'Not consuming. Creating. Even something tiny.',
  'Spend 20 minutes making something — a sketch, a piece of code, a song, a plan, a model, a recipe, a poem, an outline. The medium doesn''t matter. The act of creation does.',
  'Creative production activates the dorsolateral prefrontal cortex and the default mode network in alternation — a pattern unique to generative thought. This strengthens cognitive flexibility and counters the passive consumption patterns of avoidance.',
  20, 'anytime', 'self_report',
  'What did you create? How did it feel to produce instead of consume?',
  25, 0.5,
  'The world has been pouring into you — content, noise, opinion. Time to pour something back out.',
  'You made something that didn''t exist before. That is not small. That is the opposite of fog.',
  'Creation rests. The spark will ignite when conditions are right.'
),
(
  'Name Your Avoidance',
  'mind', 'ember', 'handcrafted',
  'You know the thing you''ve been avoiding. Write it down. Just write it down.',
  'Write down the ONE thing you''ve been avoiding most this week. Not the plan to fix it — just name it. Be specific.',
  'Naming an avoidance pattern engages the ventrolateral prefrontal cortex, which helps regulate the amygdala''s threat response. The act of labeling ("affect labeling") reduces the emotional charge of the avoided thing by up to 50%.',
  5, 'anytime', 'reflection',
  'What is the thing? How long have you been avoiding it?',
  10, 0.3,
  'There is something you have been circling. I can see its shadow in the fog. Today, you do not have to fix it. Just name it.',
  'You named it. The shadow has a shape now. Shapeable things can be faced.',
  'Some things aren''t ready to be named yet. That''s different from hiding.'
),
(
  'Five-Minute Focus Sprint',
  'mind', 'ember', 'handcrafted',
  'Five minutes. One thing. Total attention. That''s it.',
  'Pick any task you''ve been putting off. Set a timer for 5 minutes and work on it with complete focus. When the timer ends, you can stop. You probably won''t.',
  'The "5-minute start" technique exploits the Zeigarnik effect — once started, the brain resists leaving tasks incomplete. Lowering the commitment threshold bypasses the activation energy barrier that keeps avoidant people stuck.',
  5, 'anytime', 'timed',
  NULL,
  10, 0.3,
  'Five minutes is nothing. Five minutes is everything. It is the distance between inertia and motion.',
  'You started. That was the real quest. Everything after the timer was gravity.',
  'The five minutes will still be there. So will the task. No judgement.'
),
(
  'Digital Detox Hour',
  'mind', 'flame', 'handcrafted',
  'One hour. No screens. See what happens to your brain.',
  'Spend one hour without any screens — no phone, no computer, no TV. Read, walk, cook, clean, sit, stare at the wall. Anything that doesn''t glow.',
  'Extended screen breaks allow the prefrontal cortex to recover from continuous partial attention — the state of low-grade alertness that screens maintain. Recovery enables deeper thinking, emotional processing, and creative insight.',
  60, 'anytime', 'self_report',
  'What did you do? What was the hardest moment? When did it get easier?',
  25, 0.5,
  'Your eyes have been drinking light from rectangles all day. Give them — and the mind behind them — an hour of something real.',
  'One hour without the glow. You met yourself in the gap. The lens clears.',
  'Screens are persistent. Your intention to step back doesn''t expire.'
),
(
  'Capture an Idea',
  'mind', 'ember', 'handcrafted',
  'You have ideas all the time. You just let them evaporate. Catch one.',
  'Write down one idea you had today — a project, an observation, a question, a what-if. Just capture it somewhere. Notes app, napkin, margin of a book.',
  'Externalizing ideas trains the brain to value its own creative output. Over time, this creates a positive reinforcement loop: the brain generates more ideas when it learns they''ll be captured rather than dismissed.',
  2, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'An idea crossed your mind today. You almost let it go. Don''t.',
  'Caught. Saved. One idea, preserved from the stream. The mind learns to trust itself.',
  'Ideas are like dreams — they fade fast. But there will always be more.'
),
(
  'Rewrite a Belief',
  'mind', 'flame', 'handcrafted',
  'You carry stories about yourself that you''ve never questioned. Today, question one.',
  'Write down one negative belief you hold about yourself ("I''m lazy," "I can''t focus," "I always quit"). Then write the most honest counter-evidence you can find — even one example that disproves it.',
  'Cognitive restructuring — the core technique of CBT — works by creating competing neural pathways. Each time you consciously challenge a belief with evidence, you weaken the automatic negative thought pattern and strengthen the alternative.',
  10, 'evening', 'reflection',
  'What was the belief? What was your counter-evidence?',
  25, 0.5,
  'There is a story you tell about yourself. You''ve told it so many times it feels like truth. Let''s look at it together.',
  'One story, examined. One crack in the wall. That''s how the light gets in.',
  'The stories aren''t going anywhere. You''ll question them when you''re ready.'
),

-- ══════════════════════════════════════════════════════════════
-- ── HEART (10 quests) ────────────────────────────────────────
-- ══════════════════════════════════════════════════════════════

(
  'Text Someone First',
  'heart', 'ember', 'handcrafted',
  'Not a reply. An initiation. You reach out because you want to, not because you were prompted.',
  'Text or message someone you haven''t talked to in a while. It doesn''t have to be deep — "Hey, been thinking about you" is enough.',
  'Social initiation activates the ventral striatum reward circuit and counteracts the isolation-reinforcement cycle. The brain learns that reaching out leads to connection, not rejection, gradually lowering the barrier.',
  5, 'anytime', 'self_report',
  'Who did you reach out to? How did it feel to initiate?',
  10, 0.3,
  'There is someone who would be glad to hear from you. The fog thickens when we wait for others to bridge the gap.',
  'A message sent. A thread pulled. The web of connection holds because someone chose to weave it. Today, that was you.',
  'Connection has no deadline. The people who matter will still be there.'
),
(
  'Say the Real Thing',
  'heart', 'flame', 'handcrafted',
  'You know the thing you almost said but swallowed? That one.',
  'In a conversation today, say something honest that you would normally filter out. A real opinion, a genuine feeling, an authentic reaction. Not cruel — just real.',
  'Authentic self-expression activates the medial prefrontal cortex and reduces the cognitive load of self-monitoring. Chronic filtering creates emotional suppression, which correlates with increased anxiety and decreased relationship satisfaction.',
  5, 'anytime', 'self_report',
  'What did you say? What would you normally have said instead?',
  20, 0.5,
  'You''ve been editing yourself. Every filtered word is a small betrayal of the person underneath. Today, let one through.',
  'One real thing, spoken aloud. The air didn''t shatter. It rarely does.',
  'Authenticity is not an obligation. Sometimes the filter serves you. Know the difference.'
),
(
  'Sit With a Feeling',
  'heart', 'flame', 'handcrafted',
  'Not fix it. Not explain it. Not scroll past it. Sit with it.',
  'When you notice an uncomfortable emotion today — sadness, anger, anxiety, loneliness — pause. Set a timer for 5 minutes. Feel it without trying to change it. Name it if you can.',
  'Distress tolerance is a learnable skill. Sitting with uncomfortable emotions without escape behaviors (scrolling, eating, drinking) trains the anterior cingulate cortex and reduces emotional reactivity over time.',
  5, 'anytime', 'reflection',
  'What was the emotion? What happened to it when you stopped running?',
  25, 0.5,
  'There is a feeling you''ve been outrunning. It is tired of chasing you. Let it land.',
  'You stayed. The feeling came, and crested, and began to pass — because that is what feelings do when you stop fighting them.',
  'Sometimes the escape is necessary. Not every day is the day to face it.'
),
(
  'Ask How Someone Is (And Actually Listen)',
  'heart', 'ember', 'handcrafted',
  'Not the reflexive "how are you / good" volley. A real question with real attention.',
  'Ask someone how they''re doing, and when they answer, ask a follow-up. Listen to the second answer more carefully than the first.',
  'Genuine social engagement activates mirror neurons and the mentalizing network (TPJ and mPFC), strengthening empathy and social cognition — skills that atrophy during periods of isolation.',
  10, 'anytime', 'self_report',
  'What did you learn about them that you didn''t know before?',
  10, 0.3,
  'The people around you carry worlds you have never visited. Today, knock on one door.',
  'You asked, and then you listened. That second question — that was the real gift.',
  'Connection doesn''t demand perfect timing. The door will open when it''s ready.'
),
(
  'Forgive Something Small',
  'heart', 'flame', 'handcrafted',
  'Not the big wound. Something small you''ve been carrying that doesn''t deserve the weight.',
  'Think of a minor resentment — someone who annoyed you, a small betrayal, an unreturned text. Consciously decide to release it. Say it out loud if it helps: "I''m letting this go."',
  'Holding resentment activates the stress response and consumes working memory. Intentional forgiveness of small grievances trains the prefrontal cortex to release and redirect, building the neural capacity for larger acts of letting go.',
  5, 'anytime', 'reflection',
  'What did you release? Was it harder or easier than expected?',
  20, 0.5,
  'You are carrying things that weigh nothing but cost everything. Put one down.',
  'Something released. The hands are lighter now. That weight was never yours to carry.',
  'Forgiveness is not a single act. It is a practice. There is no rush.'
),
(
  'Write an Unsent Letter',
  'heart', 'flame', 'handcrafted',
  'Some things need to be said even if no one else reads them.',
  'Write a letter to someone — living or not — saying what you''ve never said. You don''t have to send it. The writing is the point.',
  'Expressive writing about relational emotions engages the ventromedial prefrontal cortex and reduces emotional suppression. "Unsent letter" techniques are used in grief therapy, trauma processing, and relational repair.',
  15, 'evening', 'reflection',
  'Who was the letter for? What did it feel like to write what you''ve been holding?',
  25, 0.5,
  'There are words inside you that were meant for someone. They don''t need a mailbox. They just need to exist.',
  'Written. Not sent. Not needed to be sent. The heart lightens when its truths are given form.',
  'Those words will wait. They have been waiting this long.'
),
(
  'Accept a Compliment',
  'heart', 'ember', 'handcrafted',
  'Don''t deflect. Don''t minimize. Just receive it.',
  'The next time someone compliments you or says something kind, respond with "Thank you." That''s it. No "oh it was nothing," no self-deprecation. Just receive it.',
  'Deflecting compliments is a subtle form of self-rejection that reinforces low self-worth schemas. Practicing acceptance rewires the brain''s response to positive social input, strengthening self-compassion circuits.',
  2, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'You are skilled at making yourself smaller. Today, practice taking up exactly the space you deserve.',
  'You let it land. A kind word, received. Not deflected. Not shrunk. Accepted.',
  'Receiving is harder than giving for some of us. No timeline on learning it.'
),
(
  'Tell Someone What They Mean to You',
  'heart', 'flame', 'handcrafted',
  'Not a generic "love you." The specific thing. Why them. Why it matters.',
  'Tell someone — in person, by phone, or in a message — one specific thing about them that you value. Not a compliment about appearance. Something about who they are.',
  'Specific, meaningful affirmation activates both the speaker''s and receiver''s reward circuits. It deepens relational bonds through what researchers call "perceived partner responsiveness" — the sense of being truly known.',
  10, 'anytime', 'self_report',
  'What did you tell them? How did they respond?',
  25, 0.5,
  'The people we love often have no idea which parts of them changed us. Tell one of them.',
  'Something true, delivered. A bridge reinforced. Connection isn''t automatic — it''s maintained by moments like this.',
  'Vulnerability requires readiness. The words will sharpen when the time is right.'
),
(
  'Hug Someone',
  'heart', 'ember', 'handcrafted',
  'Physical connection. The oldest language.',
  'Hug someone today — a friend, a family member, a partner. Hold it for at least 5 seconds (most hugs are shorter than you think).',
  'Hugs longer than 5 seconds trigger significant oxytocin release, reducing cortisol and blood pressure. Physical affection is one of the fastest ways to activate the parasympathetic nervous system and counter isolation.',
  2, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'When did you last hold someone long enough for the armor to soften? Today, find out.',
  'Held, and held. The body knows connection before the mind can name it.',
  'Touch is a gift given freely. It will find its moment.'
),
(
  'Check In With Yourself',
  'heart', 'ember', 'handcrafted',
  'You ask everyone else how they''re doing. When''s the last time you asked yourself?',
  'Pause right now. Ask yourself: "How am I actually doing?" Answer honestly — out loud or in writing. Not "fine." The real answer.',
  'Self-inquiry activates the medial prefrontal cortex and insula, building interoceptive and emotional awareness. Most avoidant patterns begin with a failure to register one''s own emotional state accurately.',
  5, 'anytime', 'reflection',
  'How are you actually doing right now? What surprised you about the answer?',
  10, 0.3,
  'You have been so busy surviving that you forgot to check if you''re okay. Let''s pause.',
  'An honest answer. Maybe not comfortable, but true. That is the beginning of everything.',
  'Sometimes "I don''t know" is the most honest answer. That counts too.'
),

-- ══════════════════════════════════════════════════════════════
-- ── COURAGE (10 quests) ──────────────────────────────────────
-- ══════════════════════════════════════════════════════════════

(
  'Compliment a Stranger',
  'courage', 'ember', 'handcrafted',
  'A small act of social bravery with zero stakes.',
  'Compliment a stranger today — a barista, someone in line, a coworker you don''t usually talk to. Keep it simple and genuine.',
  'Low-stakes social approach behavior retrains the amygdala''s threat calibration. Each positive micro-interaction provides evidence that social engagement is safe, gradually reducing social avoidance.',
  2, 'anytime', 'self_report',
  'Who did you compliment? What was their reaction?',
  10, 0.3,
  'A stranger is just a person you haven''t spoken to yet. One sentence. That''s all the valor this requires.',
  'You spoke to a stranger and the world didn''t end. File that under evidence.',
  'Not every day calls for bravery with strangers. The world is patient.'
),
(
  'Say No to Something',
  'courage', 'ember', 'handcrafted',
  'You''ve been saying yes to things that drain you. Today, one honest no.',
  'When someone asks you to do something you don''t want to do, say no. No elaborate excuse needed. "I can''t" or "not this time" is complete.',
  'Boundary-setting activates the dorsolateral prefrontal cortex and strengthens self-advocacy pathways. People-pleasers have an overactive anterior cingulate cortex (conflict detector) — practicing "no" recalibrates this response.',
  2, 'anytime', 'self_report',
  'What did you say no to? How did it feel afterward?',
  15, 0.3,
  'Every yes you don''t mean is a no to yourself. Today, reverse one of those.',
  'One boundary, drawn. The ground holds firmer where you plant your feet.',
  'Sometimes the timing isn''t right. The boundary will be needed again soon.'
),
(
  'Start a Conversation',
  'courage', 'flame', 'handcrafted',
  'Not a text. An actual, in-person conversation with someone you don''t normally talk to.',
  'Start a conversation with an acquaintance, coworker, or someone you see regularly but never talk to. Ask them a question about themselves. Stay for at least 2 minutes.',
  'Initiating social contact fires the ventral striatum (reward) in opposition to the amygdala (threat), and each successful interaction shifts the balance. This is graded exposure — the gold standard treatment for social avoidance.',
  10, 'anytime', 'self_report',
  'Who did you talk to? What did you learn about them?',
  25, 0.5,
  'The people you pass every day are carrying stories you''ve never heard. Today, you ask for one.',
  'A conversation, initiated by you. A wall, slightly lower. This is how worlds connect.',
  'Social courage builds slowly. The conversation will be there when you''re ready for it.'
),
(
  'Do the Thing You''ve Been Avoiding',
  'courage', 'flame', 'handcrafted',
  'You know what it is. I know you know. Today, we do it.',
  'That task, call, email, errand, or conversation you''ve been putting off — do it today. If it takes more than 30 minutes, do just the first step. But do something.',
  'Avoidance creates a negative reinforcement loop: avoiding the thing reduces anxiety momentarily, which trains the brain to avoid more. Breaking the loop with even partial action reverses this conditioning.',
  30, 'anytime', 'self_report',
  'What was the thing? How long had you been avoiding it? How do you feel now?',
  25, 0.5,
  'You''ve been avoiding this. Today, we do it anyway. Not because it''s easy. Because the weight of carrying it is heavier than doing it.',
  'Done. Or started. Either way, the thing that lived in your head now lives in the world, and it is smaller than you imagined.',
  'The avoided thing remains. But choosing not to face it today is different from pretending it doesn''t exist.'
),
(
  'Ask for Help',
  'courage', 'flame', 'handcrafted',
  'Independence is a virtue until it becomes a prison. Today, let someone in.',
  'Ask someone for help with something — a task, advice, emotional support. Be specific about what you need. No hints, no "it''s fine." A direct ask.',
  'Requesting help activates vulnerability circuits and challenges the self-reliance schema that often masks avoidance of intimacy. It also strengthens social bonds — research shows being asked for help increases the helper''s positive feelings toward the asker.',
  5, 'anytime', 'self_report',
  'What did you ask for? Who did you ask? What was the hardest part?',
  25, 0.5,
  'You have been carrying things alone because asking feels like failing. It is not. It is the bravest thing a person can do.',
  'You asked. Someone answered. The weight is shared now. That is not weakness — it is wisdom.',
  'Asking is hard. If today isn''t the day, the need won''t disappear. It''ll be here.'
),
(
  'Eat Alone in Public',
  'courage', 'flame', 'handcrafted',
  'Not at your desk. Not in your car. In a restaurant. Alone. On purpose.',
  'Go to a cafe or restaurant, sit down, order food, and eat alone. No phone as a shield — you can bring a book, but try to just be present for at least part of the meal.',
  'Eating alone in public triggers social evaluation anxiety — the fear of being judged as "lonely." Deliberately choosing it reframes the experience from shameful to autonomous, building comfort with solitude and reducing dependence on social validation.',
  30, 'anytime', 'self_report',
  'Where did you go? What was the internal experience like? Did it shift as the meal went on?',
  25, 0.5,
  'There is a difference between being alone and being lonely. Today, you sit with the difference.',
  'A meal, taken in public, alone, by choice. That is not loneliness. That is sovereignty.',
  'Public solitude is an advanced skill. There will be other chances to practice it.'
),
(
  'Share Something Vulnerable',
  'courage', 'flame', 'handcrafted',
  'Not a confession. Not a breakdown. Just... one true thing you usually keep hidden.',
  'Share something personal with someone you trust — a struggle, a fear, an insecurity, a dream you''re embarrassed about. Something you normally keep behind the wall.',
  'Vulnerability disclosure activates the ventromedial prefrontal cortex and deepens relational trust. Brené Brown''s research shows that vulnerability is perceived as courage by others, not weakness — the opposite of what the avoidant brain predicts.',
  10, 'anytime', 'reflection',
  'What did you share? How did the other person respond? Did the sky fall?',
  25, 0.5,
  'Behind the wall you''ve built, there is something true. Today, show one brick of it to someone safe.',
  'You were seen. Not the curated version — a real piece of you. And the world held.',
  'Vulnerability has its own timeline. Forcing it before trust is built helps no one.'
),
(
  'Go Somewhere Alone',
  'courage', 'flame', 'handcrafted',
  'A movie. A museum. A concert. A bookstore. Alone. Not because no one was available — because you chose it.',
  'Go to a public place you enjoy — alone, on purpose. Stay for at least 30 minutes. Notice what it feels like to be in public without a social buffer.',
  'Solo outings challenge the avoidance pattern of staying home "because no one wants to go." They build what psychologists call "autonomous motivation" — doing things for intrinsic satisfaction rather than social scaffolding.',
  45, 'anytime', 'self_report',
  'Where did you go? What was the experience like without someone else to filter it through?',
  25, 0.5,
  'You''ve been waiting for someone to come with you. The place doesn''t require a companion. It requires your presence.',
  'You went. Alone. And discovered that the experience belonged entirely to you. There is power in that.',
  'Solo outings can wait for a day when the energy is there. The world isn''t going anywhere.'
),
(
  'Make a Phone Call Instead of Texting',
  'courage', 'ember', 'handcrafted',
  'Texts are comfortable. Calls are human. Today, call.',
  'Instead of texting someone, call them. Even if it''s brief. Even if it feels weird. Let them hear your voice.',
  'Voice calls transmit paralinguistic cues (tone, rhythm, warmth) that text strips away. Phone avoidance is a growing behavioral pattern linked to social anxiety. Each call slightly recalibrates the perceived threat of real-time conversation.',
  5, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'The voice carries what text cannot. Today, use the older technology.',
  'A voice call. Real-time connection. No editing, no curating — just you. Well done.',
  'The phone will ring another day. Or it won''t, and that''s okay too.'
),
(
  'Hold Eye Contact',
  'courage', 'ember', 'handcrafted',
  'Not a staring contest. Just... don''t look away first for once.',
  'In your next face-to-face conversation, practice holding eye contact while the other person is speaking. Not aggressively — just present. When you feel the urge to look away, stay one beat longer.',
  'Eye contact activates the social brain network (fusiform face area, superior temporal sulcus) and signals engagement and safety to the other person. Avoidant eye contact patterns are one of the earliest signs of social withdrawal.',
  5, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'The eyes reveal. They also connect. Today, let them do both.',
  'You held the gaze. Not a performance — a presence. That is quiet valor.',
  'Eye contact is a muscle. It strengthens with repetition, not force.'
),

-- ══════════════════════════════════════════════════════════════
-- ── ORDER (10 quests) ────────────────────────────────────────
-- ══════════════════════════════════════════════════════════════

(
  'Clean One Room',
  'order', 'flame', 'handcrafted',
  'Not the whole house. One room. Floor to ceiling. Make it a place you want to be.',
  'Pick the room that bothers you most. Spend 30 minutes cleaning it — pick up, wipe down, vacuum or sweep. Set a timer. Stop when it rings.',
  'Environmental order reduces the brain''s ambient stress processing. A clean room eliminates dozens of micro-stressors (visual clutter) that silently consume cognitive bandwidth and elevate baseline cortisol.',
  30, 'anytime', 'timed',
  'Which room did you choose? How does it feel to be in it now?',
  25, 0.5,
  'Your space is a reflection. Today, you change what the mirror shows.',
  'One room, transformed. The air is lighter here now. Foundation, strengthened.',
  'Disorder is patient. It does not mock you for resting. The room will wait.'
),
(
  'Unsubscribe From 10 Things',
  'order', 'ember', 'handcrafted',
  'Your inbox is full of ghosts — newsletters you signed up for and never read.',
  'Open your email and unsubscribe from 10 things you never read. Marketing emails, old newsletters, notifications from services you forgot existed.',
  'Each unread email is an "open loop" that consumes micro-attention. Closing these loops reduces what researchers call "attention residue" — the cognitive tax of unresolved tasks and inputs.',
  10, 'anytime', 'timed',
  NULL,
  10, 0.3,
  'Every subscription you ignore is a small tax on your attention. Time to stop paying it.',
  'Ten fewer demands on your inbox. Ten loops, closed. The signal-to-noise ratio improves.',
  'Digital clutter accumulates slowly. There''s no wrong day to start clearing it.'
),
(
  'Meal Prep One Thing',
  'order', 'flame', 'handcrafted',
  'Future-you is going to be hungry and tired. Present-you can do something about that.',
  'Prepare one component of a future meal — chop vegetables, cook rice, marinate protein, assemble overnight oats. Something that makes tomorrow''s eating easier.',
  'Meal prep is an implementation intention — a pre-decision that removes the need for willpower at the point of hunger. When tired and hungry, the brain defaults to the easiest option. Prep makes the healthy option the easiest one.',
  20, 'anytime', 'self_report',
  'What did you prepare? How does it feel to have future-you covered?',
  20, 0.5,
  'The version of you who comes home exhausted tomorrow — you can help them right now.',
  'Food, prepared. A gift from present-you to future-you. This is what order looks like in practice.',
  'Meal prep will wait. In the meantime, be gentle with whatever you end up eating.'
),
(
  'Process Your Inbox to Zero',
  'order', 'flame', 'handcrafted',
  'Not just glancing. Processing. Every email gets a decision: act, archive, or delete.',
  'Go through your entire inbox. Every message gets one action: reply (if under 2 minutes), archive, delete, or move to a task list. No leaving things "unread but I''ll get to it."',
  'The Zeigarnik effect means unfinished tasks occupy working memory. Each unprocessed email is an open loop draining cognitive resources. Inbox zero is not about perfection — it''s about closing loops.',
  30, 'anytime', 'timed',
  'How many emails were there? How many were actually important?',
  25, 0.5,
  'Every unread message is a thread pulling at the back of your mind. Today, we cut them all loose.',
  'Inbox at zero. Every thread, addressed. The mind exhales when the loops close.',
  'The inbox refills. That is its nature. But the practice of processing does not expire.'
),
(
  'Do One Admin Task',
  'order', 'ember', 'handcrafted',
  'That thing you''ve been meaning to do for weeks. The appointment. The form. The bill. Today.',
  'Do one administrative task you''ve been avoiding — schedule a doctor appointment, pay a bill, file a form, update your address, cancel a subscription. One task. Done.',
  'Administrative avoidance compounds — each undone task increases the perceived mountain of "things I should do," which increases avoidance. Completing even one task breaks the cycle and provides evidence that the mountain is smaller than imagined.',
  10, 'anytime', 'self_report',
  'What did you handle? How long did it actually take vs. how long you thought it would?',
  15, 0.3,
  'There is a task sitting on your shoulders pretending to be a boulder. It is probably a pebble. Pick it up and see.',
  'One task, handled. That thing that weighed a hundred pounds? It took ten minutes. Remember that.',
  'Administrative tasks are persistent but not urgent. They''ll wait for a day with more bandwidth.'
),
(
  'Sort One Drawer or Shelf',
  'order', 'ember', 'handcrafted',
  'Every junk drawer is a physical manifestation of deferred decisions.',
  'Pick one drawer, shelf, or cabinet. Take everything out. Put back only what belongs. Trash or relocate the rest.',
  'Physical sorting engages the same executive function circuits (categorization, decision-making, spatial organization) that are undertrained during avoidant periods. Small environmental wins build momentum for larger organizational tasks.',
  10, 'anytime', 'self_report',
  NULL,
  10, 0.3,
  'One drawer. That is all. A small archaeology of your own neglected spaces.',
  'Sorted. The drawer makes sense now. A small corner of the world, brought to order.',
  'The drawer has been that way for a while. A few more days won''t hurt.'
),
(
  'Check Your Bank Balance',
  'order', 'ember', 'handcrafted',
  'Financial avoidance is one of the loudest forms of the fog. Today, you look.',
  'Open your bank account and look at your balance. That''s the quest. Don''t fix anything yet — just know the number. Write it down if you want.',
  'Financial avoidance is driven by the same amygdala-based threat response as other avoidance behaviors. Simply looking at the number (exposure therapy) reduces the emotional charge and is the first step toward financial self-regulation.',
  5, 'anytime', 'self_report',
  'How did it feel to look? Was the number better or worse than you expected?',
  15, 0.3,
  'You''ve been afraid of a number. Today, you look at it. Not to fix it. Just to know it.',
  'You looked. The number is just a number. Now you can decide what to do with it instead of hiding from it.',
  'Financial awareness will come at its own pace. The number isn''t going anywhere.'
),
(
  'Set Out Tomorrow''s Clothes',
  'order', 'ember', 'handcrafted',
  'Reduce tomorrow''s first decision to zero.',
  'Before bed, choose and lay out what you''ll wear tomorrow. Including shoes. Decision, made.',
  'Decision fatigue is strongest in the morning when willpower is still ramping up. Eliminating the clothing decision saves cognitive energy for higher-value choices and reduces the probability of staying in pajamas all day.',
  5, 'evening', 'self_report',
  NULL,
  10, 0.3,
  'Every morning is a gauntlet of small decisions. Remove one tonight, and tomorrow starts lighter.',
  'Tomorrow''s first decision is already made. You will step into the day without hesitation.',
  'Some nights demand nothing but collapse. That''s human. The clothes will sort themselves out.'
),
(
  'Delete 20 Photos',
  'order', 'ember', 'handcrafted',
  'Your camera roll is a museum of screenshots you''ll never look at again.',
  'Open your camera roll and delete 20 photos — duplicates, blurry shots, screenshots of things you already handled. Quick decisions. No agonizing.',
  'Digital decluttering practices the same rapid decision-making that physical decluttering does. The "delete or keep" binary trains the prefrontal cortex to make fast, low-stakes judgments without overthinking.',
  5, 'anytime', 'timed',
  NULL,
  10, 0.3,
  'Twenty photos you will never look at again. Free them. Free the space.',
  'Twenty photos, released. Lighter. The digital weight is real even if you can''t hold it.',
  'The photos aren''t hurting anything. But the practice of letting go is worth coming back to.'
),
(
  'Write a To-Do List (Max 5 Items)',
  'order', 'ember', 'handcrafted',
  'Not a brain dump of every possible thing. Five items. That''s the constraint.',
  'Write down the 5 most important things you need to do this week. Not 10. Not 20. Five. Prioritize ruthlessly.',
  'Constraining a to-do list to 5 items forces prioritization, which engages the dorsolateral prefrontal cortex. Unconstrained lists create overwhelm and decision paralysis. The limitation IS the feature.',
  5, 'anytime', 'self_report',
  'What made the cut? What did you leave off, and does that tell you anything?',
  10, 0.3,
  'The fog loves an infinite to-do list. It feeds on overwhelm. Today, you starve it with constraint.',
  'Five items. Not everything — the right things. Order begins with knowing what matters most.',
  'The list can wait. But if you''re avoiding it, that itself is data.'
),

-- ══════════════════════════════════════════════════════════════
-- ── SPIRIT (10 quests) ───────────────────────────────────────
-- ══════════════════════════════════════════════════════════════

(
  'Five Minutes of Silence',
  'spirit', 'ember', 'handcrafted',
  'No music. No podcast. No phone. Just you and the quiet.',
  'Sit somewhere comfortable. Set a timer for 5 minutes. Close your eyes or look at something neutral. No input. No output. Just be.',
  'Silence activates the default mode network, which is essential for self-reflection, memory consolidation, and creative insight. In a world of constant input, silence is not absence — it is a neurological reset.',
  5, 'anytime', 'self_report',
  'What happened in the silence? Was it comfortable or uncomfortable?',
  10, 0.3,
  'When was the last time you sat in silence? Not waiting for something. Not between things. Just... silence.',
  'Five minutes of nothing. But nothing is not empty — it is spacious. The well deepens.',
  'Silence isn''t going anywhere. It is the one thing always available to you.'
),
(
  'Write to Your Future Self',
  'spirit', 'flame', 'handcrafted',
  'Five years from now, you will be someone. Who? What do you want to tell them?',
  'Write a short letter to yourself 5 years from now. What do you hope they''ve done? What do you want them to remember about this moment? Be honest, not aspirational.',
  'Future self-continuity — the ability to feel connected to your future self — is one of the strongest predictors of long-term planning, savings behavior, and health choices. Writing to your future self strengthens this neural bridge.',
  15, 'evening', 'reflection',
  'What did you write? What surprised you about what mattered most?',
  25, 0.5,
  'Somewhere ahead of you, a version of you is looking back at this moment. What do you want them to know?',
  'A letter, written across time. Future-you will read it differently than you wrote it. That is the point.',
  'The future self will understand the silence too. Not every moment needs a letter.'
),
(
  'Memento Mori',
  'spirit', 'flame', 'handcrafted',
  'Not morbid. Real. You have a finite number of days. What are you doing with them?',
  'Spend 5 minutes contemplating the fact that your time is limited. Not with anxiety — with clarity. Ask yourself: "If I had one year left, would I spend today the way I spent it?"',
  'Mortality salience, when approached without panic, activates what Terror Management Theory calls "growth-oriented" responses — increased authenticity, meaning-seeking, and reduced attachment to trivial concerns.',
  5, 'evening', 'reflection',
  'What would change if time were shorter? What would stay exactly the same?',
  25, 0.5,
  'This is not a dark question. It is the most clarifying question a person can ask. The fog cannot survive it.',
  'You looked at the edge and did not flinch. Everything you do from here is chosen, not defaulted.',
  'Mortality is patient. It does not demand your attention on any particular day.'
),
(
  'Gratitude Inventory',
  'spirit', 'ember', 'handcrafted',
  'Not "be grateful." Actually name the things. Specifically.',
  'Write down 3 specific things you''re grateful for right now. Not generic ("my health") — specific ("the way my friend laughed at my bad joke yesterday"). Specificity is the point.',
  'Specific gratitude journaling activates the medial prefrontal cortex and releases dopamine and serotonin. Generic gratitude has minimal effect — specificity is what makes the brain actually register the positive experience.',
  5, 'anytime', 'reflection',
  'What were your three? Which one surprised you?',
  10, 0.3,
  'The fog feeds on what you forget to notice. Name three things it cannot take from you.',
  'Three things, named. Three anchors in the current. The well deepens.',
  'Gratitude can''t be forced. But it can be noticed, when you''re ready to look.'
),
(
  'Observe Without Judging',
  'spirit', 'ember', 'handcrafted',
  'Your mind labels everything — good, bad, should, shouldn''t. For 5 minutes, turn that off.',
  'Go somewhere you can observe — a window, a park, a busy street. Watch for 5 minutes without labeling what you see as good or bad. Just notice. Tree. Person. Cloud. Car. No story.',
  'Non-judgmental observation is the foundation of mindfulness practice. It trains the anterior cingulate cortex to decouple perception from evaluation, reducing the automatic judgment patterns that fuel anxiety and self-criticism.',
  5, 'anytime', 'self_report',
  'Were you able to observe without judging? When did judgment creep back in?',
  10, 0.3,
  'The mind is a relentless storyteller. Today, give it a scene and ask it to just watch.',
  'Five minutes of seeing without scoring. The world, simply witnessed. That is presence.',
  'Judgment is a deep habit. Noticing that you judge is itself the practice.'
),
(
  'What Are You Building?',
  'spirit', 'flame', 'handcrafted',
  'Not what you''re consuming. Not what you''re avoiding. What are you building?',
  'Write one paragraph answering the question: "What am I building with my life right now?" Not what you wish you were building. What is actually under construction, based on how you spend your days?',
  'Self-authorship — the sense that you are actively constructing your life rather than drifting through it — is a key predictor of psychological well-being. This exercise activates the narrative identity network and promotes intentional living.',
  10, 'evening', 'reflection',
  'What are you building? Is it what you want to be building?',
  25, 0.5,
  'Your days are bricks. Whatever you do most is what you''re building. Look at the structure. Is it yours?',
  'An honest answer. Maybe uncomfortable. But now you see the blueprint — and blueprints can be redrawn.',
  'The question keeps. It doesn''t need an answer today. But it will keep asking.'
),
(
  'Morning Pages',
  'spirit', 'flame', 'handcrafted',
  'Before the day claims you, claim yourself. Write before thinking.',
  'First thing in the morning, before checking any device, write one page of stream-of-consciousness text. Longhand preferred. No editing, no topic. Let the pen move.',
  'Morning pages (from Julia Cameron''s The Artist''s Way) work by draining the "mental cache" — clearing rumination, anxiety, and unprocessed thought before they compound. They engage the left brain with writing, freeing the right brain for creativity.',
  15, 'morning', 'self_report',
  'What came out? Anything you didn''t expect?',
  20, 0.5,
  'Before the world pours in, pour yourself out. One page. The pen knows things the mind hasn''t admitted yet.',
  'A page, filled before the day began. The mind is lighter now, emptied of its overnight weight.',
  'Some mornings demand immediate motion. The page will wait for a quieter dawn.'
),
(
  'Sit With Discomfort',
  'spirit', 'flame', 'handcrafted',
  'Not pain. Not crisis. Just the low hum of discomfort you spend all day running from.',
  'Find the discomfort — boredom, restlessness, anxiety, sadness — and instead of reaching for your phone or food or distraction, sit with it for 10 minutes. Watch it. What does it do?',
  'Distress tolerance is the foundation of emotional regulation. Each time you sit with discomfort without escaping, you strengthen the prefrontal cortex''s ability to override the amygdala''s escape impulse. This is literally how resilience is built.',
  10, 'anytime', 'reflection',
  'What was the discomfort? Did it change shape while you watched it?',
  25, 0.5,
  'Everything you reach for — the phone, the food, the scroll — is a flight from something. Today, you land.',
  'You sat with the thing you always run from. And it didn''t destroy you. It never does. Remember this.',
  'Discomfort and you have an ongoing relationship. There will be other chances to sit together.'
),
(
  'One Thing You''re Proud Of',
  'spirit', 'ember', 'handcrafted',
  'You are quick to catalog your failures. Today, one win. Just one.',
  'Name one thing you did recently that you''re proud of. It doesn''t have to be big. Write it down. Say it out loud. Let yourself feel it without immediately qualifying it.',
  'Self-acknowledgment activates the reward circuitry (ventral striatum) and counters the negativity bias that makes failures feel louder than successes. Deliberately savoring positive experiences strengthens positive memory consolidation.',
  5, 'anytime', 'reflection',
  'What was the thing? Did you let yourself feel proud, or did you qualify it?',
  10, 0.3,
  'Your inner critic has a megaphone. Your inner advocate barely whispers. Turn up the volume, just this once.',
  'One thing, acknowledged. Not qualified. Not minimized. Felt. The well deepens.',
  'Pride is not arrogance. But if today isn''t the day, that''s okay too.'
),
(
  'Watch the Sun Set',
  'spirit', 'ember', 'handcrafted',
  'You have watched ten thousand screens today. Watch one sky.',
  'Find a spot where you can see the sky. Watch the sunset — or if it''s cloudy, watch the light change for 10 minutes. No phone. Just witness.',
  'Awe experiences — including watching natural beauty — activate the vagus nerve and reduce inflammatory markers. They also shift self-perception from isolated individual to part of something larger, which counters existential isolation.',
  10, 'evening', 'self_report',
  NULL,
  10, 0.3,
  'The sky has been putting on a show every single day. You just haven''t been watching.',
  'Light, changing. Sky, witnessed. For a few minutes, you were part of something older than the fog.',
  'The sun sets without an audience. But it is better with one. Another evening, perhaps.'
);
