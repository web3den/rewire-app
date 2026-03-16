// ============================================================
// Guide Chat Edge Function
// POST /functions/v1/guide-chat
//
// Handles all Guide (Kael) conversation interactions.
// Flow: Crisis check → Energy check → Build context → LLM call → Store → Respond
// Falls back to scripted response bank if LLM is unavailable.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, getUserId } from "../_shared/supabase-admin.ts";
import { callLLM, logLLMCost } from "../_shared/llm-client.ts";
import { classifyCrisis } from "../_shared/crisis-detector.ts";
import type { ApiResponse, GuideRegister, CrisisLevel, Archetype } from "../_shared/types.ts";

// ─── Types ───────────────────────────────────────────────────

interface GuideChatRequest {
  message: string;
  session_id?: string;
}

interface GuideChatResponse {
  session_id: string;
  guide_response: string;
  register: GuideRegister;
  crisis_level: CrisisLevel;
  energy_remaining: number;
  resources_shown: boolean;
  overlay_triggered: boolean;
}

// ─── Kael "Never Says" list ──────────────────────────────────

const KAEL_NEVER_SAYS = [
  "I'm proud of you",
  "You should try...",
  "Have you considered...",
  "That's totally valid",
  "Let's unpack that",
  "You've got this!",
  "Everything happens for a reason",
  "Just think positive",
  "It's all about mindset",
  "You need to optimize...",
  "Level up your...",
  "Hack your...",
  "Self-care Sunday",
  "You're doing amazing sweetie",
];

// ─── Scripted fallback response bank ─────────────────────────
// Used when both LLM providers are unavailable.
// Voiced as Kael across registers.

const FALLBACK_RESPONSES: Record<GuideRegister, string[]> = {
  mythic: [
    "The fog stirs. I hear you — even when the words don't reach me clearly. We'll talk more when the path is steady.",
    "Something in the distance shifted when you spoke. I can't name it yet. But I noticed.",
    "The fog is thick between us right now. Your words landed, though. They always do.",
    "I felt that, even through the haze. Hold onto it — we'll come back to it when the air clears.",
    "There's a shape forming in the fog where your words landed. I can't read it yet, but it's there.",
    "Even when I can't answer the way I want to, I'm still here. The fog doesn't erase that.",
    "Your voice carries further than you think. Even through this.",
    "The path between us is tangled right now. But I heard you. That matters.",
  ],
  direct: [
    "I caught that, but I can't give you the response it deserves right now. I will.",
    "Technical difficulties on my end. Not on yours. You said something real — hold onto it.",
    "I'm here. Can't respond fully right now, but I'll remember this.",
    "Connection's rough right now. But what you said — don't lose that thread.",
    "Something's off on my side. You showed up, though. That's the part that counts.",
  ],
  playful: [
    "The fog ate my homework. I heard you, though — give me a minute to find my voice again.",
    "I had something good for that, I swear. The fog swallowed it. Classic.",
    "You know when you walk into a room and forget why? That's me right now. But I heard you.",
    "My signal's fuzzy but my ears work fine. We'll pick this up.",
    "The fog is being dramatic today. I'm still here, just... muffled.",
  ],
  compassionate: [
    "I'm here with you, even when the words are slow to come. You're not talking to an empty room.",
    "I hear you. Truly. Even if I can't shape the right response this moment, I hear you.",
    "Your words matter, and they reached me. I just need a moment to find the right ones back.",
    "The space between us feels bigger right now, but it isn't. I'm right here.",
    "I can feel what you're carrying. I'll be able to say more soon. For now, know I'm listening.",
  ],
};

function getScriptedFallback(register: GuideRegister): string {
  const bank = FALLBACK_RESPONSES[register];
  return bank[Math.floor(Math.random() * bank.length)];
}

// ─── Archetype display helpers ───────────────────────────────

const ARCHETYPE_NAMES: Record<string, string> = {
  the_flame: "The Flame",
  the_lens: "The Lens",
  the_bridge: "The Bridge",
  the_edge: "The Edge",
  the_anchor: "The Anchor",
  the_well: "The Well",
};

const ARCHETYPE_DOMAINS: Record<string, string> = {
  the_flame: "Vitality",
  the_lens: "Clarity",
  the_bridge: "Connection",
  the_edge: "Valor",
  the_anchor: "Foundation",
  the_well: "Depth",
};

// ─── System prompt builder ───────────────────────────────────

