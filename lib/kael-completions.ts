/**
 * Kael Completion Dialogue
 * Selects contextual Kael responses for quest completions
 * Based on KAEL-DIALOGUE-POOLS.md
 */

import type { QuestDomain, QuestTier } from './types';

export interface CompletionContext {
  domain: QuestDomain;
  tier: QuestTier;
  energyLevel?: number; // 0–1
  streakDays?: number;
  isFirstInDomain?: boolean;
  skippedYesterday?: boolean;
}

// ─── Ember responses by domain × context ───

const EMBER_DIALOGUES: Record<QuestDomain, Record<string, string>> = {
  body: {
    first: "Your body remembers this. Even when your mind forgets, the ground beneath your feet will remember.",
    low: "You moved even though you couldn't see the point. That's the part that matters most.",
    high: "That fire in you — that's real. The fog notices when you burn like that.",
    streak: "Three days of showing your body it has a say. It's waking up now. It's starting to believe you'll listen.",
    skip: "You came back. Your body's been waiting — I could tell. This was the bridge.",
    standard: "Your body knows something your mind is still catching up to. Keep listening to what it says.",
  },
  mind: {
    first: "Your mind just did what it does best — made sense of something that looked like noise. Now comes the harder part: doing something with that sense.",
    low: "Clarity came even when the fog was thick. That's not weakness — that's precision.",
    high: "The lightbulb moment isn't what matters. What matters is you're already thinking about what comes next.",
    streak: "Three days of your mind waking up. The patterns are getting clearer. Watch what you see next.",
    skip: "You doubted yourself yesterday. Today you came back anyway. That's not logic — that's wisdom.",
    standard: "You understand something now that you didn't before. That understanding is a tool — what you do with it comes next.",
  },
  heart: {
    first: "Connection doesn't need to be easy to be real. You just proved that.",
    low: "You chose to reach even when reaching felt impossible. The weight you felt was love pretending to be burden.",
    high: "That's not just connection — that's you showing up as yourself. People feel the difference.",
    streak: "Three days of keeping the bridge open. It's not getting easier — it's getting realer.",
    skip: "Yesterday the bridge felt too fragile. Today you walked across it anyway. The fog felt that.",
    standard: "You let someone see you today. Whoever they are, whatever they saw — that counts.",
  },
  courage: {
    first: "You took a step toward something that wanted you to stay back. That's where courage lives — not in the absence of fear, but in that step.",
    low: "Fear was loud today and you moved anyway. That's not bravery for an audience. That's bravery for yourself.",
    high: "That energy you brought — the fog retreated. It always does when you show up like that.",
    streak: "Three days facing what pushes back. You're not just braver — you're becoming someone who knows they can be.",
    skip: "You came back to the edge. Yesterday you stepped away — today you stepped forward. That's the whole thing.",
    standard: "That fear you just walked through — it's smaller now. Not gone. But smaller. Tomorrow it'll be even smaller.",
  },
  order: {
    first: "Structure is how you tell the chaos where to stand. You just placed the first boundary. It remembers.",
    low: "You built even when you didn't feel like building. That's what foundations are — done before you're ready.",
    high: "Order isn't control — it's respect for your own capacity. You showed yourself some respect today.",
    streak: "Three days of choosing structure over drift. Something is stabilizing. You can feel it, even if you can't name it.",
    skip: "Yesterday you let it slide. Today you didn't. The structure doesn't hold grudges — it just holds.",
    standard: "You created structure today. Structure isn't confinement — it's permission to grow inside something stable.",
  },
  spirit: {
    first: "Quiet, but not empty. There's something growing in that silence — something that only grows when you listen.",
    low: "Even half-present is still present. Your depth heard what your surface couldn't carry today.",
    high: "That aliveness — that's not mood. That's contact. You touched something real.",
    streak: "Three days of listening for meaning. The signal gets clearer the longer you tune in.",
    skip: "You came back to the question. Some people never do. You did. That's everything.",
    standard: "You asked something real today. Tomorrow you might find the answer — but today, the asking was everything.",
  },
};

// ─── Flame responses (archetypal patterns) ───

