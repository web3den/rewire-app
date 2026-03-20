// WP6 Part B: Edge Function - Complete Quest (with Spark rewards)
// Trigger: User submits "Done" on quest card
// Purpose: Record completion, award stats + currencies + Sparks
// Returns: Reward moment data (stat gains, Kael response, Spark gains)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface CompleteQuestRequest {
  user_id: string;
  assignment_id: string;
  completion_type: "self_report" | "reflection" | "timed";
  reflection_text?: string;
  timer_duration_seconds?: number;
}

interface CompleteQuestResponse {
  success: boolean;
  quest_title?: string;
  stat_gains?: Record<string, number>;
  fragments_earned?: number;
  sparks_earned?: number;
  sparks_balance?: number;
  kael_response?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: CompleteQuestRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { user_id, assignment_id, completion_type, reflection_text, timer_duration_seconds } = body;

  if (!user_id || !assignment_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: user_id, assignment_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const completedAt = new Date().toISOString();
    const response: CompleteQuestResponse = { success: false };

    // ───────────────────────────────────────────────────────────
    // 1. Get assignment and quest details
    // ───────────────────────────────────────────────────────────
    const { data: assignment, error: assignmentError } = await supabase
      .from("quest_assignments")
      .select("quest_id, slot_type")
      .eq("id", assignment_id)
      .single();

    if (assignmentError) {
      throw new Error(`Failed to fetch assignment: ${assignmentError.message}`);
    }

    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select(
        "id, title, domain, tier, reward_fragments, reward_fog_reveal, resistance_multiplier, narrative_completion"
      )
      .eq("id", assignment.quest_id)
      .single();

    if (questError) {
      throw new Error(`Failed to fetch quest: ${questError.message}`);
    }

    response.quest_title = quest.title;

    // ───────────────────────────────────────────────────────────
    // 2. Calculate stat gains
    // ───────────────────────────────────────────────────────────
    const { data: statGainResult, error: statGainError } = await supabase.rpc(
      "calculate_stat_gain",
      {
        p_user_id: user_id,
        p_domain: quest.domain,
        p_tier: quest.tier,
        p_resistance_multiplier: quest.resistance_multiplier,
      }
    );

    if (statGainError) {
      console.error("Error calculating stat gain:", statGainError);
      throw statGainError;
    }

    const statGain = Number(statGainResult) || 5;

    // ───────────────────────────────────────────────────────────
    // 3. Update user stats
    // ───────────────────────────────────────────────────────────
    const domainToStatColumn: Record<string, string> = {
      body: "vitality",
      mind: "clarity",
      heart: "connection",
      courage: "valor",
      order: "foundation",
      spirit: "depth",
    };

    const statColumn = domainToStatColumn[quest.domain];
    const lastQuestColumn = `last_quest_${statColumn}`;

    const { error: updateStatsError } = await supabase
      .from("user_stats")
      .update({
        [statColumn]: `LEAST(${statColumn} + ${statGain}, 100)`,
        [lastQuestColumn]: completedAt,
        updated_at: completedAt,
      })
      .eq("user_id", user_id);

    if (updateStatsError) {
      console.error("Error updating stats:", updateStatsError);
      throw updateStatsError;
    }

    response.stat_gains = {
      [quest.domain]: statGain,
    };

    // ───────────────────────────────────────────────────────────
    // 4. Award fragments and fog light
    // ───────────────────────────────────────────────────────────
    const fragmentsEarned = quest.reward_fragments || 10;
    const fogRevealEarned = quest.reward_fog_reveal || 0.3;

    const { error: updateCurrenciesError } = await supabase
      .from("user_currencies")
      .update({
        fragments: `fragments + ${fragmentsEarned}`,
        fog_light: `fog_light + ${Math.ceil(fogRevealEarned)}`,
        updated_at: completedAt,
      })
      .eq("user_id", user_id);

    if (updateCurrenciesError) {
      console.error("Error updating currencies:", updateCurrenciesError);
      throw updateCurrenciesError;
    }

    response.fragments_earned = fragmentsEarned;

    // ───────────────────────────────────────────────────────────
    // 5. AWARD SPARKS (WP6 specific)
    // ───────────────────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];
    let sparksEarned = 0;

    // +1 Spark: Anchor completion
    if (assignment.slot_type === "anchor") {
      sparksEarned += 1;
    }

    // +1 Spark: Choice on first set (no refresh used)
    if (assignment.slot_type === "choice") {
      const { data: refreshLog } = await supabase
        .from("quest_refresh_log")
        .select("refresh_count_after")
        .eq("user_id", user_id)
        .eq("refresh_date", today)
        .maybeSingle();

      // If no refresh log or first refresh (count=1), it's the first set
      if (!refreshLog || refreshLog.refresh_count_after === 1) {
        sparksEarned += 1;
      }
    }

    // +2 Sparks: Weekly cycle (5/7 Anchors this week)
    const { data: weekAnchors } = await supabase
      .from("quest_completions")
      .select("id")
      .eq("user_id", user_id)
      .gte(
        "completed_at",
        new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    // Simplified: just check if we hit 5 or 7 completions this week
    if (weekAnchors && (weekAnchors.length === 5 || weekAnchors.length === 7)) {
      sparksEarned += 2;
    }

    // +1 Spark: All 3 slots completed today
    const { data: todayCompletions } = await supabase
      .from("quest_completions")
      .select("id, assignment_id")
      .eq("user_id", user_id)
      .gte("completed_at", `${today}T00:00:00`);

    // Get slot types of completions
    let slotTypes = new Set<string>();
    if (todayCompletions && todayCompletions.length > 0) {
      for (const completion of todayCompletions) {
        const { data: assignData } = await supabase
          .from("quest_assignments")
          .select("slot_type")
          .eq("id", completion.assignment_id)
          .single();

        if (assignData) {
          slotTypes.add(assignData.slot_type);
        }
      }
    }
    // Add current slot
    slotTypes.add(assignment.slot_type);

    if (slotTypes.size === 3) {
      sparksEarned += 1;
    }

    // +1 Spark: Streak (3+ days in last 7)
    const { data: streakData } = await supabase
      .from("quest_completions")
      .select("completed_at")
      .eq("user_id", user_id)
      .gte(
        "completed_at",
        new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (streakData) {
      const uniqueDays = new Set(streakData.map((c) => c.completed_at.split("T")[0]));
      if (uniqueDays.size % 3 === 0 && uniqueDays.size > 0) {
        sparksEarned += 1;
      }
    }

    // Award Sparks (capped at 20)
    if (sparksEarned > 0) {
      const { data: currentSparks } = await supabase
        .from("user_sparks")
        .select("sparks")
        .eq("user_id", user_id)
        .single();

      const newSparks = Math.min((currentSparks?.sparks || 0) + sparksEarned, 20);

      const { error: updateSparksError } = await supabase
        .from("user_sparks")
        .update({
          sparks: newSparks,
          last_earned: completedAt,
          updated_at: completedAt,
        })
        .eq("user_id", user_id);

      if (updateSparksError) {
        console.error("Error updating sparks:", updateSparksError);
      } else {
        // Log transaction
        await supabase.from("currency_transactions").insert({
          user_id,
          currency: "sparks",
          amount: sparksEarned,
          balance_after: newSparks,
          reason: `quest_completion_${assignment.slot_type}`,
          reference_id: assignment_id,
        });

        response.sparks_earned = sparksEarned;
        response.sparks_balance = newSparks;
      }
    }

    // ───────────────────────────────────────────────────────────
    // 6. Record quest completion
    // ───────────────────────────────────────────────────────────
    const { error: insertCompletionError } = await supabase
      .from("quest_completions")
      .insert({
        user_id,
        quest_id: quest.id,
        assignment_id,
        completion_type,
        completed_at: completedAt,
        reflection_text,
        timer_duration_seconds,
        fragments_earned: fragmentsEarned,
        fog_reveal_earned: fogRevealEarned,
        stat_dimension: quest.domain,
        stat_change: statGain,
      });

    if (insertCompletionError) {
      console.error("Error inserting quest completion:", insertCompletionError);
      throw insertCompletionError;
    }

    // ───────────────────────────────────────────────────────────
    // 7. Mark assignment as completed
    // ───────────────────────────────────────────────────────────
    const { error: updateAssignmentError } = await supabase
      .from("quest_assignments")
      .update({ status: "completed", updated_at: completedAt })
      .eq("id", assignment_id);

    if (updateAssignmentError) {
      console.error("Error updating assignment:", updateAssignmentError);
    }

    // ───────────────────────────────────────────────────────────
    // 8. Generate Kael response
    // ───────────────────────────────────────────────────────────
    response.kael_response = quest.narrative_completion || "Your effort ripples through the fog.";

    response.success = true;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in complete-quest:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
