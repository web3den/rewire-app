import { assertEquals, assert, assertNotEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { mockEmberQuest, mockFlameQuest, mockCourageQuest, mockStats } from "./_mocks.ts";
import { calculateStatGain, TIER_BASE_FRAGMENTS } from "../_shared/stat-engine.ts";

// ============================================================
// Quest Logic Tests
// ============================================================

Deno.test("quest: ember quests have correct base fragments", () => {
  assertEquals(TIER_BASE_FRAGMENTS["ember"], 10);
  assertEquals(TIER_BASE_FRAGMENTS["flame"], 20);
  assertEquals(TIER_BASE_FRAGMENTS["blaze"], 40);
  assertEquals(TIER_BASE_FRAGMENTS["inferno"], 80);
});

Deno.test("quest: reward fragments match tier expectations", () => {
  assert(mockEmberQuest.reward_fragments <= 15, "Ember should not give more than 15 fragments");
  assert(mockFlameQuest.reward_fragments >= 10, "Flame should give at least 10 fragments");
  assert(mockCourageQuest.reward_fragments >= 15, "Courage quest with resistance should give more");
});

Deno.test("quest: resistance multiplier is within bounds", () => {
  assert(mockEmberQuest.resistance_multiplier >= 1.0, "Resistance >= 1.0");
  assert(mockEmberQuest.resistance_multiplier <= 2.5, "Resistance <= 2.5");
  assert(mockCourageQuest.resistance_multiplier >= 1.0, "Courage resistance >= 1.0");
  assert(mockCourageQuest.resistance_multiplier <= 2.5, "Courage resistance <= 2.5");
});

Deno.test("quest: fog reveal scales with tier", () => {
  assert(mockEmberQuest.reward_fog_reveal < mockFlameQuest.reward_fog_reveal,
    "Flame should reveal more fog than ember");
});

Deno.test("quest: stat gain from quest completion is reasonable", () => {
  // Simulate completing a body quest at current vitality
  const gain = calculateStatGain(mockStats.vitality, "flame", 1.0, false);
  assert(gain > 0, "Should gain stat points");
  assert(gain < 10, "Gain should be reasonable (< 10 per quest)");
});

Deno.test("quest: high-resistance quest gives meaningful bonus", () => {
  const normalGain = calculateStatGain(30, "flame", 1.0, false);
  const resistGain = calculateStatGain(30, "flame", 1.5, false);
  const ratio = resistGain / normalGain;
  assert(ratio >= 1.3 && ratio <= 1.7, `Resistance bonus ratio should be ~1.5, got ${ratio}`);
});

Deno.test("quest: all quest domains are valid", () => {
  const validDomains = ["body", "mind", "heart", "courage", "order", "spirit"];
  assert(validDomains.includes(mockEmberQuest.domain), "Ember quest domain should be valid");
  assert(validDomains.includes(mockCourageQuest.domain), "Courage quest domain should be valid");
});

Deno.test("quest: all quest tiers are valid", () => {
  const validTiers = ["ember", "flame", "blaze", "inferno"];
  assert(validTiers.includes(mockEmberQuest.tier), "Ember quest tier should be valid");
  assert(validTiers.includes(mockFlameQuest.tier), "Flame quest tier should be valid");
});

Deno.test("quest: duration estimates are realistic", () => {
  assert(mockEmberQuest.duration_estimate_min >= 1, "Min 1 minute");
  assert(mockEmberQuest.duration_estimate_min <= 15, "Ember max 15 minutes");
  assert(mockFlameQuest.duration_estimate_min >= 15, "Flame min 15 minutes");
  assert(mockFlameQuest.duration_estimate_min <= 60, "Flame max 60 minutes");
});

Deno.test("quest: reflection quests have prompts", () => {
  if (mockFlameQuest.completion_type === "reflection") {
    assertNotEquals(mockFlameQuest.reflection_prompt, null, "Reflection quests need prompts");
    assert(mockFlameQuest.reflection_prompt!.length > 10, "Reflection prompt should be meaningful");
  }
});
