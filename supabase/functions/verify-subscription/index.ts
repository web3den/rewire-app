// ============================================================
// Verify Subscription Edge Function
// POST /functions/v1/verify-subscription
//
// Client sends StoreKit 2 transaction info after purchase.
// Server verifies with Apple App Store Server API and updates
// subscription status.
//
// Apple verification is mocked for now — will be wired up when
// App Store Connect credentials are configured.
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

interface AppleVerificationResult {
  valid: boolean;
  status: SubscriptionStatus;
  expires_at: string;
  product_id: string;
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

    // Step 1: Verify transaction with Apple App Store Server API
    const verification = await verifyWithApple(body.original_transaction_id, body.product_id);

    if (!verification.valid) {
      console.error("[verify-subscription] Apple verification failed for transaction:", body.original_transaction_id);
      return new Response(
        JSON.stringify({ error: "Subscription verification failed" }),
        { status: 400 },
      );
    }

    // Step 2: Update user subscription status
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        subscription_status: verification.status,
        subscription_expires: verification.expires_at,
        apple_original_transaction_id: body.original_transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("[verify-subscription] Profile update error:", profileError);
      return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 });
    }

    // Step 3: Grant subscriber energy if active
    if (verification.status === "active_subscriber") {
      await supabaseAdmin
        .from("user_currencies")
        .update({ energy: 999, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    // Step 4: Log the transaction
    try {
      await supabaseAdmin.from("currency_transactions").insert({
        user_id: userId,
        currency_type: "energy",
        amount: 999,
        reason: "subscription_activated",
        metadata: {
          original_transaction_id: body.original_transaction_id,
          product_id: body.product_id,
          verification_status: verification.status,
        },
      });
    } catch (logErr) {
      console.error("[verify-subscription] Transaction log error:", logErr);
    }

    console.log(`[verify-subscription] User ${userId} → ${verification.status}, expires ${verification.expires_at}`);

    const response: ApiResponse<VerifySubscriptionResponse> = {
      data: {
        subscription_status: verification.status,
        expires_at: verification.expires_at,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[verify-subscription] error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

// Verify transaction with Apple App Store Server API
// Currently a mock — returns success with 30-day expiry.
// TODO: Implement real verification when App Store Connect credentials are ready:
// 1. Generate JWT with Apple P8 key (same as APNs signing)
// 2. GET https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transactionId}
// 3. Parse signed transaction info for expiry and status
async function verifyWithApple(
  originalTransactionId: string,
  productId: string,
): Promise<AppleVerificationResult> {
  const appleKeyId = Deno.env.get("APPLE_KEY_ID");
  const appleIssuerId = Deno.env.get("APPLE_ISSUER_ID");

  if (appleKeyId && appleIssuerId) {
    // TODO: Real Apple Server API verification
    // const jwt = await generateStoreKitJWT(appleKeyId, appleIssuerId);
    // const res = await fetch(
    //   `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${originalTransactionId}`,
    //   { headers: { Authorization: `Bearer ${jwt}` } }
    // );
    // const data = await res.json();
    // ... parse signedTransactionInfo, extract expiresDate, status
    console.log(`[verify-subscription] Apple API keys present but real verification not yet implemented`);
  }

  // Mock: treat all transactions as valid with 30-day subscription
  console.log(`[verify-subscription] Mock verification for ${originalTransactionId} (${productId})`);

  return {
    valid: true,
    status: "active_subscriber",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    product_id: productId,
  };
}
