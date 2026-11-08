import { NextResponse } from "next/server";

import { Analytics } from "@/lib/analytics";
import { VerificationException } from "@apple/app-store-server-library";
import { ApiError } from "@/lib/auth/errors";
import { applyPurchase, BillingRegistry } from "@/lib/billing";
import { verifyAppleNotification } from "@/lib/billing/apple/api";
import {
  recordUnknownPurchaseToken,
  recordWebhookFailure,
} from "@/lib/billing/monitoring";
import { processProviderWebhook } from "@/lib/billing/processWebhook";
import {
  findWorkspaceIdByPurchaseToken,
  resolveBillingOwnerUserId,
} from "@/lib/billing/upsertEntitlement";

export const runtime = "nodejs";

/**
 * App Store Server Notifications V2.
 * Production: https://api.getkangur.com/api/v1/billing/webhook/apple
 * Sandbox: https://staging-api.getkangur.com/api/v1/billing/webhook/apple
 *
 * Signal only: verify JWS, then getSubscription, then ApplyPurchase.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      signedPayload?: unknown;
    };
    const signedPayload =
      typeof body.signedPayload === "string" ? body.signedPayload.trim() : "";
    if (!signedPayload) {
      return NextResponse.json(
        { error: "signedPayload required." },
        { status: 400 },
      );
    }

    const decoded = await verifyAppleNotification(signedPayload);
    const notificationType = decoded.notificationType ?? "asn.unknown";
    const subtype = decoded.subtype ?? null;
    const signedTransactionInfo = decoded.data?.signedTransactionInfo;
    let originalTransactionId: string | null = null;
    if (signedTransactionInfo) {
      const segment = signedTransactionInfo.split(".")[1];
      if (segment) {
        try {
          const payload = JSON.parse(
            Buffer.from(segment, "base64url").toString("utf8"),
          ) as { originalTransactionId?: string };
          originalTransactionId = payload.originalTransactionId?.trim() || null;
        } catch {
          originalTransactionId = null;
        }
      }
    }

    const result = await processProviderWebhook({
      providerId: "apple",
      type: subtype ? `${notificationType}.${subtype}` : notificationType,
      externalId: originalTransactionId,
      payload: {
        notificationType,
        subtype,
        notificationUUID: decoded.notificationUUID ?? null,
        environment: decoded.data?.environment ?? null,
        originalTransactionId,
      },
      handle: async () => {
        if (notificationType === "TEST" || !originalTransactionId) {
          return;
        }

        const workspaceId = await findWorkspaceIdByPurchaseToken(
          "apple",
          originalTransactionId,
        );
        if (!workspaceId) {
          console.warn(
            "[billing] Apple ASN unknown originalTransactionId (no local purchase)",
          );
          recordUnknownPurchaseToken("apple");
          return;
        }

        const userId = await resolveBillingOwnerUserId(workspaceId);
        if (!userId) {
          console.warn("[billing] Apple ASN without billing owner", workspaceId);
          return;
        }

        const provider = BillingRegistry.resolve("apple");
        const snapshot = await provider.getSubscription({
          externalId: originalTransactionId,
        });
        if (!snapshot) {
          recordUnknownPurchaseToken("apple");
          return;
        }

        const forceExpired =
          notificationType === "REFUND" || notificationType === "REVOKE";
        const toApply = forceExpired
          ? {
              ...snapshot,
              status: "expired" as const,
              expiresAt:
                snapshot.expiresAt && snapshot.expiresAt.getTime() <= Date.now()
                  ? snapshot.expiresAt
                  : new Date(),
            }
          : snapshot;

        const applied = await applyPurchase(toApply, {
          workspaceId,
          userId,
          supersedePrevious: true,
          checkProviderMismatch: true,
        });

        Analytics.track(
          "billing_apply_completed",
          {
            workspace_id: workspaceId,
            provider: "apple",
            product_id: applied.productId,
            status: applied.status,
          },
          workspaceId,
        );
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    recordWebhookFailure(
      "apple",
      error instanceof Error ? error.message : "unknown",
    );
    console.error("[billing] apple webhook error", error);
    const message = error instanceof Error ? error.message : "";
    const unverified =
      error instanceof VerificationException ||
      message.toLowerCase().includes("verif") ||
      message.toLowerCase().includes("signedpayload");
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: unverified ? 400 : 500 },
    );
  }
}
