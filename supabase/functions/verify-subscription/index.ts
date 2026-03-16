// ============================================================
// Verify Subscription Edge Function
// POST /functions/v1/verify-subscription
//
// Client sends StoreKit 2 transaction info after purchase.
// Server verifies with Apple and updates subscription status.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin, getUserId } from "../_shared/supabase-admin.ts";
import type { ApiResponse, SubscriptionStatus } from "../_shared/types.ts";

interface VerifySubscriptionRequest {
  original_transaction_id: string;
  product_id: string;
}

interface VerifySubscriptionResponse {
  subscription_status: SubscriptionStatus;
  expires_at: string;
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

    const body: VerifySubscriptionRequest = await req.json();

    if (!body.original_transaction_id || !body.product_id) {
      return new Response(
        JSON.stringify({ error: "Missing transaction info" }),
        { status: 400 },
      );
    }

    // Step 1: Verify transaction with Apple
    // TODO: Use App Store Server API to verify the transaction
    // GET https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transactionId}
    // Requires JWT signed with Apple P8 key

    // Step 2: Determine subscription expiry
    // TODO: Parse Apple response for expiry date and product details

    // Step 3: Update user subscription status
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // placeholder: 30 days

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        subscription_status: "active_subscriber" as SubscriptionStatus,
        subscription_expires: expiresAt,
        apple_original_transaction_id: body.original_transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Subscription update error:", error);
      return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 });
    }

    // Step 4: Upgrade energy to unlimited
    await supabaseAdmin
      .from("user_currencies")
      .update({ energy: 999, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    const response: ApiResponse<VerifySubscriptionResponse> = {
      data: {
        subscription_status: "active_subscriber",
        expires_at: expiresAt,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-subscription error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
