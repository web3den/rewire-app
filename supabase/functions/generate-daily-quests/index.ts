// WP6 Part B: Edge Function - Generate Daily Quests (Anchor + Choice + Ember)
// Trigger: Daily scheduler or first API hit of day
// Returns: Assigned quests for the day or error

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface GenerateDailyQuestsRequest {
  user_id: string;
}

interface DailyQuestsResponse {
  success: boolean;
  anchor?: { id: string; title: string; domain: string; tier: string };
  choice_options?: { id: string; title: string; domain: string }[];
  ember?: { id: string; title: string };
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
  let body: GenerateDailyQuestsRequest;
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
    const response: DailyQuestsResponse = { success: false };

    // ───────────────────────────────────────────────────────────
    // 1. Check if Anchor already assigned today
    // ───────────────────────────────────────────────────────────
    const { data: existingAnchor, error: checkError } = await supabase
      .from("quest_assignments")
      .select("quest_id")
      .eq("user_id", user_id)
      .eq("slot_type", "anchor")
      .eq("assigned_date", today)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing anchor:", checkError);
      throw checkError;
    }

    if (existingAnchor) {
      response.message = "Quests already generated today";
      response.success = true;
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ───────────────────────────────────────────────────────────
    // 2. Select Anchor quest using PL/pgSQL function
    // ───────────────────────────────────────────────────────────
    const { data: anchorResult, error: anchorError } = await supabase.rpc(
      "select_anchor_quest",
      {
        p_user_id: user_id,
        p_today: today,
      }
    );

    if (anchorError) {
      console.error("Error selecting anchor quest:", anchorError);
      throw anchorError;
    }

    if (!anchorResult || anchorResult.length === 0) {
      throw new Error("No suitable anchor quest found");
    }

    // Get highest-scoring quest (or random from top 3)
    const topAnchor =
      anchorResult.length > 0
        ? anchorResult.reduce(
            (prev: any, current: any) =>
              current.score > prev.score ? current : prev
          )
        : anchorResult[0];

    const anchorQuestId = topAnchor.quest_id;

    // Assign Anchor
    const { error: assignAnchorError } = await supabase
      .from("quest_assignments")
      .insert({
        user_id,
        quest_id: anchorQuestId,
        slot_type: "anchor",
        assigned_date: today,
        expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      });

    if (assignAnchorError) {
      console.error("Error assigning anchor quest:", assignAnchorError);
      throw assignAnchorError;
    }

    // Fetch Anchor details
    const { data: anchorData } = await supabase
      .from("quests")
      .select("id, title, domain, tier")
      .eq("id", anchorQuestId)
      .single();

    response.anchor = anchorData;

    // ───────────────────────────────────────────────────────────
    // 3. Check if Choice slot is unlocked
    // ───────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_quest_completed")
      .eq("id", user_id)
      .single();

    if (profile?.first_quest_completed) {
      // Generate Choice options
      const { data: choiceOptions, error: choiceError } = await supabase.rpc(
        "generate_choice_options",
        {
          p_user_id: user_id,
          p_today: today,
        }
      );

      if (choiceError) {
        console.error("Error generating choice options:", choiceError);
        // Don't throw; continue without choice if it fails
      } else if (
        choiceOptions &&
        choiceOptions.length > 0 &&
        choiceOptions[0].option_1
      ) {
        const choiceResult = choiceOptions[0];
        const choiceQuestIds = [
          choiceResult.option_1,
          choiceResult.option_2,
          choiceResult.option_3,
        ].filter((id: string) => id !== null);

        // Assign all 3 Choice options
        const choiceAssignments = choiceQuestIds.map((quest_id: string) => ({
          user_id,
          quest_id,
          slot_type: "choice",
          assigned_date: today,
          expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
          status: "active" as const,
        }));

        const { error: assignChoiceError } = await supabase
          .from("quest_assignments")
          .insert(choiceAssignments);

        if (assignChoiceError) {
          console.error("Error assigning choice quests:", assignChoiceError);
        } else {
          // Fetch Choice details
          const { data: choiceData } = await supabase
            .from("quests")
            .select("id, title, domain, tier")
            .in("id", choiceQuestIds);

          response.choice_options = choiceData;

          // Log choice history for analytics
          await supabase.from("quest_choice_history").insert({
            user_id,
            assignment_date: today,
            option_1_quest_id: choiceQuestIds[0],
            option_2_quest_id: choiceQuestIds[1],
            option_3_quest_id: choiceQuestIds[2],
            refresh_count: 0,
          });
        }
      }
    }

    // ───────────────────────────────────────────────────────────
    // 4. Assign Ember quest (always available quick quest)
    // ───────────────────────────────────────────────────────────
    const { data: emberQuests } = await supabase
      .from("quests")
      .select("id")
      .eq("tier", "ember")
      .order("RANDOM()")
      .limit(1);

    if (emberQuests && emberQuests.length > 0) {
      const emberQuestId = emberQuests[0].id;

      const { error: assignEmberError } = await supabase
        .from("quest_assignments")
        .insert({
          user_id,
          quest_id: emberQuestId,
          slot_type: "ember",
          assigned_date: today,
          expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
        });

      if (assignEmberError) {
        console.error("Error assigning ember quest:", assignEmberError);
      } else {
        const { data: emberData } = await supabase
          .from("quests")
          .select("id, title, domain")
          .eq("id", emberQuestId)
          .single();

        response.ember = emberData;
      }
    }

    response.success = true;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in generate-daily-quests:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
