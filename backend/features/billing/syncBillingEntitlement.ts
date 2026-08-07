import { authorize, requireRole } from "@/lib/authorize";
import {
  applyPurchase,
  BillingRegistry,
  getGooglePurchaseTokenForWorkspace,
  getStripeCustomerIdForWorkspace,
  getStripeSubscriptionIdForWorkspace,
} from "@/lib/billing";
import { getWorkspaceEntitlement } from "@/lib/premium";
import { getStripe } from "@/lib/stripe";
import { Analytics } from "@/lib/analytics";

import { upsertSubscriptionFromStripe } from "./handleStripeWebhook";

/**
 * Provider-aware sync: Stripe pulls from Stripe API; Google refreshes via subscriptionsv2.
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

  const googleToken = await getGooglePurchaseTokenForWorkspace(
    input.workspaceId,
  );
  if (googleToken) {
    const provider = BillingRegistry.resolve("google");
    const snapshot = await provider.getSubscription({
      externalId: googleToken,
    });
    if (snapshot) {
      const result = await applyPurchase(snapshot, {
        workspaceId: input.workspaceId,
        userId: input.userId,
        supersedePrevious: true,
        checkProviderMismatch: true,
      });
      Analytics.track(
        "billing_apply_completed",
        {
          workspace_id: input.workspaceId,
          provider: "google",
          product_id: result.productId,
          status: result.status,
        },
        input.workspaceId,
      );
    }
  } else {
    const customerId = await getStripeCustomerIdForWorkspace(input.workspaceId);
    if (!customerId) {
      // No billing purchase yet — return current entitlement (likely free)
      const next = await getWorkspaceEntitlement(input.workspaceId);
      return {
        plan: next.plan,
        status: next.status,
        currentPeriodEnd: next.currentPeriodEnd
          ? next.currentPeriodEnd.toISOString()
          : null,
      };
    }

    const stripe = getStripe();
    const subscriptionId = await getStripeSubscriptionIdForWorkspace(
      input.workspaceId,
    );

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await upsertSubscriptionFromStripe({
        subscription,
        workspaceId: input.workspaceId,
      });
    } else {
      const listed = await stripe.subscriptions.list({
        customer: customerId,
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
      } else {
        // Customer exists (e.g. Checkout just opened) but no subscription yet —
        // not an error for silent restore / post-checkout poll.
        const next = await getWorkspaceEntitlement(input.workspaceId);
        return {
          plan: next.plan,
          status: next.status,
          currentPeriodEnd: next.currentPeriodEnd
            ? next.currentPeriodEnd.toISOString()
            : null,
        };
      }
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