const FLAME_DIALOGUES = [
  "You reached across something real today. Most people talk about that kind of reach. You actually did it. What you built in that moment doesn't vanish when the moment ends.",
  "You moved toward the thing that wanted you to stay still. That's not just courage — that's you rewriting which part of yourself gets to decide.",
  "You took something that was scattered and gave it shape. Order isn't just cleanliness — it's the architecture of what you actually believe about yourself.",
  "You didn't look away. That takes more than people admit. The truth you witnessed today — it's yours now. You can't unsee it, and you shouldn't.",
  "You set something down that you'd been carrying without realizing how heavy it was. Lighter isn't empty. It's room for something new.",
  "You came back to the ground after going somewhere deep. Integration is the hardest part of insight — you're doing it.",
  "You called up a version of yourself that doesn't come naturally yet. The more you summon it, the less foreign it feels.",
  "Something rigid softened. That's not weakness. That's the most sophisticated form of strength there is.",
];

// ─── Blaze responses (boss quest tier) ───

const BLAZE_DIALOGUES = [
  "That wasn't a quest. That was a reckoning. You faced something most people spend their whole lives avoiding, and you didn't flinch. The fog remembers who walks through it like that.",
  "This is what all the smaller moves were building toward. You didn't just complete something today — you proved something to yourself that can't be taken back.",
  "Boss quests don't come around often. And when they do, most people find a reason to circle back tomorrow. You didn't. Whatever's waiting on the other side of this — you earned the right to find it.",
];

// ─── Selector ───

export function selectKaelCompletionLine(ctx: CompletionContext): string {
  const { domain, tier, energyLevel = 0.5, streakDays = 0, isFirstInDomain = false, skippedYesterday = false } = ctx;

  if (tier === 'blaze' || tier === 'inferno') {
    return BLAZE_DIALOGUES[Math.floor(Math.random() * BLAZE_DIALOGUES.length)];
  }

  if (tier === 'flame') {
    return FLAME_DIALOGUES[Math.floor(Math.random() * FLAME_DIALOGUES.length)];
  }

  // Ember: pick context variant
  const pool = EMBER_DIALOGUES[domain];
  if (!pool) return "You did it. That matters.";

  let key: string;
  if (isFirstInDomain) key = 'first';
  else if (skippedYesterday) key = 'skip';
  else if (streakDays >= 3) key = 'streak';
  else if (energyLevel < 0.33) key = 'low';
  else if (energyLevel > 0.66) key = 'high';
  else key = 'standard';

  return pool[key] ?? pool.standard;
}

// ─── Tier badge metadata ───

export interface TierBadge {
  label: string;
  color: string;
  glowColor: string;
  symbol: string;
}

export const TIER_BADGES: Record<QuestTier, TierBadge> = {
  ember: {
    label: 'Ember',
    color: '#FF6B4A',
    glowColor: 'rgba(255, 107, 74, 0.35)',
    symbol: '🔥',
  },
  flame: {
    label: 'Flame',
    color: '#E8A838',
    glowColor: 'rgba(232, 168, 56, 0.35)',
    symbol: '✦',
  },
  blaze: {
    label: 'Blaze',
    color: '#D45CFF',
    glowColor: 'rgba(212, 92, 255, 0.35)',
    symbol: '⚡',
  },
  inferno: {
    label: 'Inferno',
    color: '#FF4444',
    glowColor: 'rgba(255, 68, 68, 0.4)',
    symbol: '💥',
  },
};

// ─── Spark reward logic ───

export interface SparkReward {
  sparks: number;
  streakBonus: boolean;
  threeSlotBonus: boolean;
  label: string;
}

export function computeSparkReward(
  tier: QuestTier,
  streakDays: number,
  completedSlotsToday: number,
): SparkReward {
  const base = tier === 'ember' ? 1 : tier === 'flame' ? 2 : tier === 'blaze' ? 3 : 5;
  const streakBonus = streakDays >= 3;
  const threeSlotBonus = completedSlotsToday >= 3;

  let sparks = base;
  if (streakBonus) sparks += 1;
  if (threeSlotBonus) sparks += 1;

  const bonusNotes: string[] = [];
  if (streakBonus) bonusNotes.push('streak');
  if (threeSlotBonus) bonusNotes.push('full day');

  const label = bonusNotes.length > 0
    ? `+${sparks} Sparks (${bonusNotes.join(' + ')} bonus)`
    : `+${sparks} Spark${sparks !== 1 ? 's' : ''}`;

  return { sparks, streakBonus, threeSlotBonus, label };
}
