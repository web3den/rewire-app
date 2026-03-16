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
import { archetypeToPrimaryDomain } from "../_shared/stat-engine.ts";
import type { ApiResponse, QuestAssignment, WeeklyCycleStatus, QuestDomain, Archetype } from "../_shared/types.ts";

interface DailyQuestsResponse {
  assignments: QuestAssignment[];
  weekly_status: WeeklyCycleStatus;
  today: string;
}

// Secondary domain mapping per archetype
const ARCHETYPE_SECONDARY: Record<string, QuestDomain> = {
  the_flame: "courage",
  the_lens: "spirit",
  the_bridge: "courage",
  the_edge: "body",
  the_anchor: "body",
  the_well: "heart",
};

const ALL_DOMAINS: QuestDomain[] = ["body", "mind", "heart", "courage", "order", "spirit"];

// Get today's date string in user's timezone
function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
    return formatter.format(now); // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// Get Monday-Sunday week bounds for a date string
function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    weekStart: monday.toISOString().split("T")[0],
    weekEnd: sunday.toISOString().split("T")[0],
  };
}

// Pick a domain using archetype weights: 35% primary, 25% secondary, 40% spread
function pickWeightedDomain(archetype: Archetype | null, exclude: QuestDomain[] = []): QuestDomain {
  const available = ALL_DOMAINS.filter((d) => !exclude.includes(d));
  if (available.length === 0) return ALL_DOMAINS[Math.floor(Math.random() * ALL_DOMAINS.length)];
  if (!archetype) return available[Math.floor(Math.random() * available.length)];

  const primary = archetypeToPrimaryDomain(archetype);
  const secondary = ARCHETYPE_SECONDARY[archetype] ?? primary;

  const pool: { domain: QuestDomain; weight: number }[] = [];
  for (const d of available) {
    if (d === primary) pool.push({ domain: d, weight: 35 });
    else if (d === secondary) pool.push({ domain: d, weight: 25 });
    else pool.push({ domain: d, weight: 10 });
  }

  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const p of pool) {
    roll -= p.weight;
    if (roll <= 0) return p.domain;
  }
  return pool[pool.length - 1].domain;
}

