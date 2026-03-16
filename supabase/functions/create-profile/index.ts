// ============================================================
// Create Profile Edge Function
// POST /functions/v1/create-profile
//
// Creates user profile after onboarding completes.
// Validates age >= 16. Initializes stats, currencies, fog map,
// season progress via the initialize_user_data trigger.
// Stores The Question as first memory fact.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, getUserId } from "../_shared/supabase-admin.ts";
import type { ApiResponse, UserProfile, DepthPreference } from "../_shared/types.ts";

interface CreateProfileRequest {
  display_name: string;
  date_of_birth: string;        // ISO date YYYY-MM-DD
  the_question_answer: string;  // encrypted client-side
  timezone: string;             // IANA timezone
  depth_preference?: DepthPreference;
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

    const body: CreateProfileRequest = await req.json();

    // Validate required fields
    if (!body.display_name || !body.date_of_birth || !body.the_question_answer || !body.timezone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    // Validate age >= 16
    const dob = new Date(body.date_of_birth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 16) {
      return new Response(
        JSON.stringify({ error: "Must be at least 16 years old" }),
        { status: 403 },
      );
    }

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Profile already exists" }),
        { status: 409 },
      );
    }

    // Create profile (triggers initialize_user_data for stats, currencies, fog map, etc.)
    const { data: profile, error } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: userId,
        display_name: body.display_name,
        date_of_birth: body.date_of_birth,
        the_question_answer: body.the_question_answer,
        timezone: body.timezone,
        depth_preference: body.depth_preference ?? "moderate",
        onboarding_completed: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Profile creation error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create profile" }),
        { status: 500 },
      );
    }

    const response: ApiResponse<UserProfile> = {
      data: {
        id: profile.id,
        display_name: profile.display_name,
        depth_preference: profile.depth_preference,
        rest_mode: profile.rest_mode,
        timezone: profile.timezone,
        subscription_status: profile.subscription_status,
        prologue_days_remaining: 7,
        archetype: null,
        current_act: profile.current_act,
        onboarding_completed: profile.onboarding_completed,
        created_at: profile.created_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-profile error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
