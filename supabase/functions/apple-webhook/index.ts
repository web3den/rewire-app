// ============================================================
// Apple Webhook Edge Function
// POST /functions/v1/apple-webhook
//
// Receives App Store Server Notifications V2 for subscription
// lifecycle events. The signedPayload is a JWS (JSON Web Signature)
// signed by Apple — verification is mocked for now.
//
// Handles: SUBSCRIBED, DID_RENEW, EXPIRED, DID_FAIL_TO_RENEW, REFUND
// Updates user subscription_status accordingly.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import type { SubscriptionStatus, AppleNotificationType } from "../_shared/types.ts";

// Map Apple notification types to our subscription status
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  SUBSCRIBED: "active_subscriber",
  DID_RENEW: "active_subscriber",
  DID_FAIL_TO_RENEW: "grace_period",
  EXPIRED: "expired",
  GRACE_PERIOD_EXPIRED: "expired",
  REFUND: "cancelled",
};

interface DecodedNotification {
  notificationType: string;
  subtype?: string;
  data: {
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
}

interface DecodedTransactionInfo {
  originalTransactionId: string;
  transactionId: string;
  productId: string;
  expiresDate?: number;
  revocationDate?: number;
}

serve(async (req: Request) => {
  try {
    const body = await req.json();

    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      return new Response(JSON.stringify({ error: "Missing signedPayload" }), { status: 400 });
    }

    // Step 1: Decode the JWS payload
    // In production, we'd verify the signature against Apple's public key chain.
    // For now, decode the payload portion (base64url) without verification.
    const notification = decodeJWSPayload<DecodedNotification>(signedPayload);
    if (!notification) {
      console.error("[apple-webhook] Failed to decode notification payload");
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    console.log(`[apple-webhook] Received: ${notification.notificationType}${notification.subtype ? ` (${notification.subtype})` : ""}`);

    // Step 2: Decode the transaction info
    const transactionInfo = decodeJWSPayload<DecodedTransactionInfo>(
      notification.data.signedTransactionInfo,
    );
    if (!transactionInfo) {
      console.error("[apple-webhook] Failed to decode transaction info");
      return new Response(JSON.stringify({ error: "Invalid transaction info" }), { status: 400 });
    }

    const { originalTransactionId, transactionId, productId, expiresDate } = transactionInfo;

    console.log(`[apple-webhook] Transaction: ${transactionId}, original: ${originalTransactionId}, product: ${productId}`);

    // Step 3: Determine new subscription status
    const newStatus = STATUS_MAP[notification.notificationType];
    if (!newStatus) {
      // Unhandled notification type — log and acknowledge
      console.log(`[apple-webhook] Unhandled type: ${notification.notificationType} — acknowledged`);
      return new Response(JSON.stringify({ handled: false }), { status: 200 });
    }

    // Step 4: Find user by original transaction ID and update
    const expiresAt = expiresDate
      ? new Date(expiresDate).toISOString()
      : null;

    const { data: profile, error: findError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, subscription_status")
      .eq("apple_original_transaction_id", originalTransactionId)
      .maybeSingle();

    if (findError) {
      console.error("[apple-webhook] User lookup error:", findError);
      return new Response(JSON.stringify({ error: "Lookup failed" }), { status: 500 });
    }

    if (!profile) {
      console.error(`[apple-webhook] No user found for transaction: ${originalTransactionId}`);
      // Still return 200 to Apple so they don't retry
      return new Response(JSON.stringify({ error: "User not found", handled: false }), { status: 200 });
    }

    const updateData: Record<string, unknown> = {
      subscription_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (expiresAt) {
      updateData.subscription_expires = expiresAt;
    }

    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (updateError) {
      console.error("[apple-webhook] Status update error:", updateError);
      return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 });
    }

    // Step 5: Handle side effects per notification type
    if (newStatus === "active_subscriber") {
      // Grant unlimited energy
      await supabaseAdmin
        .from("user_currencies")
        .update({ energy: 999, updated_at: new Date().toISOString() })
        .eq("user_id", profile.id);
    } else if (newStatus === "expired" || newStatus === "cancelled") {
      // Revert to free energy cap
      await supabaseAdmin
        .from("user_currencies")
        .update({ energy: Math.min(5, 5), updated_at: new Date().toISOString() })
        .eq("user_id", profile.id);
    }

    // Step 6: Log the transaction event
    try {
      await supabaseAdmin.from("currency_transactions").insert({
        user_id: profile.id,
        currency_type: "energy",
        amount: newStatus === "active_subscriber" ? 999 : 5,
        reason: "subscription_change",
        metadata: {
          notification_type: notification.notificationType,
          subtype: notification.subtype ?? null,
          original_transaction_id: originalTransactionId,
          transaction_id: transactionId,
          product_id: productId,
          previous_status: profile.subscription_status,
          new_status: newStatus,
        },
      });
    } catch (logErr) {
      console.error("[apple-webhook] Transaction log error:", logErr);
    }

    console.log(`[apple-webhook] User ${profile.id}: ${profile.subscription_status} → ${newStatus}`);

    return new Response(
      JSON.stringify({ handled: true, user_id: profile.id, new_status: newStatus }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[apple-webhook] error:", error);
    // Return 200 even on error so Apple doesn't retry indefinitely
    return new Response(JSON.stringify({ error: "Processing error" }), { status: 200 });
  }
});

// Decode the payload portion of a JWS (base64url-encoded JSON)
// TODO: Add proper JWS signature verification using Apple's certificate chain
function decodeJWSPayload<T>(jws: string): T | null {
  try {
    const parts = jws.split(".");
    if (parts.length !== 3) return null;

    // Decode base64url payload (second part)
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = atob(payload);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}
