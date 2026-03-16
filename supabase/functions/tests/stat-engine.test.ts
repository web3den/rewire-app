import { assertEquals, assert } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { calculateStatGain, calculateDecay, domainToStat } from "../_shared/stat-engine.ts";

// ============================================================
// Stat Engine Tests
// ============================================================

Deno.test("stat-engine: domainToStat maps correctly", () => {
  assertEquals(domainToStat("body"), "vitality");
  assertEquals(domainToStat("mind"), "clarity");
  assertEquals(domainToStat("heart"), "connection");
  assertEquals(domainToStat("courage"), "valor");
  assertEquals(domainToStat("order"), "foundation");
  assertEquals(domainToStat("spirit"), "depth");
});

Deno.test("stat-engine: stat gain has diminishing returns", () => {
  // At low stat (15), gain should be larger
  const lowGain = calculateStatGain(15, "ember", 1.0, false);
  // At high stat (80), gain should be smaller
  const highGain = calculateStatGain(80, "ember", 1.0, false);

  assert(lowGain > highGain, `Low stat gain (${lowGain}) should exceed high stat gain (${highGain})`);
});

Deno.test("stat-engine: higher tiers give more gain", () => {
  const emberGain = calculateStatGain(30, "ember", 1.0, false);
  const flameGain = calculateStatGain(30, "flame", 1.0, false);
  const blazeGain = calculateStatGain(30, "blaze", 1.0, false);

  assert(flameGain > emberGain, "Flame should give more than ember");
  assert(blazeGain > flameGain, "Blaze should give more than flame");
});

Deno.test("stat-engine: resistance multiplier increases gain", () => {
  const baseGain = calculateStatGain(30, "flame", 1.0, false);
  const resistGain = calculateStatGain(30, "flame", 1.5, false);

  assert(resistGain > baseGain, "Resistance multiplier should increase gain");
});

Deno.test("stat-engine: primary archetype bonus applies", () => {
  const normalGain = calculateStatGain(30, "flame", 1.0, false);
  const primaryGain = calculateStatGain(30, "flame", 1.0, true);

  assert(primaryGain > normalGain, "Primary archetype should give bonus");
});

Deno.test("stat-engine: stat cannot exceed 100", () => {
  const gain = calculateStatGain(99, "inferno", 2.5, true);
  assert(gain <= 1.0, `Gain at 99 should not push past 100, got ${gain}`);
});

Deno.test("stat-engine: stat gain is always positive", () => {
  const gain = calculateStatGain(50, "ember", 1.0, false);
  assert(gain > 0, "Gain should always be positive");
});

Deno.test("stat-engine: decay is gradual", () => {
  const decay1day = calculateDecay(50, 1);
  const decay7days = calculateDecay(50, 7);

  assert(decay1day === 0, "No decay within first 7 days");
  assert(decay7days >= 0, "Decay should be non-negative");
});

Deno.test("stat-engine: decay doesn't go below 10", () => {
  const decay = calculateDecay(12, 30);
  assert(12 - decay >= 10, "Stat should not decay below floor of 10");
});