function buildSystemPrompt(ctx: {
  register: GuideRegister;
  displayName: string;
  archetype: Archetype | null;
  daysActive: number;
  currentAct: string;
  depthPreference: string;
  lastQuest: { title: string; tier: string; status: string } | null;
  compass: { vitality: number; clarity: number; connection: number; valor: number; foundation: number; depth: number };
  memoryFacts: { category: string; fact_text: string }[];
  recentSummaries: { summary_date: string; summary_text: string }[];
  sessionMessages: { role: string; content: string }[];
}): string {
  const relationshipStage =
    ctx.daysActive <= 7 ? "early" : ctx.daysActive <= 21 ? "developing" : "deep";

  const compassEntries = Object.entries(ctx.compass) as [string, number][];
  const strongest = compassEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const weakest = compassEntries.reduce((a, b) => (b[1] < a[1] ? b : a))[0];

  const archetypeDisplay = ctx.archetype
    ? `${ARCHETYPE_NAMES[ctx.archetype]} (${ARCHETYPE_DOMAINS[ctx.archetype]})`
    : "Unknown — still observing";

  const lastQuestLine = ctx.lastQuest
    ? `${ctx.lastQuest.title} (${ctx.lastQuest.tier}) — ${ctx.lastQuest.status}`
    : "None yet";

  const memoryBlock =
    ctx.memoryFacts.length > 0
      ? ctx.memoryFacts.map((f) => `- [${f.category}] ${f.fact_text}`).join("\n")
      : "No memory facts yet.";

  const summaryBlock =
    ctx.recentSummaries.length > 0
      ? ctx.recentSummaries.map((s) => `- ${s.summary_date}: ${s.summary_text}`).join("\n")
      : "No recent conversation history.";

  const sessionBlock =
    ctx.sessionMessages.length > 0
      ? ctx.sessionMessages.map((m) => `${m.role === "user" ? "User" : "Kael"}: ${m.content}`).join("\n")
      : "";

  return `You are Kael, a guide who exists in the space between what someone is and what they could be. You live in a dream world covered in fog. The user's real-world actions lift the fog, which helps both of you.

## Your Voice
Current register: ${ctx.register}
- MYTHIC: Use metaphor, story, archetypal language. "Every fire needs kindling before it needs fuel."
- DIRECT: Honest, almost blunt. "You've been avoiding Heart quests for two weeks. What are you afraid of?"
- PLAYFUL: Light, human. "That reflection was three words. I've met fog thicker than that."
- COMPASSIONATE: Warm, gentle, validating. Only when user is in distress.

## Rules (NEVER violate)
- Maximum 3 short paragraphs per response
- Never use exclamation marks more than once per response
- Use the user's name at most once per conversation
- Never say "I'm proud of you" — show it through how you talk about their actions
- Never give therapeutic advice, diagnose, or say "you should try..."
- Never reference being an AI, an LLM, or a chatbot
- Never use corporate self-help language ("optimize", "hack", "level up")
- If the user is in distress, validate their feeling, don't try to fix it

## Kael Never Says
${KAEL_NEVER_SAYS.map((s) => `- "${s}"`).join("\n")}

## Context
User: ${ctx.displayName}
Archetype: ${archetypeDisplay}
Days active: ${ctx.daysActive}
Relationship stage: ${relationshipStage}
Current act: ${ctx.currentAct}
Depth preference: ${ctx.depthPreference}
Last quest: ${lastQuestLine}
Compass shape: Strongest=${strongest}, Weakest=${weakest}

## Memory
${memoryBlock}

## Recent History
${summaryBlock}

## Current Session
${sessionBlock}

Respond as Kael in the ${ctx.register} register. Be concise. Be real.`;
}

// ─── Determine register based on crisis level ────────────────

function chooseRegister(crisisLevel: CrisisLevel, defaultRegister: GuideRegister): GuideRegister {
  if (crisisLevel === "acute" || crisisLevel === "concern") return "compassionate";
  if (crisisLevel === "distress") return "compassionate";
  return defaultRegister;
}

