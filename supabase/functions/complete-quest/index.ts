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
import { domainToStatColumn, TIER_BASE_FRAGMENTS } from "../_shared/stat-engine.ts";
import { callLLM, logLLMCost } from "../_shared/llm-client.ts";
import type { ApiResponse, QuestCompletionResult, EssenceCompass, CurrencyBalances } from "../_shared/types.ts";

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

    const gain = Number(statGain) || 0;
    const statCol = domainToStatColumn(quest.domain);
    const lastQuestCol = `last_quest_${statCol}`;
    const fragmentsEarned = quest.reward_fragments ?? TIER_BASE_FRAGMENTS[quest.tier] ?? 10;
    const energyEarned = quest.reward_energy ?? 0;
    const fogReveal = Number(quest.reward_fog_reveal) || 0;
    const bonusApplied: Record<string, number> = {};

    // Step 4: Update quest_assignments status → completed
    await supabaseAdmin
      .from("quest_assignments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", body.assignment_id);

    // Step 5: Update user_stats (increment dimension + last_quest timestamp)
    const { data: currentStats } = await supabaseAdmin
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    const currentVal = Number(currentStats?.[statCol] ?? 15);
    const newVal = Math.min(100, currentVal + gain);

    const statsUpdate: Record<string, any> = {
      [statCol]: newVal,
      [lastQuestCol]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await supabaseAdmin
      .from("user_stats")
      .update(statsUpdate)
      .eq("user_id", userId);

    // Step 6: Update user_currencies (fragments, energy, fog_light)
    const { data: currentCurrencies } = await supabaseAdmin
      .from("user_currencies")
      .select("*")
      .eq("user_id", userId)
      .single();

    const newFragments = (currentCurrencies?.fragments ?? 0) + fragmentsEarned;
    const newEnergy = (currentCurrencies?.energy ?? 0) + energyEarned;
    // Accumulate fog_light from fog_reveal (fog_reveal is a fractional value, fog_light is integer)
    const fogLightGain = Math.floor(fogReveal);
    const newFogLight = (currentCurrencies?.fog_light ?? 0) + fogLightGain;

    await supabaseAdmin
      .from("user_currencies")
      .update({
        fragments: newFragments,
        energy: newEnergy,
        fog_light: newFogLight,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Step 7: Insert quest_completions record
    const { data: completion } = await supabaseAdmin
      .from("quest_completions")
      .insert({
        user_id: userId,
        quest_id: quest.id,
        assignment_id: body.assignment_id,
        completion_type: quest.completion_type,
        reflection_text: body.reflection_text ?? null,
        timer_duration_seconds: body.timer_duration_seconds ?? null,
        fragments_earned: fragmentsEarned,
        energy_earned: energyEarned,
        fog_reveal_earned: fogReveal,
        stat_dimension: quest.domain,
        stat_change: gain,
        bonus_applied: bonusApplied,
      })
      .select("id")
      .single();

    const completionId = completion?.id;

    // Step 8: Log currency transactions
    const txPromises = [];
    if (fragmentsEarned > 0) {
      txPromises.push(
        supabaseAdmin.from("currency_transactions").insert({
          user_id: userId,
          currency: "fragments",
          amount: fragmentsEarned,
          balance_after: newFragments,
          reason: "quest_completion",
          reference_id: completionId,
        }),
      );
    }
    if (energyEarned > 0) {
      txPromises.push(
        supabaseAdmin.from("currency_transactions").insert({
          user_id: userId,
          currency: "energy",
          amount: energyEarned,
          balance_after: newEnergy,
          reason: "quest_completion",
          reference_id: completionId,
        }),
      );
    }
    if (fogLightGain > 0) {
      txPromises.push(
        supabaseAdmin.from("currency_transactions").insert({
          user_id: userId,
          currency: "fog_light",
          amount: fogLightGain,
          balance_after: newFogLight,
          reason: "quest_completion",
          reference_id: completionId,
        }),
      );
    }
    await Promise.all(txPromises);

    // Step 9: Reveal fog tiles based on accumulated fog_light
    let tilesRevealed = 0;
    if (newFogLight > 0) {
      // Each fog_light point can reveal one hidden tile
      const tilesToReveal = newFogLight;
      const { data: hiddenTiles } = await supabaseAdmin
        .from("fog_map_state")
        .select("id, tile_index, ring")
        .eq("user_id", userId)
        .eq("status", "hidden")
        .order("ring", { ascending: true })
        .limit(tilesToReveal);

      if (hiddenTiles && hiddenTiles.length > 0) {
        tilesRevealed = hiddenTiles.length;
        await supabaseAdmin
          .from("fog_map_state")
          .update({
            status: "revealed",
            revealed_at: new Date().toISOString(),
            revealed_by: "fog_light",
            reference_id: completionId,
            updated_at: new Date().toISOString(),
          })
          .in("id", hiddenTiles.map((t) => t.id));

        // Deduct spent fog_light
        const remainingFogLight = newFogLight - tilesRevealed;
        await supabaseAdmin
          .from("user_currencies")
          .update({ fog_light: remainingFogLight, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        // Log fog_light spend
        if (tilesRevealed > 0) {
          await supabaseAdmin.from("currency_transactions").insert({
            user_id: userId,
            currency: "fog_light",
            amount: -tilesRevealed,
            balance_after: remainingFogLight,
            reason: "fog_light_tile_reveal",
            reference_id: completionId,
          });
        }

        // Update season_progress total_fog_tiles_revealed
        await supabaseAdmin
          .from("season_progress")
          .update({
            total_fog_tiles_revealed: (await supabaseAdmin
              .from("fog_map_state")
              .select("id", { count: "exact" })
              .eq("user_id", userId)
              .eq("status", "revealed")).count ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("status", "active");
      }
    }

    // Step 10: Update weekly cycle counts
    const todayStr = new Date().toISOString().split("T")[0];
    const day = new Date(todayStr + "T12:00:00Z").getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const mondayDate = new Date(todayStr + "T12:00:00Z");
    mondayDate.setUTCDate(mondayDate.getUTCDate() + diffToMonday);
    const weekStart = mondayDate.toISOString().split("T")[0];

    const slotColumn = `${assignment.slot_type}_completed`;
    // Upsert weekly cycle: increment the slot count
    const { data: cycle } = await supabaseAdmin
      .from("weekly_cycles")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .single();

    if (cycle) {
      const update: Record<string, any> = {
        [slotColumn]: (cycle[slotColumn] ?? 0) + 1,
        updated_at: new Date().toISOString(),
      };
      await supabaseAdmin.from("weekly_cycles").update(update).eq("id", cycle.id);
    }

    // Update season_progress total_quests_completed
    const { data: seasonProgress } = await supabaseAdmin
      .from("season_progress")
      .select("total_quests_completed")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (seasonProgress) {
      await supabaseAdmin
        .from("season_progress")
        .update({
          total_quests_completed: (seasonProgress.total_quests_completed ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "active");
    }

    // Mark first quest completed on profile if applicable
    await supabaseAdmin
      .from("user_profiles")
      .update({ first_quest_completed: true, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .eq("first_quest_completed", false);

    // Step 11: Async reflection scoring (fire-and-forget)
    if (body.reflection_text && body.reflection_text.length >= 20) {
      scoreReflection(userId, completionId!, body.reflection_text, newFragments);
    }

    // Build updated compass
    const { data: updatedStats } = await supabaseAdmin
      .from("user_stats")
      .select("vitality, clarity, connection, valor, foundation, depth, updated_at")
      .eq("user_id", userId)
      .single();

    const newCompass: EssenceCompass = {
      vitality: Number(updatedStats?.vitality ?? 15),
      clarity: Number(updatedStats?.clarity ?? 15),
      connection: Number(updatedStats?.connection ?? 15),
      valor: Number(updatedStats?.valor ?? 15),
      foundation: Number(updatedStats?.foundation ?? 15),
      depth: Number(updatedStats?.depth ?? 15),
      updated_at: updatedStats?.updated_at ?? new Date().toISOString(),
    };

    // Fetch final currency state
    const { data: finalCurrencies } = await supabaseAdmin
      .from("user_currencies")
      .select("fragments, energy, fog_light")
      .eq("user_id", userId)
      .single();

    const newCurrencies: CurrencyBalances = {
      fragments: finalCurrencies?.fragments ?? 0,
      energy: finalCurrencies?.energy ?? 0,
      fog_light: finalCurrencies?.fog_light ?? 0,
    };

    const response: ApiResponse<QuestCompletionResult> = {
      data: {
        fragments_earned: fragmentsEarned,
        energy_earned: energyEarned,
        fog_tiles_revealed: tilesRevealed,
        stat_dimension: quest.domain,
        stat_change: gain,
        new_compass: newCompass,
        new_currencies: newCurrencies,
        guide_completion_text: quest.narrative_completion,
        bonus_applied: bonusApplied,
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

// Fire-and-forget reflection scoring via LLM
async function scoreReflection(
  userId: string,
  completionId: string,
  reflectionText: string,
  currentFragments: number,
): Promise<void> {
  try {
    const llmResponse = await callLLM("reflection_scoring", {
      systemPrompt: `Score this quest reflection for depth and insight on a scale of 0.0 to 1.0.
Return JSON only: {"score": <number>, "reason": "<brief reason>"}
Scoring guide:
- 0.0-0.2: Surface level, minimal engagement ("I did it", "It was fine")
- 0.3-0.5: Some awareness, describes experience but no insight
- 0.6-0.8: Genuine reflection, connects to patterns or feelings
- 0.9-1.0: Deep insight, vulnerability, meaningful realization`,
      messages: [{ role: "user", content: reflectionText }],
      maxTokens: 100,
      temperature: 0.3,
    });

    const parsed = JSON.parse(llmResponse.content);
    const score = Math.max(0, Math.min(1, Number(parsed.score) || 0));

    // Update completion with reflection score
    await supabaseAdmin
      .from("quest_completions")
      .update({ reflection_depth_score: score })
      .eq("id", completionId);

    // Grant bonus fragments for deep reflections (score >= 0.6)
    if (score >= 0.6) {
      const bonus = Math.round(score * 15); // up to 15 bonus fragments
      const newBalance = currentFragments + bonus;
      await supabaseAdmin
        .from("user_currencies")
        .update({ fragments: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      await supabaseAdmin.from("currency_transactions").insert({
        user_id: userId,
        currency: "fragments",
        amount: bonus,
        balance_after: newBalance,
        reason: "reflection_bonus",
        reference_id: completionId,
      });
    }

    // Log LLM cost
    logLLMCost(supabaseAdmin, userId, "reflection_scoring", llmResponse);
  } catch (err) {
    console.error("Reflection scoring failed:", err);
  }
}
