import type Stripe from "stripe";

import { Analytics } from "@/lib/analytics";
import { ApiError } from "@/lib/auth/errors";
import {
  appendBillingEvent,
  applyPurchase,
  BillingRegistry,
  recordWebhookFailure,
  recordWebhookProcessingMs,
  resolveBillingOwnerUserId,
} from "@/lib/billing";
import { StripeBillingProvider } from "@/lib/billing/providers/stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

async function resolveWorkspaceIdForSubscription(
  sub: Stripe.Subscription,
  fallback?: string | null,
): Promise<string | null> {
  const fromMeta = fallback?.trim() || sub.metadata?.workspaceId?.trim() || null;
  if (fromMeta) return fromMeta;

  const byExternal = await prisma.billingPurchase.findUnique({
    where: {
      providerId_externalId: { providerId: "stripe", externalId: sub.id },
    },
    select: { workspaceId: true },
  });
  if (byExternal) return byExternal.workspaceId;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const byCustomerPayload = await prisma.billingPurchase.findFirst({
    where: {
      providerId: "stripe",
      OR: [
        { externalId: `customer:${customerId}` },
        {
          payload: {
            path: ["stripeCustomerId"],
            equals: customerId,
          },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { workspaceId: true },
  });
  return byCustomerPayload?.workspaceId ?? null;
}

/**
 * Idempotent: BillingPurchase.externalId = Stripe subscription id (immutable).
 * Writes only via ApplyPurchase.
 */
export async function upsertSubscriptionFromStripe(input: {
  subscription: Stripe.Subscription;
  workspaceId?: string | null;
  deleted?: boolean;
}): Promise<void> {
  const sub = input.subscription;
  const workspaceId = await resolveWorkspaceIdForSubscription(
    sub,
    input.workspaceId,
  );

  if (!workspaceId) {
    console.warn(
      "[billing] Stripe subscription without workspaceId",
      sub.id,
    );
    return;
  }

  const userId = await resolveBillingOwnerUserId(workspaceId);
  if (!userId) {
    console.warn(
      "[billing] Stripe subscription without billing owner",
      sub.id,
      workspaceId,
    );
    return;
  }

  const provider = BillingRegistry.resolve("stripe") as StripeBillingProvider;
  const snapshot = provider.subscriptionSnapshot(sub);
  const result = await applyPurchase(snapshot, {
    workspaceId,
    userId,
    supersedePrevious: true,
    checkProviderMismatch: true,
  });

  Analytics.track(
    "billing_apply_completed",
    {
      workspace_id: workspaceId,
      provider: "stripe",
      product_id: result.productId,
      status: result.status,
    },
    workspaceId,
  );
}

export async function handleStripeWebhook(input: {
  rawBody: string;
  signature: string | null;
}): Promise<{ received: true }> {
  const started = Date.now();
  if (!input.signature) {
    throw new ApiError("VALIDATION_ERROR", "Missing stripe-signature header.", 400);
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      input.rawBody,
      input.signature,
      getStripeWebhookSecret(),
    );
  } catch (err) {
    recordWebhookFailure(
      "stripe",
      err instanceof Error ? err.message : "signature",
    );
    throw new ApiError(
      "VALIDATION_ERROR",
      "Invalid Stripe webhook signature.",
      400,
    );
  }

  await appendBillingEvent({
    providerId: "stripe",
    type: event.type,
    externalId: event.id,
    payload:
      event.data.object as unknown as import("@prisma/client").Prisma.InputJsonValue,
    processed: false,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId?.trim() || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscriptionFromStripe({
            subscription,
            workspaceId,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe({ subscription });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe({
          subscription,
          deleted: true,
        });
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subField = (
          invoice as Stripe.Invoice & {
            subscription?: string | { id: string } | null;
          }
        ).subscription;
        const subscriptionId =
          typeof subField === "string"
            ? subField
            : subField && typeof subField === "object"
              ? subField.id
              : null;
        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscriptionFromStripe({ subscription });
        }
        break;
      }
      default:
        break;
    }

    recordWebhookProcessingMs("stripe", Date.now() - started);
    return { received: true };
  } catch (err) {
    recordWebhookFailure(
      "stripe",
      err instanceof Error ? err.message : "unknown",
    );
    throw err;
  }
}
