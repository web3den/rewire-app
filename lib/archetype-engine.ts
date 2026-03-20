/**
 * Archetype Evolution Engine
 * EMA (Exponential Moving Average) formula from the mental model.
 * vector[d] = vector[d] * decay + behavioral_signal[d] * learning_rate
 */

import { QuestDomain, Archetype, ALL_DOMAINS, DOMAIN_TO_ARCHETYPE, ScenarioChoice } from './types';

export interface ArchetypeVector {
  vitality: number;
  clarity: number;
  connection: number;
  valor: number;
  foundation: number;
  depth: number;
}

export interface ArchetypeState {
  vector: ArchetypeVector;
  primary: Archetype;
  secondary: Archetype;
  confidence: number;
  onboardingSignal: ArchetypeVector;
  revealed: boolean;
}

const DOMAIN_TO_VECTOR_KEY: Record<QuestDomain, keyof ArchetypeVector> = {
  body: 'vitality',
  mind: 'clarity',
  heart: 'connection',
  courage: 'valor',
  order: 'foundation',
  spirit: 'depth',
};

// ─── Initialization from scenario choices ───

export function initializeFromScenarios(
  choices: { domain: QuestDomain; weight?: number }[]
): ArchetypeState {
  const raw: ArchetypeVector = {
    vitality: 0,
    clarity: 0,
    connection: 0,
    valor: 0,
    foundation: 0,
    depth: 0,
  };

  for (const c of choices) {
    const key = DOMAIN_TO_VECTOR_KEY[c.domain];
    raw[key] += c.weight ?? 2;
  }

  // Normalize to 0-1 range (max possible ~12)
  const maxPossible = 12;
  const vector: ArchetypeVector = {
    vitality: raw.vitality / maxPossible,
    clarity: raw.clarity / maxPossible,
    connection: raw.connection / maxPossible,
    valor: raw.valor / maxPossible,
    foundation: raw.foundation / maxPossible,
    depth: raw.depth / maxPossible,
  };

  const sorted = getSortedDimensions(vector);
  const primary = DOMAIN_TO_ARCHETYPE[sorted[0].domain];
  const secondary = DOMAIN_TO_ARCHETYPE[sorted[1].domain];

  return {
    vector,
    primary,
    secondary,
    confidence: 0.3,
    onboardingSignal: { ...vector },
    revealed: false,
  };
}

// ─── Daily EMA update ───

export function updateArchetypeDaily(
  state: ArchetypeState,
  dayOfSeason: number,
  behavioralSignal: ArchetypeVector
): ArchetypeState {
  // Decay and learning rate based on day
  let decayFactor: number;
  let learningRate: number;

  if (dayOfSeason <= 3) {
    decayFactor = 0.85;
    learningRate = 0.15;
  } else if (dayOfSeason <= 7) {
    decayFactor = 0.75;
    learningRate = 0.25;
  } else if (dayOfSeason <= 14) {
    decayFactor = 0.60;
    learningRate = 0.40;
  } else {
    decayFactor = 0.50;
    learningRate = 0.50;
  }

  // Update vector with EMA
  const newVector: ArchetypeVector = {
    vitality: state.vector.vitality * decayFactor + behavioralSignal.vitality * learningRate,
    clarity: state.vector.clarity * decayFactor + behavioralSignal.clarity * learningRate,
    connection: state.vector.connection * decayFactor + behavioralSignal.connection * learningRate,
    valor: state.vector.valor * decayFactor + behavioralSignal.valor * learningRate,
    foundation: state.vector.foundation * decayFactor + behavioralSignal.foundation * learningRate,
    depth: state.vector.depth * decayFactor + behavioralSignal.depth * learningRate,
  };

  // Normalize to sum = 1
  const total =
    newVector.vitality + newVector.clarity + newVector.connection +
    newVector.valor + newVector.foundation + newVector.depth;

  if (total > 0) {
    newVector.vitality /= total;
    newVector.clarity /= total;
    newVector.connection /= total;
    newVector.valor /= total;
    newVector.foundation /= total;
    newVector.depth /= total;
  }

  const sorted = getSortedDimensions(newVector);
  const primary = DOMAIN_TO_ARCHETYPE[sorted[0].domain];
  const secondary = DOMAIN_TO_ARCHETYPE[sorted[1].domain];

  // Confidence: gap * 0.4 + data_days * 0.25 + consistency baseline 0.35
  const topGap = sorted[0].score - sorted[1].score;
  const dataDays = Math.min(dayOfSeason, 14) / 14.0;
  const confidence = Math.min(0.95, Math.max(0.1, topGap * 2.0 * 0.4 + 0.35 * 0.5 + dataDays * 0.25));

  return {
    vector: newVector,
    primary,
    secondary,
    confidence,
    onboardingSignal: state.onboardingSignal,
    revealed: state.revealed,
  };
}

// ─── Helpers ───

function getSortedDimensions(vector: ArchetypeVector): { domain: QuestDomain; score: number }[] {
  const entries: { domain: QuestDomain; score: number }[] = [
    { domain: 'body', score: vector.vitality },
    { domain: 'mind', score: vector.clarity },
    { domain: 'heart', score: vector.connection },
    { domain: 'courage', score: vector.valor },
    { domain: 'order', score: vector.foundation },
    { domain: 'spirit', score: vector.depth },
  ];
  entries.sort((a, b) => b.score - a.score);
  return entries;
}

export function getPrimaryDomain(archetype: Archetype): QuestDomain {
  const map: Record<Archetype, QuestDomain> = {
    the_flame: 'body',
    the_lens: 'mind',
    the_bridge: 'heart',
    the_edge: 'courage',
    the_anchor: 'order',
    the_well: 'spirit',
  };
  return map[archetype];
}

export function getArchetypeDisplayName(archetype: Archetype): string {
  const map: Record<Archetype, string> = {
    the_flame: 'The Flame',
    the_lens: 'The Lens',
    the_bridge: 'The Bridge',
    the_edge: 'The Edge',
    the_anchor: 'The Anchor',
    the_well: 'The Well',
  };
  return map[archetype];
}
