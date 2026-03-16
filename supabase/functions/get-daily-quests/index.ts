// ============================================================
// Get Daily Quests Edge Function
// POST /functions/v1/get-daily-quests
//
// Returns today's 3 quest slots. Generates assignments lazily
// on first call of the day.
// Flow:
// 1. Trigger daily energy reset
// 2. Compute stat decay
// 3. Check if today's assignments exist
// 4. If not, generate: select anchor quest, choice options, ember quest
// 5. Return assignments with weekly cycle status
//
// Free users: Anchor + Ember only
// Subscribers: all 3 slots (Anchor + Choice + Ember)
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, getUserId } from "../_shared/supabase-admin.ts";
import type { ApiResponse, QuestAssignment, WeeklyCycleStatus } from "../_shared/types.ts";

interface DailyQuestsResponse {
  assignments: QuestAssignment[];
  weekly_status: WeeklyCycleStatus;
  today: string;
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

    // Step 1: Reset daily energy if needed
    await supabaseAdmin.rpc("reset_daily_energy", { p_user_id: userId });

    // Step 2: Compute stat decay
    await supabaseAdmin.rpc("compute_stat_decay", { p_user_id: userId });

    // Step 3: Check for existing assignments today
    const today = new Date().toISOString().split("T")[0];
    const { data: existingAssignments } = await supabaseAdmin
      .from("quest_assignments")
      .select("*, quests(*)")
      .eq("user_id", userId)
      .eq("assigned_date", today);

    if (existingAssignments && existingAssignments.length > 0) {
      // Already assigned — return existing
      // TODO: Format assignments into QuestAssignment[] shape
    }

    // Step 4: Generate new assignments for today
    // TODO: Implement quest selection algorithm:
    // - Anchor: select from user's archetype primary domain, appropriate tier
    // - Choice: select 3 options from different domains weighted by archetype
    // - Ember: select a quick, low-tier quest from a growth-edge domain
    // - Consider recent quest history to avoid repeats
    // - Consider user's safety flags and depth preference

    // Step 5: Get weekly cycle status
    // TODO: Query or create weekly_cycles record for current week

    // Placeholder response
    const response: ApiResponse<DailyQuestsResponse> = {
      data: {
        assignments: [],
        weekly_status: {
          week_start: today,
          week_end: today,
          anchor_completed: 0,
          choice_completed: 0,
          ember_completed: 0,
          full_cycle_achieved: false,
          perfect_cycle: false,
          days_remaining: 7,
        },
        today,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-daily-quests error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
