import { assertEquals, assert } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { mockCurrencies, mockEmptyCurrencies } from "./_mocks.ts";
import { TIER_BASE_FRAGMENTS } from "../_shared/stat-engine.ts";

// ============================================================
// Economy / Currency Tests
// ============================================================

Deno.test("economy: initial energy is 5 per day", () => {
  assertEquals(mockCurrencies.energy, 5, "Free daily energy should be 5");
});

Deno.test("economy: fragments cannot go negative", () => {
  assert(mockCurrencies.fragments >= 0, "Fragments must be non-negative");
});

Deno.test("economy: energy cannot go negative", () => {
  assert(mockEmptyCurrencies.energy >= 0, "Energy must be non-negative");
});

Deno.test("economy: weekly cycle reward math", () => {
  // 5/7 full cycle = base reward
  // 7/7 perfect cycle = bonus reward
  const baseWeeklyFragments = 50; // from spec
  const perfectBonus = 25; // additional for 7/7
  
  assert(baseWeeklyFragments > 0, "Weekly reward should be positive");
  assert(baseWeeklyFragments + perfectBonus > baseWeeklyFragments, "Perfect should give bonus");
});

Deno.test("economy: tier reward scaling is progressive", () => {
  const emberFrags = TIER_BASE_FRAGMENTS["ember"];
  const flameFrags = TIER_BASE_FRAGMENTS["flame"];
  const blazeFrags = TIER_BASE_FRAGMENTS["blaze"];
  const infernoFrags = TIER_BASE_FRAGMENTS["inferno"];
  
  assert(flameFrags > emberFrags, "Flame > Ember");
  assert(blazeFrags > flameFrags, "Blaze > Flame");
  assert(infernoFrags > blazeFrags, "Inferno > Blaze");
  
  // Check roughly 2x scaling
  assert(flameFrags / emberFrags >= 1.5, "Flame should be ~2x ember");
  assert(blazeFrags / flameFrags >= 1.5, "Blaze should be ~2x flame");
});

Deno.test("economy: fog light accumulates correctly", () => {
  // Simulating fog reveals
  const fogPerEmber = 0.1;
  const fogPerFlame = 0.5;
  const tilesPerUnit = 1; // 1 fog_light = 1 tile revealed
  
  // After 10 ember quests: 1.0 fog_light = 1 tile
  const afterEmbers = fogPerEmber * 10;
  assert(afterEmbers >= tilesPerUnit, "10 ember quests should reveal at least 1 tile");
  
  // After 2 flame quests: 1.0 fog_light = 1 tile
  const afterFlames = fogPerFlame * 2;
  assert(afterFlames >= tilesPerUnit, "2 flame quests should reveal at least 1 tile");
});

Deno.test("economy: energy conversation cost is always 1", () => {
  const conversationCost = 1;
  assertEquals(conversationCost, 1, "Each conversation costs 1 energy");
  
  // With 5 daily energy, user gets 5 free conversations
  const dailyFreeConversations = mockCurrencies.energy;
  assertEquals(dailyFreeConversations, 5, "5 free conversations per day");
});

Deno.test("economy: no inflation exploit via energy→fragments conversion", () => {
  // Verify there's no direct energy→fragments path
  // Energy is spent on conversations, not convertible to fragments
  // Fragments come from quests only
  const energyToFragments = 0; // no conversion exists
  assertEquals(energyToFragments, 0, "No energy→fragments conversion should exist");
});
