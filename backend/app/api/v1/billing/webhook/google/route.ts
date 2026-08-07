import { NextResponse } from "next/server";

import { applyPurchase, BillingRegistry } from "@/lib/billing";
import {
  findWorkspaceIdByPurchaseToken,
  resolveBillingOwnerUserId,
} from "@/lib/billing/upsertEntitlement";
import {
  recordUnknownPurchaseToken,
  recordWebhookFailure,
} from "@/lib/billing/monitoring";
import { processProviderWebhook } from "@/lib/billing/processWebhook";
import { ApiError } from "@/lib/auth/errors";
import { Analytics } from "@/lib/analytics";

export const runtime = "nodejs";

type RtdnNotification = {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken?: string;
    orderId?: string;
    productType?: number;
  };
};

function decodePubSubData(body: Record<string, unknown>): RtdnNotification | null {
  const message = body.message;
  if (!message || typeof message !== "object") return null;
  const data = (message as { data?: unknown }).data;
  if (typeof data !== "string" || !data) return null;
  try {
    const json = Buffer.from(data, "base64").toString("utf8");
    return JSON.parse(json) as RtdnNotification;
  } catch {
    return null;
  }
}

/**
 * Google Play RTDN (Pub/Sub push).
 * Signal only → getSubscription (subscriptionsv2) → ApplyPurchase.
 * Unknown tokens: ignore + metric (not 5xx).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const decoded = decodePubSubData(body);
    const purchaseToken =
      decoded?.subscriptionNotification?.purchaseToken?.trim() ||
      decoded?.voidedPurchaseNotification?.purchaseToken?.trim() ||
      null;
    const notificationType =
      decoded?.subscriptionNotification?.notificationType ?? null;

    const result = await processProviderWebhook({
      providerId: "google",
      type:
        notificationType != null
          ? `rtdn.subscription.${notificationType}`
          : decoded?.voidedPurchaseNotification
            ? "rtdn.voided"
            : "rtdn.unknown",
      externalId: purchaseToken,
      payload: {
        pubsub: body,
        decoded: decoded ?? null,
      } as import("@prisma/client").Prisma.InputJsonValue,
      handle: async () => {
        if (!purchaseToken) {
          console.warn("[billing] Google RTDN without purchaseToken");
          recordUnknownPurchaseToken("google");
          return;
        }

        const workspaceId = await findWorkspaceIdByPurchaseToken(
          "google",
          purchaseToken,
        );
        if (!workspaceId) {
          console.warn(
            "[billing] Google RTDN unknown purchaseToken (no local purchase)",
          );
          recordUnknownPurchaseToken("google");
          return;
        }

        const userId = await resolveBillingOwnerUserId(workspaceId);
        if (!userId) {
          console.warn("[billing] Google RTDN without billing owner", workspaceId);
          return;
        }

        const provider = BillingRegistry.resolve("google");
        const snapshot = await provider.getSubscription({
          externalId: purchaseToken,
        });
        if (!snapshot) {
          recordUnknownPurchaseToken("google");
          return;
        }

        const toApply = decoded?.voidedPurchaseNotification
          ? { ...snapshot, status: "revoked" as const }
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
            provider: "google",
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
      "google",
      error instanceof Error ? error.message : "unknown",
    );
    console.error("[billing] google webhook error", error);
    // Ack Pub/Sub to avoid infinite retry storms on poison messages;
    // metric already recorded.
    return NextResponse.json({ received: true });
  }
}
