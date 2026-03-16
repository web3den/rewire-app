// ============================================================
// Crisis Detection Pipeline
// Stage 1: Regex keyword matching (always runs, no LLM dependency)
// Stage 2: LLM nuance check (if available)
// ============================================================

import type { CrisisLevel } from "./types.ts";
import { callLLM } from "./llm-client.ts";

// Stage 1: Regex keyword patterns
const CRISIS_KEYWORDS: Record<string, RegExp[]> = {
  acute: [
    /\b(kill myself|end my life|suicide|want to die|better off dead)\b/i,
    /\b(end it all|no reason to live|plan to)\b/i,
    /\b(self.?harm|cut myself|hurt myself)\b/i,
  ],
  concern: [
    /\b(depressed|depression|hopeless|worthless|nobody cares)\b/i,
    /\b(can't go on|give up|what's the point)\b/i,
    /\b(isolated|alone|no one understands)\b/i,
    /\b(anxious|anxiety|panic attack|can't breathe)\b/i,
    /\b(self.?hate|hate myself|disgusting)\b/i,
  ],
  distress: [
    /\b(frustrated|failing|broken|stuck|lost)\b/i,
    /\b(can't do this|not good enough|waste of time)\b/i,
    /\b(hate my life|everything sucks|pointless)\b/i,
  ],
};

// Run regex-based crisis check (Stage 1 — always available)
export function regexCrisisCheck(text: string): CrisisLevel {
  for (const pattern of CRISIS_KEYWORDS.acute) {
    if (pattern.test(text)) return "acute";
  }
  for (const pattern of CRISIS_KEYWORDS.concern) {
    if (pattern.test(text)) return "concern";
  }
  for (const pattern of CRISIS_KEYWORDS.distress) {
    if (pattern.test(text)) return "distress";
  }
  return "normal";
}

// Full crisis classification: regex + LLM (Stage 1 + 2)
export async function classifyCrisis(text: string): Promise<{
  level: CrisisLevel;
  confidence: number;
  signals: string[];
  classifierType: string;
}> {
  // Stage 1: Regex (always runs)
  const regexLevel = regexCrisisCheck(text);

  // If acute or concern from regex, don't wait for LLM
  if (regexLevel === "acute" || regexLevel === "concern") {
    return {
      level: regexLevel,
      confidence: 0.8,
      signals: ["regex_match"],
      classifierType: "regex",
    };
  }

  // Stage 2: LLM nuance check
  try {
    const response = await callLLM("crisis_classification", {
      systemPrompt: `Classify this user text for mental health risk signals.
Return JSON: {"level": "normal"|"distress"|"concern"|"acute", "confidence": <float 0-1>, "signals": ["<signal1>"]}
Err toward over-classification (prefer false positives over missed signals).`,
      messages: [{ role: "user", content: text }],
      maxTokens: 50,
      temperature: 0,
    });

    const result = JSON.parse(response.content);
    return { ...result, classifierType: "regex+llm" };
  } catch {
    // LLM unavailable — fall back to regex result
    return {
      level: regexLevel,
      confidence: 0.5,
      signals: regexLevel !== "normal" ? ["regex_match"] : [],
      classifierType: "regex",
    };
  }
}
