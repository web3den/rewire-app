// ============================================================
// Weekly Quest Generation (Background Job)
// Triggered by pg_cron every Sunday at 22:00 UTC
//
// Batch generates personalized quests for eligible users via LLM.
// Fallback: assigns from handcrafted quest pool if LLM fails.
//
// Eligible users: active >= 14 days, not in rest mode, not deleted,
// archetype assigned.
// Processes in batches of 50 to avoid edge function timeout.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { callLLM } from "../_shared/llm-client.ts";
import { validateQuestSchema, passSafetyFilter, hasEmotionalFlag } from "../_shared/quest-validator.ts";

serve(async (req: Request) => {
  try {
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceKey ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Step 1: Find eligible users
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: users, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, archetype, depth_preference, is_minor, timezone")
      .lte("created_at", fourteenDaysAgo)
      .eq("rest_mode", false)
      .is("deleted_at", null)
      .not("archetype", "is", null);

    if (error || !users) {
      console.error("Failed to fetch eligible users:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), { status: 500 });
    }

    console.log(`[weekly-quest-gen] Processing ${users.length} eligible users`);

    // Step 2: Process in batches of 50
    const batchSize = 50;
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (user) => {
          try {
            // TODO: Gather full quest generation context:
            // - User stats, archetype, recent completions, skip patterns
            // - Reflection themes, avoidance domains, safety flags

            // TODO: Call LLM with QUEST_GENERATION_PROMPT

            // TODO: Validate + safety filter each generated quest

            // TODO: Flag quests with emotional content for review

            // TODO: Insert approved quests into quests table

            // TODO: Backfill from handcrafted pool if < 2 quests generated

            // TODO: Log LLM cost

            processed++;
          } catch (err) {
            console.error(`Quest gen failed for user ${user.id}:`, err);
            // Fallback: assign handcrafted quests
            // TODO: await backfillFromHandcrafted(user.id, 3);
            failed++;
          }
        }),
      );
    }

    return new Response(
      JSON.stringify({ processed, failed, total: users.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("weekly-quest-gen error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
