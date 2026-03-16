// ============================================================
// Supabase Admin Client (service role — bypasses RLS)
// Used by edge functions for server-side operations
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create a client scoped to the authenticated user (for RLS-respecting queries)
export function createUserClient(authHeader: string) {
  return createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}

// Extract user ID from the JWT in the Authorization header
export async function getUserId(authHeader: string): Promise<string | null> {
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
