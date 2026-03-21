/**
 * kael-skip.ts — WP5 Skip Flow Dialogue Pool
 *
 * Pull context-aware responses for the skip/rest moment.
 * All responses sourced from KAEL-DIALOGUE-POOLS.md §WP5.
 */

export type SkipFlowType = 'rest_today' | 'come_back_later' | 'make_smaller';

export interface KaelSkipResponse {
  intro: string;       // Kael's empathetic opening
  body: string;        // Core validating message
  cta: string;         // Button label
}

// ── "Rest Today" pool ──────────────────────────────────────────────────────

const REST_TODAY_TRACK_A: KaelSkipResponse[] = [
  {
    intro: 'Rest is a real choice.',
    body: "No quests today. The fog will hold — it's not going anywhere. Rest is a real choice.",
    cta: 'Rest for now',
  },
  {
    intro: 'Rest isn\'t empty.',
    body: "Rest isn't empty. It's the breath between efforts. You earned that. Take it.",
    cta: 'Rest for now',
  },
];

const REST_TODAY_TRACK_B: KaelSkipResponse[] = [
  {
    intro: 'The fog is patient.',
    body: "No quests today. The fog will hold. Neither of us are going anywhere.",
    cta: 'Rest for now',
  },
  {
    intro: 'Rest is real work.',
    body: "Rest is real work. You're doing it. That's enough.",
    cta: 'Rest for now',
  },
];

// ── "Come Back Later" pool ─────────────────────────────────────────────────

const COME_BACK_LATER_TRACK_A: KaelSkipResponse[] = [
  {
    intro: 'Not right now.',
    body: "Your quests aren't going anywhere. Neither am I. We'll try again when you're ready — evening, whenever it fits.",
    cta: 'Come back later',
  },
];

const COME_BACK_LATER_TRACK_B: KaelSkipResponse[] = [
  {
    intro: 'The fog is patient.',
    body: "The fog is patient. Your quests can wait. I can wait. No rush.",
    cta: 'Come back later',
  },
];

// ── "Make It Smaller" pool ─────────────────────────────────────────────────

const MAKE_SMALLER_TRACK_A: KaelSkipResponse[] = [
  {
    intro: 'Small is real.',
    body: "Small is real. That counted. I know you've got more than this — but this? This was enough.",
    cta: 'Do something small',
  },
  {
    intro: 'The smallest movement counts.',
    body: "The smallest movement counts as movement. And showing up even when you want to hide? That's the part I'm watching.",
    cta: 'Do something small',
  },
];

const MAKE_SMALLER_TRACK_B: KaelSkipResponse[] = [
  {
    intro: 'Small is real.',
    body: "Small is real. That counted. Full stop. No 'but' after that.",
    cta: 'Do something small',
  },
  {
    intro: "You're here.",
    body: "You're here. You moved something, even a finger. That's not nothing — that's everything today.",
    cta: 'Do something small',
  },
];

// ── Default pre-quest skip (simplest: single confirmation modal) ───────────

const PRE_QUEST_SKIP_RESPONSES: string[] = [
  "Not feeling it? That's okay. Rest is part of the journey.",
  "Some days the quest finds you. Today, let it wait.",
  "Skipping isn't failing. It's knowing yourself well enough to say not now.",
  "The fog remembers you. Your quest will still be here.",
  "Rest is a valid move. The map doesn't disappear when you step back.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get a random Kael response for the pre-quest skip confirmation modal.
 * Simple version: just a validating line + CTA.
 */
export function getPreQuestSkipLine(): string {
  return pick(PRE_QUEST_SKIP_RESPONSES);
}

/**
 * Get a full skip response for a given flow type and track.
 */
export function getSkipFlowResponse(
  flow: SkipFlowType,
  track: 'A' | 'B' = 'A',
): KaelSkipResponse {
  switch (flow) {
    case 'rest_today':
      return pick(track === 'A' ? REST_TODAY_TRACK_A : REST_TODAY_TRACK_B);
    case 'come_back_later':
      return pick(track === 'A' ? COME_BACK_LATER_TRACK_A : COME_BACK_LATER_TRACK_B);
    case 'make_smaller':
      return pick(track === 'A' ? MAKE_SMALLER_TRACK_A : MAKE_SMALLER_TRACK_B);
  }
}
