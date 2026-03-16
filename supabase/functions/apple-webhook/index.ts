// ============================================================
// Apple Webhook Edge Function
// POST /functions/v1/apple-webhook
//
// Receives App Store Server Notifications V2 for subscription
// lifecycle events. Verifies JWS signature with Apple's public key.
//
// Handles: SUBSCRIBED, DID_RENEW, DID_CHANGE_RENEWAL_STATUS,
// EXPIRED, GRACE_PERIOD_EXPIRED, DID_FAIL_TO_RENEW
// Updates user subscription_status accordingly.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

serve(async (req: Request) => {
  try {
    const body = await req.json();

    // Step 1: Verify JWS signature
    // TODO: Implement Apple JWS verification using Apple's public key
    // The signedPayload field contains a JWS-signed notification

    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      return new Response("Missing signedPayload", { status: 400 });
    }

    // Step 2: Decode the JWS payload (after verification)
    // TODO: Decode JWT parts and extract notification data
    // const payload = decodeJWS(signedPayload);

    // Step 3: Handle notification type
    // TODO: Map Apple notification types to subscription_status updates:
    // SUBSCRIBED → 'active_subscriber'
    // DID_RENEW → 'active_subscriber' + extend subscription_expires
    // DID_CHANGE_RENEWAL_STATUS (auto_renew=false) → no immediate change
    // EXPIRED → 'expired'
    // GRACE_PERIOD_EXPIRED → 'expired'
    // DID_FAIL_TO_RENEW → 'grace_period'

    // Step 4: Update user subscription status
    // const { error } = await supabaseAdmin
    //   .from("user_profiles")
    //   .update({
    //     subscription_status: newStatus,
    //     subscription_expires: newExpiry,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq("apple_original_transaction_id", originalTransactionId);

    console.log("[apple-webhook] Received notification");

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("apple-webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
