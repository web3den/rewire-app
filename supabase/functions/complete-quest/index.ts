// ============================================================
// Complete Quest Edge Function
// POST /functions/v1/complete-quest
//
// Processes quest completion. All mutations in a single transaction:
// 1. Validate assignment exists and is active
// 2. Validate completion requirements (reflection length, timer duration)
// 3. Calculate stat gain (base × tier × resistance × streak × diminishing returns)
// 4. Grant rewards (fragments, energy, fog reveal)
// 5. Update user stats
// 6. Update fog map (reveal tiles)
// 7. Record completion
// 8. Update weekly cycle count
// 9. Trigger async reflection scoring if reflection provided
// 10. Log currency transactions
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, getUserId } from "../_shared/supabase-admin.ts";
import { domainToStatColumn } from "../_shared/stat-engine.ts";
import type { ApiResponse, QuestCompletionResult } from "../_shared/types.ts";

interface CompleteQuestRequest {
  assignment_id: string;
  reflection_text?: string;
  timer_duration_seconds?: number;
  note?: string;
}

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = await getUserId(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const body: CompleteQuestRequest = await req.json();

    // Step 1: Fetch assignment with quest details
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("quest_assignments")
      .select("*, quests(*)")
      .eq("id", body.assignment_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: "Assignment not found or already completed" }),
        { status: 404 },
      );
    }

    const quest = assignment.quests;

    // Step 2: Validate completion requirements
    if (quest.completion_type === "reflection") {
      if (!body.reflection_text || body.reflection_text.length < 20) {
        return new Response(
          JSON.stringify({ error: "Reflection must be at least 20 characters" }),
          { status: 400 },
        );
      }
    }
    if (quest.completion_type === "timed") {
      if (!body.timer_duration_seconds || body.timer_duration_seconds < quest.duration_estimate_min * 60 * 0.8) {
        return new Response(
          JSON.stringify({ error: "Timer duration insufficient" }),
          { status: 400 },
        );
      }
    }

    // Step 3: Calculate stat gain via database function
    const { data: statGain } = await supabaseAdmin.rpc("calculate_stat_gain", {
      p_user_id: userId,
      p_domain: quest.domain,
      p_tier: quest.tier,
      p_resistance_multiplier: quest.resistance_multiplier,
    });

    // Step 4-10: Process completion
    // TODO: Implement transactional completion processing:
    // - Update quest_assignments status to 'completed'
    // - Insert quest_completions record
    // - Update user_stats (increment dimension + update last_quest timestamp)
    // - Grant fragments, energy, fog_light to user_currencies
    // - Insert currency_transactions for each reward
    // - Reveal fog tiles based on reward_fog_reveal
    // - Update weekly_cycles counts
    // - If reflection provided, trigger async LLM scoring

    // Placeholder response
    const response: ApiResponse<QuestCompletionResult> = {
      data: {
        fragments_earned: quest.reward_fragments,
        energy_earned: quest.reward_energy,
        fog_tiles_revealed: 1,
        stat_dimension: quest.domain,
        stat_change: statGain ?? 0,
        new_compass: {
          vitality: 15, clarity: 15, connection: 15,
          valor: 15, foundation: 15, depth: 15,
          updated_at: new Date().toISOString(),
        },
        new_currencies: { fragments: 0, energy: 0, fog_light: 0 },
        guide_completion_text: quest.narrative_completion,
        bonus_applied: {},
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("complete-quest error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
