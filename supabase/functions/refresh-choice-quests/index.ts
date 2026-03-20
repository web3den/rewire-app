// WP6 Part B: Edge Function - Refresh Choice Quest Options
// Trigger: User taps "Shuffle" button on Choice slot
// Cost: 1 free per day, then 1 Spark per refresh
// Returns: New quest options or error (e.g., "Insufficient Sparks")

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface RefreshChoiceQuestsRequest {
  user_id: string;
}

interface RefreshChoiceQuestsResponse {
  success: boolean;
  sparks_cost: number;
  sparks_available?: number;
  new_options?: { id: string; title: string; domain: string; tier: string }[];
  message?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Validate method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request
  let body: RefreshChoiceQuestsRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { user_id } = body;
  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "Missing required field: user_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const response: RefreshChoiceQuestsResponse = { success: false, sparks_cost: 0 };

    // ───────────────────────────────────────────────────────────
    // 1. Count refreshes today
    // ───────────────────────────────────────────────────────────
    const { data: refreshLog, error: refreshLogError } = await supabase
      .from("quest_refresh_log")
      .select("refresh_count_after")
      .eq("user_id", user_id)
      .eq("refresh_date", today)
      .maybeSingle();

    if (refreshLogError && refreshLogError.code !== "PGRST116") {
      // PGRST116 = no rows, which is OK
      console.error("Error checking refresh log:", refreshLogError);
      throw refreshLogError;
    }

    const refreshCount = refreshLog?.refresh_count_after || 0;
    const cost = refreshCount === 0 ? 0 : 1; // 1st free, rest cost 1 Spark

    response.sparks_cost = cost;

