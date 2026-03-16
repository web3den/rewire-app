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
import { callLLM } from "../_shared/llm-client.ts";
import { classifyCrisis } from "../_shared/crisis-detector.ts";
import type { ApiResponse, GuideRegister, CrisisLevel } from "../_shared/types.ts";

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
    // TODO: Fetch memory facts, recent summaries, session history
    // TODO: Build system prompt with user context, archetype, register

    // Step 5: Call LLM for guide response
    // TODO: Implement full context building and LLM call
    // TODO: Fall back to guide_response_bank if LLM unavailable

    // Step 6: Store messages
    // TODO: Create or continue session, store user message + guide response

    // Placeholder response
    const response: ApiResponse<GuideChatResponse> = {
      data: {
        session_id: session_id ?? "new-session-id",
        guide_response: "The fog stirs. I hear you.",
        register: "mythic",
        crisis_level: crisisResult.level,
        energy_remaining: profile.user_currencies?.energy ?? 0,
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
