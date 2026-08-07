import type { BillingPurchaseStatus } from "@prisma/client";
import {
  DEFAULT_PREMIUM_PRODUCT,
  resolveProductIdFromGoogleSku,
  type BillingCapability,
  type ProductCatalogId,
  type PurchaseSnapshot,
  type SubscriptionSnapshot,
} from "@shared/billing";

import {
  getAndroidPublisher,
  getGooglePlayPackageName,
  type GoogleSubscriptionV2Response,
} from "../googlePlayClient";
import { recordAcknowledgeFailure, recordVerifyFailure } from "../monitoring";
import type {
  BackendBillingProvider,
  ManageSubscriptionInput,
  ManageSubscriptionResult,
  VerifyPurchaseInput,
} from "../types";

function mapGoogleSubscriptionState(
  state: string | null | undefined,
): BillingPurchaseStatus {
  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return "active";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "past_due";
    case "SUBSCRIPTION_STATE_ON_HOLD":
    case "SUBSCRIPTION_STATE_PAUSED":
      return "past_due";
    case "SUBSCRIPTION_STATE_CANCELED":
      return "cancelled";
    case "SUBSCRIPTION_STATE_EXPIRED":
      return "expired";
    case "SUBSCRIPTION_STATE_PENDING":
    case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
      return "pending";
    default:
      return "cancelled";
  }
}

function snapshotFromV2(input: {
  purchaseToken: string;
  raw: GoogleSubscriptionV2Response;
  productIdHint?: ProductCatalogId;
  kind: "purchase" | "subscription";
}): PurchaseSnapshot | SubscriptionSnapshot {
  const line = input.raw.lineItems?.[0];
  const sku = line?.productId?.trim() || null;
  const productId =
    (sku ? resolveProductIdFromGoogleSku(sku) : null) ??
    input.productIdHint ??
    DEFAULT_PREMIUM_PRODUCT;

  const expiresAt = line?.expiryTime ? new Date(line.expiryTime) : null;
  const purchasedAt = input.raw.startTime
    ? new Date(input.raw.startTime)
    : null;
  const status = mapGoogleSubscriptionState(input.raw.subscriptionState);
  const ackState = input.raw.acknowledgementState;
  const requiresAcknowledgement =
    ackState === "ACKNOWLEDGEMENT_STATE_PENDING" ||
    ackState === undefined ||
    ackState === null;

  const base = {
    providerId: "google" as const,
    externalId: input.purchaseToken,
    productId,
    status,
    expiresAt:
      expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    purchasedAt:
      purchasedAt && !Number.isNaN(purchasedAt.getTime())
        ? purchasedAt
        : null,
    providerMetadata: input.raw as Record<string, unknown>,
    linkedExternalId: input.raw.linkedPurchaseToken ?? null,
  };

  if (input.kind === "purchase") {
    return {
      ...base,
      kind: "purchase",
      requiresAcknowledgement,
    };
  }
  return { ...base, kind: "subscription" };
}

/**
 * Google Play Billing adapter (Android Publisher API subscriptionsv2).
 * Does not write entitlement — returns snapshots for ApplyPurchase.
 */
export class GooglePlayBillingProvider implements BackendBillingProvider {
  readonly id = "google" as const;

  capabilities(): BillingCapability {
    return {
      supportsPurchase: true,
      supportsTrial: true,
      supportsRestore: true,
      supportsManage: true,
      supportsManageExternally: true,
      supportsUpgrade: true,
      supportsDowngrade: true,
      priceSource: "store",
      purchaseMode: "native_iap",
    };
  }

  async verifyPurchase(input: VerifyPurchaseInput): Promise<PurchaseSnapshot> {
    try {
      const purchaseToken =
        typeof input.proof.purchaseToken === "string"
          ? input.proof.purchaseToken.trim()
          : "";
      if (!purchaseToken) {
        throw new Error("Google verifyPurchase requires proof.purchaseToken");
      }

      const packageName =
        typeof input.proof.packageName === "string" &&
        input.proof.packageName.trim()
          ? input.proof.packageName.trim()
          : getGooglePlayPackageName();

      const publisher = getAndroidPublisher();
      const { data } = await publisher.purchases.subscriptionsv2.get({
        packageName,
        token: purchaseToken,
      });

      return snapshotFromV2({
        purchaseToken,
        raw: data as GoogleSubscriptionV2Response,
        productIdHint: input.productId,
        kind: "purchase",
      }) as PurchaseSnapshot;
    } catch (err) {
      recordVerifyFailure(
        this.id,
        err instanceof Error ? err.message : "unknown",
      );
      throw err;
    }
  }

  async acknowledge(input: {
    externalId: string;
    proof?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const packageName =
        typeof input.proof?.packageName === "string" &&
        input.proof.packageName.trim()
          ? input.proof.packageName.trim()
          : getGooglePlayPackageName();

      const subscriptionId =
        typeof input.proof?.subscriptionId === "string"
          ? input.proof.subscriptionId
          : typeof input.proof?.productId === "string"
            ? input.proof.productId
            : null;

      if (!subscriptionId) {
        // Resolve product id from subscriptionsv2 first
        const snap = await this.getSubscription({
          externalId: input.externalId,
        });
        const sku =
          snap &&
          typeof snap.providerMetadata === "object" &&
          Array.isArray(
            (snap.providerMetadata as GoogleSubscriptionV2Response).lineItems,
          )
            ? (snap.providerMetadata as GoogleSubscriptionV2Response)
                .lineItems?.[0]?.productId
            : null;
        if (!sku) {
          throw new Error("Cannot acknowledge Google purchase without SKU");
        }
        const publisher = getAndroidPublisher();
        await publisher.purchases.subscriptions.acknowledge({
          packageName,
          subscriptionId: sku,
          token: input.externalId,
          requestBody: {},
        });
        return;
      }

      const publisher = getAndroidPublisher();
      await publisher.purchases.subscriptions.acknowledge({
        packageName,
        subscriptionId,
        token: input.externalId,
        requestBody: {},
      });
    } catch (err) {
      recordAcknowledgeFailure(
        this.id,
        err instanceof Error ? err.message : "unknown",
      );
      throw err;
    }
  }

  async getSubscription(input: {
    externalId: string;
    productId?: ProductCatalogId;
  }): Promise<SubscriptionSnapshot | null> {
    try {
      const packageName = getGooglePlayPackageName();
      const publisher = getAndroidPublisher();
      const { data } = await publisher.purchases.subscriptionsv2.get({
        packageName,
        token: input.externalId,
      });
      return snapshotFromV2({
        purchaseToken: input.externalId,
        raw: data as GoogleSubscriptionV2Response,
        productIdHint: input.productId,
        kind: "subscription",
      }) as SubscriptionSnapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      if (message.includes("404") || message.toLowerCase().includes("not found")) {
        return null;
      }
      recordVerifyFailure(this.id, message);
      throw err;
    }
  }

  async manage(
    _input: ManageSubscriptionInput,
  ): Promise<ManageSubscriptionResult> {
    return {
      url: "https://play.google.com/store/account/subscriptions",
    };
  }
}
