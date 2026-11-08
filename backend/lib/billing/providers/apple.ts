import {
  DEFAULT_PREMIUM_PRODUCT,
  resolveProductIdFromAppleSku,
  type BillingCapability,
  type ProductCatalogId,
  type PurchaseSnapshot,
  type SubscriptionSnapshot,
} from "@shared/billing";

import { recordVerifyFailure } from "../monitoring";
import type {
  BackendBillingProvider,
  ManageSubscriptionInput,
  ManageSubscriptionResult,
  VerifyPurchaseInput,
} from "../types";
import { loadAppleSubscription } from "../apple/api";
import {
  mapAppleSubscription,
  type AppleTransactionFields,
} from "../apple/mapAppleSubscription";

const MANAGE_URL = "https://apps.apple.com/account/subscriptions";

function fieldsFromTransaction(transaction: {
  originalTransactionId?: string;
  transactionId?: string;
  productId?: string;
  purchaseDate?: number;
  expiresDate?: number;
  revocationDate?: number;
  offerType?: number;
  offerDiscountType?: string;
}): AppleTransactionFields | null {
  const originalTransactionId = transaction.originalTransactionId?.trim() ?? "";
  const transactionId = transaction.transactionId?.trim() || originalTransactionId;
  const productId = transaction.productId?.trim() ?? "";
  if (!originalTransactionId || !productId) return null;
  return {
    originalTransactionId,
    transactionId,
    productId,
    purchaseDate: transaction.purchaseDate,
    expiresDate: transaction.expiresDate,
    revocationDate: transaction.revocationDate,
    offerType:
      typeof transaction.offerType === "number" ? transaction.offerType : null,
    offerDiscountType: transaction.offerDiscountType ?? null,
  };
}

function snapshotFromLoaded(input: {
  loaded: NonNullable<Awaited<ReturnType<typeof loadAppleSubscription>>>;
  productIdHint?: ProductCatalogId;
  kind: "purchase" | "subscription";
}): PurchaseSnapshot | SubscriptionSnapshot {
  const fields = fieldsFromTransaction(input.loaded.transaction);
  if (!fields) {
    throw new Error("Apple transaction is missing originalTransactionId or productId.");
  }
  const mapped = mapAppleSubscription({
    transaction: fields,
    status: input.loaded.status,
  });
  const productId =
    resolveProductIdFromAppleSku(fields.productId) ??
    input.productIdHint ??
    DEFAULT_PREMIUM_PRODUCT;

  const base = {
    providerId: "apple" as const,
    externalId: fields.originalTransactionId,
    productId,
    status: mapped.status,
    expiresAt: mapped.expiresAt,
    purchasedAt: mapped.purchasedAt,
    providerMetadata: JSON.parse(
      JSON.stringify({
        environment: input.loaded.environment,
        subscriptionStatus: input.loaded.status,
        transaction: input.loaded.transaction,
      }),
    ) as Record<string, unknown>,
    linkedExternalId: null,
  };

  if (input.kind === "purchase") {
    return { ...base, kind: "purchase", requiresAcknowledgement: false };
  }
  return { ...base, kind: "subscription" };
}

/**
 * App Store Server API adapter. StoreKit finishes the transaction on device.
 */
export class AppleBillingProvider implements BackendBillingProvider {
  readonly id = "apple" as const;

  capabilities(): BillingCapability {
    return {
      supportsPurchase: true,
      supportsTrial: true,
      supportsRestore: true,
      supportsManage: true,
      supportsManageExternally: true,
      supportsUpgrade: false,
      supportsDowngrade: false,
      priceSource: "store",
      purchaseMode: "native_iap",
    };
  }

  async verifyPurchase(input: VerifyPurchaseInput): Promise<PurchaseSnapshot> {
    try {
      const transactionId =
        typeof input.proof.transactionId === "string"
          ? input.proof.transactionId.trim()
          : "";
      if (!transactionId) {
        throw new Error("Apple verifyPurchase requires proof.transactionId");
      }

      const loaded = await loadAppleSubscription(transactionId);
      if (!loaded) {
        throw new Error("Apple subscription was not found for this transaction.");
      }

      return snapshotFromLoaded({
        loaded,
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

  async acknowledge(_input: {
    externalId: string;
    proof?: Record<string, unknown>;
  }): Promise<void> {
    // StoreKit finishes the transaction on the device after verify.
  }

  async getSubscription(input: {
    externalId: string;
    productId?: ProductCatalogId;
  }): Promise<SubscriptionSnapshot | null> {
    try {
      const loaded = await loadAppleSubscription(input.externalId);
      if (!loaded) return null;
      return snapshotFromLoaded({
        loaded,
        productIdHint: input.productId,
        kind: "subscription",
      }) as SubscriptionSnapshot;
    } catch (err) {
      recordVerifyFailure(
        this.id,
        err instanceof Error ? err.message : "unknown",
      );
      throw err;
    }
  }

  async manage(
    _input: ManageSubscriptionInput,
  ): Promise<ManageSubscriptionResult> {
    return { url: MANAGE_URL };
  }
}
