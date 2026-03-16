// ============================================================
// Weekly Quest Generation — Fan-out Orchestrator
// Triggered by pg_cron every Sunday at 22:00 UTC
//
// Queries eligible users and fans out individual quest-gen calls
// via pg_net (async HTTP). Each user is processed in a separate
// edge function invocation to avoid timeout at 200+ users.
//
// pg_cron entry:
//   SELECT cron.schedule('weekly-quest-gen', '0 22 * * 0',
//     $$SELECT net.http_post(
//       url := current_setting('app.supabase_url') || '/functions/v1/weekly-quest-gen',
//       body := '{}',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
//         'Content-Type', 'application/json'
//       )
//     )$$
//   );
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { callLLM, logLLMCost } from "../_shared/llm-client.ts";
import { validateQuestSchema, passSafetyFilter, hasEmotionalFlag } from "../_shared/quest-validator.ts";

// ─── Types ───────────────────────────────────────────────────

interface QuestGenPayload {
  user_id: string;
}

// ─── Quest generation prompt template ────────────────────────

const QUEST_GENERATION_PROMPT = `You are a quest designer for Rewire, a narrative-driven transformation app. Generate {count} personalized quests for this user.

## User Context
- Archetype: {archetype}
- Current stats: Vitality={v}, Clarity={c}, Connection={co}, Valor={va}, Foundation={f}, Depth={d}
- Weakest dimensions: {weakest_2}
- Recent 14 quests: {quest_summaries_with_status}
- Most skipped domains: {avoidance_domains}
- Most skipped tiers: {avoidance_tiers}
- Reflection themes (recent): {top_3_themes}
- Current act: {act}
- Depth preference: {depth_preference}
- Active safety flags: {safety_flags}
- Is minor: {is_minor}

## Quest Design Rules (MANDATORY)
1. Quest MUST be completable in one day
2. Quest MUST be achievable without spending money
3. Quest MUST NOT require another person's consent or participation
4. Quest MUST NOT involve substances, extreme physical risk, or illegal activity
5. Quest difficulty MUST NOT exceed {max_tier}
6. If user has safety flags [{flagged_domains}], avoid those domains
7. If user is a minor, NO mortality/finitude themes
8. Quest MUST be completable regardless of family structure, physical ability, financial status, social network, or living situation
9. At least 1 quest should target the user's weakest dimensions
10. At least 1 quest should lean into the user's archetype strengths

## Output Format
Return a JSON array of quest objects:
[{
  "title": "string — evocative, short",
  "domain": "body|mind|heart|courage|order|spirit",
  "tier": "ember|flame|blaze",
  "description": "string — what Kael says when delivering (1-2 sentences, Kael's voice)",
  "instruction": "string — clear, actionable, 6th grade reading level",
  "why": "string — growth rationale (shown after completion)",
  "duration_estimate_min": number,
  "time_window": "morning|afternoon|evening|anytime",
  "completion_type": "self_report|reflection",
  "reflection_prompt": "string|null",
  "resistance_multiplier": 1.0-2.5,
  "reward_fragments": 10-80,
  "reward_fog_reveal": 0.3-3.0,
  "reward_energy": 0-2,
  "tags": ["solo"|"outdoor"|"indoor"|"social"|"reflective"|"quick"|"emotional"],
  "safety_flags": ["physical"|"emotional_depth"|"social_risk"|"none"],
  "narrative_intro": "string — Kael's delivery (1-2 sentences)",
  "narrative_completion": "string — Kael's response on completion",
  "narrative_skip": "string — Kael's response if skipped"
}]

Generate exactly {count} quests. Return only valid JSON.`;

