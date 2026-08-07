import type { BillingPurchaseStatus } from "@prisma/client";
import type Stripe from "stripe";
import {
  DEFAULT_PREMIUM_PRODUCT,
  resolveProductIdFromStripePriceId,
  type BillingCapability,
  type ProductCatalogId,
  type PurchaseSnapshot,
  type SubscriptionSnapshot,
} from "@shared/billing";

import {
  getBillingReturnUrlBase,
  getStripe,
} from "@/lib/stripe";

import { recordVerifyFailure } from "../monitoring";
import type {
  BackendBillingProvider,
  ManageSubscriptionInput,
  ManageSubscriptionResult,
  VerifyPurchaseInput,
} from "../types";
import { getStripeCustomerIdForWorkspace } from "../upsertEntitlement";

function mapStripeStatus(
  status: Stripe.Subscription.Status,
  options?: { cancelAtPeriodEnd?: boolean; cancelAt?: number | null },
): BillingPurchaseStatus {
  const scheduledCancel =
    options?.cancelAtPeriodEnd === true ||
    (typeof options?.cancelAt === "number" &&
      options.cancelAt * 1000 > Date.now());

  if (scheduledCancel && (status === "active" || status === "trialing")) {
    return "cancelled";
  }

  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "cancelled";
  }
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const end =
    (sub as Stripe.Subscription & { current_period_end?: number })
      .current_period_end ?? sub.items.data[0]?.current_period_end;
  if (typeof end !== "number") return null;
  return new Date(end * 1000);
}

function productIdFromSubscription(sub: Stripe.Subscription): ProductCatalogId {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return DEFAULT_PREMIUM_PRODUCT;
  return resolveProductIdFromStripePriceId(priceId, {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  });
}

function subscriptionToSnapshot(
  sub: Stripe.Subscription,
  kind: "purchase" | "subscription",
  productIdHint?: ProductCatalogId,
): PurchaseSnapshot | SubscriptionSnapshot {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const status = mapStripeStatus(sub.status, {
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    cancelAt: typeof sub.cancel_at === "number" ? sub.cancel_at : null,
  });
  const expiresAt = subscriptionPeriodEnd(sub);
  const productId = productIdHint ?? productIdFromSubscription(sub);
  const purchasedAt =
    typeof sub.start_date === "number"
      ? new Date(sub.start_date * 1000)
      : null;

  const base = {
    providerId: "stripe" as const,
    externalId: sub.id,
    productId,
    status,
    expiresAt,
    purchasedAt,
    providerMetadata: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      cancel_at: sub.cancel_at ?? null,
      start_date: sub.start_date,
      items: sub.items.data.map((item) => ({
        priceId: item.price?.id ?? null,
      })),
    },
    linkedExternalId: null as string | null,
  };

  if (kind === "purchase") {
    return {
      ...base,
      kind: "purchase",
      requiresAcknowledgement: false,
    };
  }
  return { ...base, kind: "subscription" };
}

/**
 * Stripe Web provider — Checkout + Customer Portal.
 * Returns snapshots only; ApplyPurchase writes entitlement.
 */
export class StripeBillingProvider implements BackendBillingProvider {
  readonly id = "stripe" as const;

  capabilities(): BillingCapability {
    return {
      supportsPurchase: true,
      supportsTrial: true,
      supportsRestore: true,
      supportsManage: true,
      supportsManageExternally: true,
      supportsUpgrade: false,
      supportsDowngrade: false,
      priceSource: "backend",
      purchaseMode: "checkout_url",
    };
  }

  async verifyPurchase(input: VerifyPurchaseInput): Promise<PurchaseSnapshot> {
    try {
      const stripe = getStripe();
      const subscriptionId =
        typeof input.proof.subscriptionId === "string"
          ? input.proof.subscriptionId
          : typeof input.proof.checkoutSessionId === "string"
            ? null
            : null;

      let resolvedSubId = subscriptionId;
      if (
        !resolvedSubId &&
        typeof input.proof.checkoutSessionId === "string"
      ) {
        const session = await stripe.checkout.sessions.retrieve(
          input.proof.checkoutSessionId,
        );
        resolvedSubId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
      }

      if (!resolvedSubId) {
        throw new Error(
          "Stripe verifyPurchase requires proof.subscriptionId or proof.checkoutSessionId",
        );
      }

      const subscription = await stripe.subscriptions.retrieve(resolvedSubId);
      return subscriptionToSnapshot(
        subscription,
        "purchase",
        input.productId,
      ) as PurchaseSnapshot;
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
    // Stripe has no acknowledge step
  }

  async manage(
    input: ManageSubscriptionInput,
  ): Promise<ManageSubscriptionResult> {
    const customerId = await getStripeCustomerIdForWorkspace(input.workspaceId);
    if (!customerId) {
      throw new Error("No Stripe customer for this workspace yet.");
    }
    const stripe = getStripe();
    const base = getBillingReturnUrlBase();
    const params = new URLSearchParams({ workspaceId: input.workspaceId });
    const sep = base.includes("?") ? "&" : "?";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}${sep}${params.toString()}`,
    });
    return { url: session.url };
  }

  async getSubscription(input: {
    externalId: string;
    productId?: ProductCatalogId;
  }): Promise<SubscriptionSnapshot | null> {
    const stripe = getStripe();
    try {
      const subscription = await stripe.subscriptions.retrieve(input.externalId);
      return subscriptionToSnapshot(
        subscription,
        "subscription",
        input.productId,
      ) as SubscriptionSnapshot;
    } catch {
      return null;
    }
  }

  /** Build snapshot from a Stripe.Subscription object (webhooks). */
  subscriptionSnapshot(
    subscription: Stripe.Subscription,
    productId?: ProductCatalogId,
  ): SubscriptionSnapshot {
    return subscriptionToSnapshot(
      subscription,
      "subscription",
      productId,
    ) as SubscriptionSnapshot;
  }
}

export function mapStripeSubscriptionStatusForLegacy(
  status: Stripe.Subscription.Status,
  options?: { cancelAtPeriodEnd?: boolean; cancelAt?: number | null },
): BillingPurchaseStatus {
  return mapStripeStatus(status, options);
}