// Format a DB row into a QuestAssignment
function formatAssignment(row: any): QuestAssignment {
  const quest = row.quests;
  return {
    id: row.id,
    quest: {
      id: quest.id,
      title: quest.title,
      domain: quest.domain,
      tier: quest.tier,
      description: quest.description,
      instruction: quest.instruction,
      duration_estimate_min: quest.duration_estimate_min,
      time_window: quest.time_window,
      completion_type: quest.completion_type,
      reflection_prompt: quest.reflection_prompt,
      tags: quest.tags ?? [],
      narrative_intro: quest.narrative_intro,
      narrative_completion: quest.narrative_completion,
      narrative_skip: quest.narrative_skip,
    },
    slot_type: row.slot_type,
    status: row.status,
    choice_options: row._choice_quests ?? undefined,
    assigned_date: row.assigned_date,
    expires_at: row.expires_at,
  };
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

    // Fetch user profile for timezone and archetype
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("archetype, timezone, subscription_status, depth_preference")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const today = getTodayInTimezone(profile.timezone ?? "UTC");
    const isSubscriber = ["active_subscriber", "grace_period"].includes(profile.subscription_status);

    // Step 3: Check for existing assignments today
    const { data: existingAssignments } = await supabaseAdmin
      .from("quest_assignments")
      .select("*, quests(*)")
      .eq("user_id", userId)
      .eq("assigned_date", today);

    if (existingAssignments && existingAssignments.length > 0) {
      // Enrich choice slots with their option quests
      const assignments: QuestAssignment[] = [];
      for (const row of existingAssignments) {
        const formatted = formatAssignment(row);
        if (row.slot_type === "choice" && row.choice_options?.length > 0) {
          const { data: choiceQuests } = await supabaseAdmin
            .from("quests")
            .select("*")
            .in("id", row.choice_options);
          formatted.choice_options = (choiceQuests ?? []).map((q: any) => ({
            id: q.id, title: q.title, domain: q.domain, tier: q.tier,
            description: q.description, instruction: q.instruction,
            duration_estimate_min: q.duration_estimate_min, time_window: q.time_window,
            completion_type: q.completion_type, reflection_prompt: q.reflection_prompt,
            tags: q.tags ?? [], narrative_intro: q.narrative_intro,
            narrative_completion: q.narrative_completion, narrative_skip: q.narrative_skip,
          }));
        }
        assignments.push(formatted);
      }

      const weeklyStatus = await getOrCreateWeeklyCycle(userId, today);
      const response: ApiResponse<DailyQuestsResponse> = {
        data: { assignments, weekly_status: weeklyStatus, today },
      };
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Generate new assignments for today

    // Get recent quest IDs to avoid repeats (last 14 days)
    const { data: recentAssignments } = await supabaseAdmin
      .from("quest_assignments")
      .select("quest_id")
      .eq("user_id", userId)
      .gte("assigned_date", new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0]);

    const recentQuestIds = (recentAssignments ?? []).map((a) => a.quest_id);

    // End-of-day expiry in user's timezone
    const expiresAt = new Date(today + "T23:59:59Z").toISOString();

    const archetype = profile.archetype as Archetype | null;

    // --- ANCHOR: System-chosen from primary domain ---
    const anchorDomain = archetype ? archetypeToPrimaryDomain(archetype) : pickWeightedDomain(null);
    const anchorQuest = await pickQuest(anchorDomain, ["ember", "flame"], recentQuestIds, userId, profile.depth_preference);

    // --- CHOICE: 3 options from varied domains (subscriber only) ---
    let choiceQuest: any = null;
    let choiceOptionIds: string[] = [];
    if (isSubscriber) {
      const choiceDomains: QuestDomain[] = [];
      for (let i = 0; i < 3; i++) {
        choiceDomains.push(pickWeightedDomain(archetype, choiceDomains));
      }
      const choiceQuests = [];
      for (const domain of choiceDomains) {
        const q = await pickQuest(domain, ["ember", "flame", "blaze"], recentQuestIds, userId, profile.depth_preference);
        if (q) choiceQuests.push(q);
      }
      if (choiceQuests.length > 0) {
        choiceQuest = choiceQuests[0]; // Default selection is first option
        choiceOptionIds = choiceQuests.map((q) => q.id);
      }
    }

    // --- EMBER: Quick easy quest from a growth-edge domain ---
    // Pick from a domain that's NOT the anchor domain for variety
    const emberDomain = pickWeightedDomain(archetype, [anchorDomain]);
    const emberQuest = await pickQuest(emberDomain, ["ember"], recentQuestIds, userId, profile.depth_preference);

    // Create assignment records
    const assignments: QuestAssignment[] = [];

    if (anchorQuest) {
      const { data: anchorRow } = await supabaseAdmin
        .from("quest_assignments")
        .insert({
          user_id: userId,
          quest_id: anchorQuest.id,
          slot_type: "anchor",
          assigned_date: today,
          expires_at: expiresAt,
        })
        .select("*, quests(*)")
        .single();
      if (anchorRow) assignments.push(formatAssignment(anchorRow));
    }

    if (isSubscriber && choiceQuest && choiceOptionIds.length > 0) {
      const { data: choiceRow } = await supabaseAdmin
        .from("quest_assignments")
        .insert({
          user_id: userId,
          quest_id: choiceQuest.id,
          slot_type: "choice",
          choice_options: choiceOptionIds,
          assigned_date: today,
          expires_at: expiresAt,
        })
        .select("*, quests(*)")
        .single();
      if (choiceRow) {
        const formatted = formatAssignment(choiceRow);
        // Attach full choice quest objects
        const { data: choiceQuestsFull } = await supabaseAdmin
          .from("quests")
          .select("*")
          .in("id", choiceOptionIds);
        formatted.choice_options = (choiceQuestsFull ?? []).map((q: any) => ({
          id: q.id, title: q.title, domain: q.domain, tier: q.tier,
          description: q.description, instruction: q.instruction,
          duration_estimate_min: q.duration_estimate_min, time_window: q.time_window,
          completion_type: q.completion_type, reflection_prompt: q.reflection_prompt,
          tags: q.tags ?? [], narrative_intro: q.narrative_intro,
          narrative_completion: q.narrative_completion, narrative_skip: q.narrative_skip,
        }));
        assignments.push(formatted);
      }
    }

    if (emberQuest) {
      const { data: emberRow } = await supabaseAdmin
        .from("quest_assignments")
        .insert({
          user_id: userId,
          quest_id: emberQuest.id,
          slot_type: "ember",
          assigned_date: today,
          expires_at: expiresAt,
        })
        .select("*, quests(*)")
        .single();
      if (emberRow) assignments.push(formatAssignment(emberRow));
    }

    // Step 5: Get weekly cycle status
    const weeklyStatus = await getOrCreateWeeklyCycle(userId, today);

    const response: ApiResponse<DailyQuestsResponse> = {
      data: { assignments, weekly_status: weeklyStatus, today },
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-daily-quests error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

// Pick a quest from the library matching domain/tier, avoiding recent repeats
async function pickQuest(
  domain: QuestDomain,
  tiers: string[],
  excludeIds: string[],
  userId: string,
  depthPreference: string,
): Promise<any | null> {
  let query = supabaseAdmin
    .from("quests")
    .select("*")
    .eq("domain", domain)
    .in("tier", tiers)
    .eq("is_active", true)
    .eq("review_status", "approved");

  // Include handcrafted quests + user-specific LLM quests
  query = query.or(`generated_for_user.is.null,generated_for_user.eq.${userId}`);

  // Filter by depth preference safety
  if (depthPreference === "light") {
    query = query.eq("safety_flags", "{}");
  }

  const { data: candidates } = await query.limit(50);

  if (!candidates || candidates.length === 0) return null;

  // Filter out recently assigned quests
  const filtered = candidates.filter((q) => !excludeIds.includes(q.id));
  const pool = filtered.length > 0 ? filtered : candidates;

  // Random selection from pool
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get or create weekly cycle record
async function getOrCreateWeeklyCycle(userId: string, today: string): Promise<WeeklyCycleStatus> {
  const { weekStart, weekEnd } = getWeekBounds(today);

  const { data: existing } = await supabaseAdmin
    .from("weekly_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  if (existing) {
    const daysRemaining = Math.max(0, Math.ceil(
      (new Date(weekEnd + "T23:59:59Z").getTime() - Date.now()) / 86400000,
    ));
    return {
      week_start: existing.week_start,
      week_end: existing.week_end,
      anchor_completed: existing.anchor_completed,
      choice_completed: existing.choice_completed,
      ember_completed: existing.ember_completed,
      full_cycle_achieved: existing.full_cycle_achieved,
      perfect_cycle: existing.perfect_cycle,
      days_remaining: daysRemaining,
    };
  }

  // Create new weekly cycle
  const { data: created } = await supabaseAdmin
    .from("weekly_cycles")
    .insert({
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
    })
    .select()
    .single();

  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(weekEnd + "T23:59:59Z").getTime() - Date.now()) / 86400000,
  ));

  return {
    week_start: weekStart,
    week_end: weekEnd,
    anchor_completed: 0,
    choice_completed: 0,
    ember_completed: 0,
    full_cycle_achieved: false,
    perfect_cycle: false,
    days_remaining: daysRemaining,
  };
}