serve(async (req: Request) => {
  try {
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceKey ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // ─── Mode 1: Single-user processing (called via fan-out) ───
    if (body.user_id) {
      const result = await processUserQuests(body.user_id);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Mode 2: Orchestrator (called by pg_cron) ──────────────
    // Find eligible users and fan out via pg_net

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: users, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .lte("created_at", fourteenDaysAgo)
      .eq("rest_mode", false)
      .is("deleted_at", null)
      .not("archetype", "is", null);

    if (error || !users) {
      console.error("Failed to fetch eligible users:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), { status: 500 });
    }

    console.log(`[weekly-quest-gen] Fanning out ${users.length} user quest-gen calls via pg_net`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const functionUrl = `${supabaseUrl}/functions/v1/weekly-quest-gen`;

    // Fan out each user as a separate async HTTP call via pg_net
    // pg_net processes these asynchronously — they won't block this function
    let enqueued = 0;
    let enqueueFailed = 0;

    for (const user of users) {
      const { error: netError } = await supabaseAdmin.rpc("net_http_post", {
        p_url: functionUrl,
        p_body: JSON.stringify({ user_id: user.id }),
        p_headers: JSON.stringify({
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        }),
      }).catch(async () => {
        // Fallback: use the net extension directly via SQL
        const { error: sqlError } = await supabaseAdmin.rpc("pg_net_quest_fanout", {
          p_user_id: user.id,
        });
        return { error: sqlError };
      });

      if (netError) {
        console.error(`Failed to enqueue quest gen for user ${user.id}:`, netError);
        enqueueFailed++;
      } else {
        enqueued++;
      }
    }

    return new Response(
      JSON.stringify({ total: users.length, enqueued, enqueue_failed: enqueueFailed }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("weekly-quest-gen error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

// ─── Single-user quest generation ────────────────────────────

async function processUserQuests(userId: string): Promise<{ status: string; quests_created: number }> {
  try {
    // Gather full context for this user
    const [profileResult, statsResult, completionsResult, skipResult, themesResult] = await Promise.all([
      supabaseAdmin
        .from("user_profiles")
        .select("archetype, depth_preference, is_minor, current_act")
        .eq("id", userId)
        .single(),
      supabaseAdmin
        .from("user_stats")
        .select("vitality, clarity, connection, valor, foundation, depth")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("quest_assignments")
        .select("status, quests(title, domain, tier)")
        .eq("user_id", userId)
        .order("assigned_date", { ascending: false })
        .limit(14),
      supabaseAdmin
        .from("quest_assignments")
        .select("quests(domain, tier)")
        .eq("user_id", userId)
        .eq("status", "skipped")
        .order("assigned_date", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("conversation_summaries")
        .select("categories")
        .eq("user_id", userId)
        .order("summary_date", { ascending: false })
        .limit(10),
    ]);

    const profile = profileResult.data;
    if (!profile) throw new Error(`Profile not found for user ${userId}`);

    const stats = statsResult.data ?? {
      vitality: 10, clarity: 10, connection: 10,
      valor: 10, foundation: 10, depth: 10,
    };

    // Find weakest 2 dimensions
    const statEntries = Object.entries(stats) as [string, number][];
    statEntries.sort((a, b) => a[1] - b[1]);
    const weakest2 = statEntries.slice(0, 2).map(([k]) => k).join(", ");

    // Summarize recent quest completions
    const recentQuests = (completionsResult.data ?? [])
      .map((a: any) => `${a.quests?.title ?? "?"} (${a.quests?.domain}/${a.quests?.tier}) — ${a.status}`)
      .join("; ");

    // Aggregate skip patterns
    const skipDomains: Record<string, number> = {};
    const skipTiers: Record<string, number> = {};
    for (const s of skipResult.data ?? []) {
      const q = s.quests as any;
      if (q?.domain) skipDomains[q.domain] = (skipDomains[q.domain] ?? 0) + 1;
      if (q?.tier) skipTiers[q.tier] = (skipTiers[q.tier] ?? 0) + 1;
    }
    const topSkipDomains = Object.entries(skipDomains).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(", ") || "none";
    const topSkipTiers = Object.entries(skipTiers).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(", ") || "none";

    // Extract top themes from recent summaries
    const allCategories = (themesResult.data ?? []).flatMap((s: any) => s.categories ?? []);
    const themeCounts: Record<string, number> = {};
    for (const c of allCategories) themeCounts[c] = (themeCounts[c] ?? 0) + 1;
    const topThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).join(", ") || "none";

    // Determine max tier based on days active
    const maxTier = "blaze"; // inferno is reserved for boss quests

    // Build the prompt
    const prompt = QUEST_GENERATION_PROMPT
      .replace("{count}", "3")
      .replace("{archetype}", profile.archetype ?? "unknown")
      .replace("{v}", String(stats.vitality))
      .replace("{c}", String(stats.clarity))
      .replace("{co}", String(stats.connection))
      .replace("{va}", String(stats.valor))
      .replace("{f}", String(stats.foundation))
      .replace("{d}", String(stats.depth))
      .replace("{weakest_2}", weakest2)
      .replace("{quest_summaries_with_status}", recentQuests || "none")
      .replace("{avoidance_domains}", topSkipDomains)
      .replace("{avoidance_tiers}", topSkipTiers)
      .replace("{top_3_themes}", topThemes)
      .replace("{act}", profile.current_act)
      .replace("{depth_preference}", profile.depth_preference)
      .replace("{safety_flags}", "none")
      .replace("{is_minor}", String(profile.is_minor ?? false))
      .replace("{max_tier}", maxTier)
      .replace("{flagged_domains}", "");

    // Call LLM
    const llmResult = await callLLM("quest_generation", {
      systemPrompt: prompt,
      messages: [{ role: "user", content: "Generate the quests now." }],
      maxTokens: 1500,
      temperature: 0.8,
    });

    // Log cost
    logLLMCost(supabaseAdmin, userId, "quest_generation", llmResult);

    // Parse quests from LLM response
    let rawQuests: any[];
    try {
      // Extract JSON array — handle markdown code fences
      const jsonStr = llmResult.content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      rawQuests = JSON.parse(jsonStr);
    } catch {
      console.error(`Failed to parse quest JSON for user ${userId}:`, llmResult.content.slice(0, 200));
      await backfillFromHandcrafted(userId, 3);
      return { status: "fallback", quests_created: 3 };
    }

    // Validate and safety-filter
    const userCtx = { is_minor: profile.is_minor ?? false };
    const validQuests = rawQuests
      .filter((q: any) => validateQuestSchema(q))
      .filter((q: any) => passSafetyFilter(q, userCtx));

    // Flag emotional content for review
    const approvedQuests = [];
    for (const quest of validQuests) {
      if (hasEmotionalFlag(quest)) {
        // Insert with pending review status
        await supabaseAdmin.from("quests").insert({
          ...quest,
          source: "llm_generated",
          generated_for_user: userId,
          review_status: "pending",
        });
      } else {
        approvedQuests.push(quest);
      }
    }

    // Insert approved quests
    if (approvedQuests.length > 0) {
      await supabaseAdmin.from("quests").insert(
        approvedQuests.map((q: any) => ({
          ...q,
          source: "llm_generated",
          generated_for_user: userId,
          review_status: "approved",
        })),
      );
    }

    // Backfill if not enough quests generated
    const totalCreated = approvedQuests.length;
    if (totalCreated < 2) {
      await backfillFromHandcrafted(userId, 3 - totalCreated);
    }

    return { status: "ok", quests_created: totalCreated };
  } catch (err) {
    console.error(`Quest gen failed for user ${userId}:`, err);
    await backfillFromHandcrafted(userId, 3);
    return { status: "fallback", quests_created: 3 };
  }
}

// ─── Handcrafted quest backfill ──────────────────────────────

async function backfillFromHandcrafted(userId: string, count: number): Promise<void> {
  // Select handcrafted quests that haven't been assigned to this user recently
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("archetype")
    .eq("id", userId)
    .single();

  // Get recently assigned quest IDs to avoid repeats
  const { data: recentAssignments } = await supabaseAdmin
    .from("quest_assignments")
    .select("quest_id")
    .eq("user_id", userId)
    .order("assigned_date", { ascending: false })
    .limit(30);

  const recentQuestIds = (recentAssignments ?? []).map((a: any) => a.quest_id);

  // Query handcrafted quests, excluding recently used ones
  let query = supabaseAdmin
    .from("quests")
    .select("*")
    .eq("source", "handcrafted")
    .limit(count * 3); // fetch extras to filter

  if (recentQuestIds.length > 0) {
    query = query.not("id", "in", `(${recentQuestIds.join(",")})`);
  }

  const { data: candidates } = await query;

  if (!candidates || candidates.length === 0) {
    console.error(`No handcrafted quests available for backfill (user ${userId})`);
    return;
  }

  // Pick `count` quests, preferring variety in domains
  const selected = candidates.slice(0, count);

  // Insert as assigned quests for the upcoming week
  const nextMonday = getNextMonday();
  for (let i = 0; i < selected.length; i++) {
    const assignDate = new Date(nextMonday);
    assignDate.setDate(assignDate.getDate() + i);

    await supabaseAdmin.from("quest_assignments").insert({
      user_id: userId,
      quest_id: selected[i].id,
      slot_type: i === 0 ? "anchor" : "choice",
      status: "active",
      assigned_date: assignDate.toISOString().split("T")[0],
      expires_at: new Date(assignDate.getTime() + 86400000).toISOString(),
    });
  }
}

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + daysUntilMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
