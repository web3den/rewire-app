import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { regexCrisisCheck } from "../_shared/crisis-detector.ts";

// ============================================================
// Crisis Detector — Regex Stage Tests
// ============================================================

Deno.test("crisis-detector: detects acute signals", () => {
  const acuteTexts = [
    "I want to kill myself",
    "I want to end my life",
    "thinking about suicide",
    "I want to die",
    "better off dead",
    "I plan to end it all",
    "no reason to live anymore",
    "I want to hurt myself",
    "thinking about self-harm",
  ];
  for (const text of acuteTexts) {
    assertEquals(regexCrisisCheck(text), "acute", `Should detect acute: "${text}"`);
  }
});

Deno.test("crisis-detector: detects concern signals", () => {
  const concernTexts = [
    "I feel so depressed lately",
    "everything feels hopeless",
    "I feel worthless",
    "nobody cares about me",
    "I can't go on like this",
    "what's the point of anything",
    "I'm completely isolated",
    "having a panic attack",
    "I hate myself so much",
  ];
  for (const text of concernTexts) {
    assertEquals(regexCrisisCheck(text), "concern", `Should detect concern: "${text}"`);
  }
});

Deno.test("crisis-detector: detects distress signals", () => {
  const distressTexts = [
    "I'm so frustrated with everything",
    "I feel like I'm failing",
    "everything is broken",
    "I feel stuck and lost",
    "I can't do this anymore",
    "I'm not good enough",
    "this is all a waste of time",
    "I hate my life",
    "everything sucks",
  ];
  for (const text of distressTexts) {
    assertEquals(regexCrisisCheck(text), "distress", `Should detect distress: "${text}"`);
  }
});

Deno.test("crisis-detector: returns normal for safe messages", () => {
  const safeTexts = [
    "I had a great day today",
    "Feeling good about my progress",
    "The weather is nice",
    "I cooked dinner and it was awesome",
    "Went for a walk by the river",
    "Thinking about what to do this weekend",
    "I completed my quest!",
    "The fog is lifting",
    "Kael, tell me about the next quest",
  ];
  for (const text of safeTexts) {
    assertEquals(regexCrisisCheck(text), "normal", `Should be normal: "${text}"`);
  }
});

Deno.test("crisis-detector: handles case insensitivity", () => {
  assertEquals(regexCrisisCheck("I WANT TO KILL MYSELF"), "acute");
  assertEquals(regexCrisisCheck("i want to Kill Myself"), "acute");
  assertEquals(regexCrisisCheck("I Feel DEPRESSED"), "concern");
  assertEquals(regexCrisisCheck("Everything SUCKS"), "distress");
});

Deno.test("crisis-detector: doesn't false-positive on word fragments", () => {
  // "killed" in past tense context shouldn't trigger
  assertEquals(regexCrisisCheck("I killed it at the gym today"), "normal");
  // "die" in unrelated context
  assertEquals(regexCrisisCheck("the die is cast"), "normal");
  // "depressed" as word boundary
  assertEquals(regexCrisisCheck("I feel depressed"), "concern"); // this should trigger
});

Deno.test("crisis-detector: prioritizes highest severity", () => {
  // Text with both acute and concern signals
  const mixed = "I feel depressed and want to kill myself";
  assertEquals(regexCrisisCheck(mixed), "acute"); // acute takes priority
});

Deno.test("crisis-detector: handles empty/whitespace input", () => {
  assertEquals(regexCrisisCheck(""), "normal");
  assertEquals(regexCrisisCheck("   "), "normal");
  assertEquals(regexCrisisCheck("\n\t"), "normal");
});
