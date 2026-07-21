import { notFound } from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import { getWorkspaceEntitlement } from "@/lib/premium";
import { getStripe } from "@/lib/stripe";

import { upsertSubscriptionFromStripe } from "./handleStripeWebhook";

/**
 * Pull latest Stripe subscription for this workspace customer and upsert local
 * entitlement. Used after Checkout / Portal return when webhooks may be delayed
 * (e.g. local without `stripe listen`).
 */
export async function syncBillingEntitlement(input: {
  workspaceId: string;
  userId: string;
}): Promise<{
  plan: "free" | "premium";
  status: string;
  currentPeriodEnd: string | null;
}> {
  const { membership } = await authorize(input.workspaceId, input.userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can manage billing.",
  );

  const entitlement = await getWorkspaceEntitlement(input.workspaceId);
  if (!entitlement.stripeCustomerId) {
    throw notFound("No Stripe customer for this workspace.");
  }

  const stripe = getStripe();

  // Prefer the known subscription id - list order is not a reliable SoT for
  // cancel_at_period_end updates after Customer Portal.
  if (entitlement.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(
      entitlement.stripeSubscriptionId,
    );
    await upsertSubscriptionFromStripe({
      subscription,
      workspaceId: input.workspaceId,
    });
  } else {
    const listed = await stripe.subscriptions.list({
      customer: entitlement.stripeCustomerId,
      status: "all",
      limit: 10,
    });

    const preferred =
      listed.data.find(
        (sub) =>
          (sub.status === "active" || sub.status === "trialing") &&
          sub.cancel_at_period_end,
      ) ??
      listed.data.find(
        (sub) => sub.status === "active" || sub.status === "trialing",
      ) ??
      listed.data[0];

    if (preferred) {
      await upsertSubscriptionFromStripe({
        subscription: preferred,
        workspaceId: input.workspaceId,
      });
    }
  }

  const next = await getWorkspaceEntitlement(input.workspaceId);
  return {
    plan: next.plan,
    status: next.status,
    currentPeriodEnd: next.currentPeriodEnd
      ? next.currentPeriodEnd.toISOString()
      : null,
  };
}
