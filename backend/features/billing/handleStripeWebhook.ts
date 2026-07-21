import type { SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
  options?: { cancelAtPeriodEnd?: boolean; cancelAt?: number | null },
): SubscriptionStatus {
  const scheduledCancel =
    options?.cancelAtPeriodEnd === true ||
    (typeof options?.cancelAt === "number" &&
      options.cancelAt * 1000 > Date.now());

  // Portal "cancel at period end" keeps Stripe status active/trialing.
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

/**
 * Idempotent upsert by stripeSubscriptionId (fallback: workspaceId from metadata).
 * Never blind-create on every event; update only when data changed.
 */
export async function upsertSubscriptionFromStripe(input: {
  subscription: Stripe.Subscription;
  workspaceId?: string | null;
}): Promise<void> {
  const sub = input.subscription;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const status = mapStripeSubscriptionStatus(sub.status, {
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    cancelAt: typeof sub.cancel_at === "number" ? sub.cancel_at : null,
  });
  const currentPeriodEnd = subscriptionPeriodEnd(sub);
  const workspaceId =
    input.workspaceId?.trim() ||
    sub.metadata?.workspaceId?.trim() ||
    null;

  const byStripeId = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  const byWorkspace =
    !byStripeId && workspaceId
      ? await prisma.subscription.findUnique({ where: { workspaceId } })
      : null;

  const byCustomer =
    !byStripeId && !byWorkspace
      ? await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        })
      : null;

  const existing = byStripeId ?? byWorkspace ?? byCustomer;

  if (!existing) {
    if (!workspaceId) {
      console.warn(
        "[billing] Stripe subscription without workspaceId metadata",
        sub.id,
      );
      return;
    }

    await prisma.subscription.create({
      data: {
        workspaceId,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd,
      },
    });
    return;
  }

  const nextPeriodEndMs = currentPeriodEnd?.getTime() ?? null;
  const prevPeriodEndMs = existing.currentPeriodEnd?.getTime() ?? null;
  const unchanged =
    existing.status === status &&
    existing.stripeCustomerId === customerId &&
    existing.stripeSubscriptionId === sub.id &&
    nextPeriodEndMs === prevPeriodEndMs;

  if (unchanged) {
    return;
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd,
    },
  });
}

async function resolveWorkspaceIdFromCheckout(
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  return (
    session.metadata?.workspaceId?.trim() ||
    session.client_reference_id?.trim() ||
    null
  );
}

export async function handleStripeWebhook(input: {
  rawBody: string | Buffer;
  signature: string | null;
}): Promise<{ received: true }> {
  if (!input.signature) {
    throw new Error("Missing Stripe-Signature header");
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(
    input.rawBody,
    input.signature,
    getStripeWebhookSecret(),
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!subscriptionId) break;
      const subscription =
        await stripe.subscriptions.retrieve(subscriptionId);
      await upsertSubscriptionFromStripe({
        subscription,
        workspaceId: await resolveWorkspaceIdFromCheckout(session),
      });
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe({ subscription });
      break;
    }
    default:
      break;
  }

  return { received: true };
}