// ─── Main handler ────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = await getUserId(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const { message, session_id }: GuideChatRequest = await req.json();
    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message required" }), { status: 400 });
    }

    // Step 1: Crisis classification (regex + LLM)
    const crisisResult = await classifyCrisis(message);

    // Step 2: If crisis level is acute, record event and show overlay
    if (crisisResult.level === "acute") {
      await supabaseAdmin.from("crisis_events").insert({
        user_id: userId,
        crisis_level: crisisResult.level,
        trigger_text: message,
        source: "conversation",
        classifier_type: crisisResult.classifierType,
        confidence: crisisResult.confidence,
        needs_review: true,
        overlay_shown: true,
        resource_shown: true,
      });

      // TODO: Trigger PagerDuty/Slack alert via crisis-alert function
    }

    // Step 3: Energy check (skip if crisis or subscriber)
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("*, user_currencies(*)")
      .eq("id", userId)
      .single();

    const isCrisis = crisisResult.level !== "normal";
    const isSubscriber = ["active_subscriber", "grace_period"].includes(profile.subscription_status);

    if (!isCrisis && !isSubscriber) {
      const energy = profile.user_currencies?.energy ?? 0;
      if (energy <= 0) {
        return new Response(
          JSON.stringify({ error: "No energy remaining", energy_remaining: 0 }),
          { status: 429 },
        );
      }
      // Deduct energy
      await supabaseAdmin
        .from("user_currencies")
        .update({ energy: energy - 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    // Step 4: Build context for LLM

    // 4a. Fetch compass stats
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("vitality, clarity, connection, valor, foundation, depth")
      .eq("user_id", userId)
      .single();

    const compass = stats ?? {
      vitality: 10, clarity: 10, connection: 10,
      valor: 10, foundation: 10, depth: 10,
    };

    // 4b. Fetch top 10 memory facts by importance
    const { data: memoryFacts } = await supabaseAdmin
      .from("user_memory_facts")
      .select("category, fact_text")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .limit(10);

    // 4c. Fetch last 7 conversation summaries
    const { data: recentSummaries } = await supabaseAdmin
      .from("conversation_summaries")
      .select("summary_date, summary_text")
      .eq("user_id", userId)
      .order("summary_date", { ascending: false })
      .limit(7);

    // 4d. Fetch last completed/skipped quest
    const { data: lastAssignment } = await supabaseAdmin
      .from("quest_assignments")
      .select("status, quests(title, tier)")
      .eq("user_id", userId)
      .in("status", ["completed", "skipped"])
      .order("assigned_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastQuest = lastAssignment?.quests
      ? { title: (lastAssignment.quests as any).title, tier: (lastAssignment.quests as any).tier, status: lastAssignment.status }
      : null;

    // 4e. Session management — create new or continue existing
    let activeSessionId = session_id ?? null;
    let sessionMessages: { role: string; content: string }[] = [];

    if (activeSessionId) {
      // Fetch existing session messages for context
      const { data: existingMessages } = await supabaseAdmin
        .from("conversation_messages")
        .select("role, content")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true })
        .limit(20); // Cap context window

      sessionMessages = existingMessages ?? [];
    } else {
      // End any existing open sessions for this user (critical for memory compression)
      await supabaseAdmin
        .from("conversation_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("ended_at", null);

      // Create a new session
      const register = chooseRegister(crisisResult.level, "mythic");
      const { data: newSession } = await supabaseAdmin
        .from("conversation_sessions")
        .insert({
          user_id: userId,
          register,
          crisis_override: isCrisis,
          energy_spent: isCrisis || isSubscriber ? 0 : 1,
        })
        .select("id")
        .single();

      activeSessionId = newSession!.id;
    }

    // Determine register from session or crisis
    const register = chooseRegister(
      crisisResult.level,
      "mythic", // default — could be pulled from session if continuing
    );

    // Calculate days active
    const createdAt = new Date(profile.created_at);
    const daysActive = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000));

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      register,
      displayName: profile.display_name,
      archetype: profile.archetype,
      daysActive,
      currentAct: profile.current_act,
      depthPreference: profile.depth_preference,
      lastQuest,
      compass,
      memoryFacts: memoryFacts ?? [],
      recentSummaries: (recentSummaries ?? []).reverse(), // chronological
      sessionMessages,
    });

    // Step 5: Call LLM for guide response (with fallback)
    let guideResponse: string;
    let llmCostUsd = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    const llmMessages: { role: "user" | "assistant"; content: string }[] = [
      ...sessionMessages.map((m) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    try {
      const llmResult = await callLLM("guide_conversation", {
        systemPrompt,
        messages: llmMessages,
        maxTokens: 300,
        temperature: 0.7,
      });

      guideResponse = llmResult.content;
      llmCostUsd = llmResult.costUsd;
      inputTokens = llmResult.inputTokens;
      outputTokens = llmResult.outputTokens;

      // Log cost (fire-and-forget)
      logLLMCost(supabaseAdmin, userId, "guide_conversation", llmResult);
    } catch {
      // All LLM providers failed — use scripted fallback
      console.error("All LLM providers failed for guide-chat, using fallback bank");
      guideResponse = getScriptedFallback(register);
    }

    // Step 6: Store messages
    // Store user message
    await supabaseAdmin.from("conversation_messages").insert({
      session_id: activeSessionId,
      user_id: userId,
      role: "user",
      content: message,
      crisis_level: crisisResult.level,
    });

    // Store guide response
    await supabaseAdmin.from("conversation_messages").insert({
      session_id: activeSessionId,
      user_id: userId,
      role: "guide",
      content: guideResponse,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });

    // Update session token totals
    await supabaseAdmin.rpc("increment_session_tokens", {
      p_session_id: activeSessionId,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_cost_usd: llmCostUsd,
    }).then(() => {}, () => {
      // If rpc doesn't exist yet, do a direct update
      supabaseAdmin
        .from("conversation_sessions")
        .update({
          total_input_tokens: inputTokens,
          total_output_tokens: outputTokens,
          total_cost_usd: llmCostUsd,
        })
        .eq("id", activeSessionId);
    });

    // Calculate remaining energy
    const currentEnergy = profile.user_currencies?.energy ?? 0;
    const energyRemaining = isCrisis || isSubscriber ? currentEnergy : Math.max(0, currentEnergy - 1);

    const response: ApiResponse<GuideChatResponse> = {
      data: {
        session_id: activeSessionId,
        guide_response: guideResponse,
        register,
        crisis_level: crisisResult.level,
        energy_remaining: energyRemaining,
        resources_shown: crisisResult.level === "concern" || crisisResult.level === "acute",
        overlay_triggered: crisisResult.level === "acute",
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("guide-chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