    // ───────────────────────────────────────────────────────────
    // 2. Check Spark balance if cost > 0
    // ───────────────────────────────────────────────────────────
    if (cost > 0) {
      const { data: sparks, error: sparksError } = await supabase
        .from("user_sparks")
        .select("sparks")
        .eq("user_id", user_id)
        .single();

      if (sparksError) {
        console.error("Error checking spark balance:", sparksError);
        throw sparksError;
      }

      const availableSparks = sparks?.sparks || 0;
      response.sparks_available = availableSparks;

      if (availableSparks < cost) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Insufficient Sparks to refresh",
            sparks_cost: cost,
            sparks_available: availableSparks,
          }),
          {
            status: 402, // Payment Required
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // ───────────────────────────────────────────────────────────
      // 3. Deduct Spark
      // ───────────────────────────────────────────────────────────
      const newSparks = availableSparks - cost;

      const { error: updateSparksError } = await supabase
        .from("user_sparks")
        .update({
          sparks: newSparks,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (updateSparksError) {
        console.error("Error deducting sparks:", updateSparksError);
        throw updateSparksError;
      }

      // Log transaction
      const { error: txError } = await supabase
        .from("currency_transactions")
        .insert({
          user_id,
          currency: "sparks",
          amount: -cost,
          balance_after: newSparks,
          reason: "refresh_choice_quests",
        });

      if (txError) {
        console.error("Error logging transaction:", txError);
        // Non-fatal; continue
      }
    }

    // ───────────────────────────────────────────────────────────
    // 4. Get current Choice assignments and mark as expired
    // ───────────────────────────────────────────────────────────
    const { data: oldChoices, error: fetchOldError } = await supabase
      .from("quest_assignments")
      .select("quest_id")
      .eq("user_id", user_id)
      .eq("slot_type", "choice")
      .eq("assigned_date", today)
      .eq("status", "active");

    if (fetchOldError) {
      console.error("Error fetching old choice assignments:", fetchOldError);
      throw fetchOldError;
    }

    // Track refresh-away for anti-cherry-pick (will be updated after refresh)
    const unselectedDomains = new Set<string>();
    if (oldChoices && oldChoices.length > 0) {
      // Get domain of each unselected quest
      const oldQuestIds = oldChoices.map((c) => c.quest_id);
      const { data: oldQuests } = await supabase
        .from("quests")
        .select("domain")
        .in("id", oldQuestIds);

      if (oldQuests) {
        oldQuests.forEach((q) => {
          if (q.domain) unselectedDomains.add(q.domain);
        });
      }
    }

    // Mark old assignments as expired
    const { error: expireError } = await supabase
      .from("quest_assignments")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .eq("slot_type", "choice")
      .eq("assigned_date", today)
      .eq("status", "active");

    if (expireError) {
      console.error("Error expiring old choice assignments:", expireError);
      throw expireError;
    }

    // ───────────────────────────────────────────────────────────
    // 5. Generate new Choice options
    // ───────────────────────────────────────────────────────────
    const { data: choiceResult, error: choiceError } = await supabase.rpc(
      "generate_choice_options",
      {
        p_user_id: user_id,
        p_today: today,
      }
    );

    if (choiceError) {
      console.error("Error generating choice options:", choiceError);
      throw choiceError;
    }

    if (!choiceResult || choiceResult.length === 0 || !choiceResult[0].option_1) {
      throw new Error("Failed to generate new choice options");
    }

    const newOptions = choiceResult[0];
    const newQuestIds = [
      newOptions.option_1,
      newOptions.option_2,
      newOptions.option_3,
    ].filter((id: string) => id !== null);

    // ───────────────────────────────────────────────────────────
    // 6. Insert new Choice assignments
    // ───────────────────────────────────────────────────────────
    const choiceAssignments = newQuestIds.map((quest_id: string) => ({
      user_id,
      quest_id,
      slot_type: "choice",
      assigned_date: today,
      expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    }));

    const { error: insertChoiceError } = await supabase
      .from("quest_assignments")
      .insert(choiceAssignments);

    if (insertChoiceError) {
      console.error("Error inserting new choice assignments:", insertChoiceError);
      throw insertChoiceError;
    }

    // ───────────────────────────────────────────────────────────
    // 7. Update refresh log
    // ───────────────────────────────────────────────────────────
    if (refreshLog) {
      const { error: updateLogError } = await supabase
        .from("quest_refresh_log")
        .update({
          refresh_count_after: refreshCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id)
        .eq("refresh_date", today);

      if (updateLogError) {
        console.error("Error updating refresh log:", updateLogError);
        // Non-fatal; continue
      }
    } else {
      const { error: insertLogError } = await supabase
        .from("quest_refresh_log")
        .insert({
          user_id,
          refresh_date: today,
          refresh_count_after: 1,
        });

      if (insertLogError) {
        console.error("Error inserting refresh log:", insertLogError);
        // Non-fatal; continue
      }
    }

    // ───────────────────────────────────────────────────────────
    // 8. Track refresh-away for anti-cherry-pick
    // ───────────────────────────────────────────────────────────
    for (const domain of unselectedDomains) {
      const { data: existing } = await supabase
        .from("refresh_away_tracking")
        .select("refresh_count, reset_at")
        .eq("user_id", user_id)
        .eq("domain", domain)
        .maybeSingle();

      if (existing) {
        // Check if reset window expired
        const resetAt = new Date(existing.reset_at);
        const now = new Date();

        if (now > resetAt) {
          // Reset counter
          await supabase
            .from("refresh_away_tracking")
            .update({
              refresh_count: 1,
              reset_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              last_refresh: now.toISOString(),
            })
            .eq("user_id", user_id)
            .eq("domain", domain);
        } else {
          // Increment counter
          await supabase
            .from("refresh_away_tracking")
            .update({
              refresh_count: existing.refresh_count + 1,
              last_refresh: now.toISOString(),
            })
            .eq("user_id", user_id)
            .eq("domain", domain);
        }
      } else {
        // Create new tracking entry
        await supabase.from("refresh_away_tracking").insert({
          user_id,
          domain,
          refresh_count: 1,
          last_refresh: new Date().toISOString(),
          reset_at: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // ───────────────────────────────────────────────────────────
    // 9. Fetch full quest details and return
    // ───────────────────────────────────────────────────────────
    const { data: newQuests } = await supabase
      .from("quests")
      .select("id, title, domain, tier, description")
      .in("id", newQuestIds);

    response.new_options = newQuests;
    response.success = true;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in refresh-choice-quests:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, sparks_cost: 0 }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
