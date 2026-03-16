// ============================================================
// Memory Compression (Background Job)
// Triggered by pg_cron daily at 04:00 UTC
//
// Compresses ended conversation sessions into permanent summaries.
// Flow:
// 1. Find sessions that ended but have no summary
// 2. Fetch full message history for each
// 3. Compress via LLM (MEMORY_COMPRESSION_PROMPT)
// 4. Store summary in conversation_summaries
// 5. Extract and store new memory facts (max 50 per user)
// 6. Evict lowest-importance facts if at limit
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { callLLM } from "../_shared/llm-client.ts";

serve(async (req: Request) => {
  try {
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceKey ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Step 1: Find sessions needing compression
    const { data: sessions, error } = await supabaseAdmin
      .from("conversation_sessions")
      .select("id, user_id")
      .not("ended_at", "is", null)
      .is("summary", null)
      .limit(500);

    if (error || !sessions) {
      console.error("Failed to fetch sessions:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch sessions" }), { status: 500 });
    }

    console.log(`[memory-compress] Processing ${sessions.length} sessions`);

    let compressed = 0;
    let failed = 0;

    for (const session of sessions) {
      try {
        // Step 2: Get full message history
        const { data: messages } = await supabaseAdmin
          .from("conversation_messages")
          .select("role, content, created_at")
          .eq("session_id", session.id)
          .order("created_at");

        if (!messages || messages.length === 0) continue;

        // Step 3: Compress via LLM
        const conversationText = messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");

        const llmResponse = await callLLM("memory_compression", {
          systemPrompt: `Compress this conversation into a concise summary (max 100 tokens).
Focus on: key topics, emotional state, commitments/realizations, behavioral patterns, quest discussion.
Return JSON: {"summary": "<summary>", "category": "realization|introspection|pattern|insight|casual", "new_facts": [{"category": "stated_goal|behavioral_pattern|personal_fact|emotional_theme|relationship_note", "text": "<fact>", "importance": 1-10}]}`,
          messages: [{ role: "user", content: conversationText }],
          maxTokens: 200,
          temperature: 0.3,
        });

        const result = JSON.parse(llmResponse.content);

        // Step 4: Store summary
        await supabaseAdmin.from("conversation_summaries").insert({
          user_id: session.user_id,
          session_id: session.id,
          summary_date: new Date().toISOString().split("T")[0],
          summary_text: result.summary,
          categories: [result.category],
        });

        await supabaseAdmin
          .from("conversation_sessions")
          .update({ summary: result.summary })
          .eq("id", session.id);

        // Step 5: Store new memory facts (enforce max 50)
        if (result.new_facts?.length > 0) {
          const { count } = await supabaseAdmin
            .from("user_memory_facts")
            .select("id", { count: "exact" })
            .eq("user_id", session.user_id);

          // Evict if at limit
          if ((count ?? 0) + result.new_facts.length > 50) {
            const toEvict = (count ?? 0) + result.new_facts.length - 50;
            const { data: evictable } = await supabaseAdmin
              .from("user_memory_facts")
              .select("id")
              .eq("user_id", session.user_id)
              .order("importance", { ascending: true })
              .order("created_at", { ascending: true })
              .limit(toEvict);

            if (evictable) {
              await supabaseAdmin
                .from("user_memory_facts")
                .delete()
                .in("id", evictable.map((f) => f.id));
            }
          }

          await supabaseAdmin.from("user_memory_facts").insert(
            result.new_facts.map((f: { category: string; text: string; importance: number }) => ({
              user_id: session.user_id,
              category: f.category,
              fact_text: f.text,
              importance: f.importance,
              source: "conversation",
            })),
          );
        }

        compressed++;
      } catch (err) {
        console.error(`Compression failed for session ${session.id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ compressed, failed, total: sessions.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("memory-compress error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
