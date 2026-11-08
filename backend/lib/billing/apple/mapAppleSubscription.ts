import type { BillingPurchaseStatus } from "@shared/billing";

/** Fields we read from a verified App Store transaction. */
export type AppleTransactionFields = {
  originalTransactionId: string;
  transactionId: string;
  productId: string;
  purchaseDate?: number | null;
  expiresDate?: number | null;
  revocationDate?: number | null;
  /** 1 = introductory offer. */
  offerType?: number | null;
  offerDiscountType?: string | null;
};

export type AppleEntitlementMapping = {
  status: BillingPurchaseStatus;
  expiresAt: Date | null;
  purchasedAt: Date | null;
};

function dateOrNull(ms: number | null | undefined): Date | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Map an App Store subscription status onto BillingPurchase.
 * Grace period stays `active` while `expiresDate` is in the future (`past_due`
 * does not grant Premium). A free introductory offer still inside its period
 * is `trialing`. Refunds and revocations are `expired` immediately.
 */
export function mapAppleSubscription(input: {
  transaction: AppleTransactionFields;
  /** App Store status: 1 active, 2 expired, 3 billing retry, 4 grace, 5 revoked. */
  status: number | null;
  now?: Date;
}): AppleEntitlementMapping {
  const now = input.now ?? new Date();
  const purchasedAt = dateOrNull(input.transaction.purchaseDate);
  const expiresAt = dateOrNull(input.transaction.expiresDate);
  const revocationAt = dateOrNull(input.transaction.revocationDate);
  const expiresInFuture =
    expiresAt != null && expiresAt.getTime() > now.getTime();

  if (revocationAt || input.status === 5) {
    return {
      status: "expired",
      expiresAt: revocationAt ?? now,
      purchasedAt,
    };
  }

  if (input.status === 2) {
    return { status: "expired", expiresAt, purchasedAt };
  }

  if (input.status === 3) {
    return expiresInFuture
      ? { status: "active", expiresAt, purchasedAt }
      : { status: "expired", expiresAt, purchasedAt };
  }

  if (input.status === 4) {
    return expiresInFuture || expiresAt == null
      ? { status: "active", expiresAt, purchasedAt }
      : { status: "expired", expiresAt, purchasedAt };
  }

  if (expiresAt && !expiresInFuture) {
    return { status: "expired", expiresAt, purchasedAt };
  }

  const freeTrial =
    input.transaction.offerType === 1 &&
    input.transaction.offerDiscountType === "FREE_TRIAL";

  return {
    status: freeTrial ? "trialing" : "active",
    expiresAt,
    purchasedAt,
  };
}
