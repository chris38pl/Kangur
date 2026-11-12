import { authorize, requireRole } from "@/lib/authorize";
import {
  applyPurchase,
  BillingRegistry,
  getAppleOriginalTransactionIdForWorkspace,
  getGooglePurchaseTokenForWorkspace,
  getStripeCustomerIdForWorkspace,
  getStripeSubscriptionIdForWorkspace,
} from "@/lib/billing";
import { getWorkspaceEntitlement } from "@/lib/premium";
import { getStripe } from "@/lib/stripe";
import { Analytics } from "@/lib/analytics";

import { upsertSubscriptionFromStripe } from "./handleStripeWebhook";

/**
 * Provider-aware sync. Refreshes the purchase already stored for this
 * workspace. It does not claim a store receipt onto a different workspace.
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

  const appleExternalId = await getAppleOriginalTransactionIdForWorkspace(
    input.workspaceId,
  );
  if (appleExternalId) {
    await refreshStoreSubscription(input, "apple", appleExternalId);
  } else {
    const googleToken = await getGooglePurchaseTokenForWorkspace(
      input.workspaceId,
    );
    if (googleToken) {
      await refreshStoreSubscription(input, "google", googleToken);
    } else {
      const done = await refreshStripeSubscription(input.workspaceId);
      if (done) return done;
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

async function refreshStoreSubscription(
  input: { workspaceId: string; userId: string },
  providerId: "apple" | "google",
  externalId: string,
): Promise<void> {
  const provider = BillingRegistry.resolve(providerId);
  const snapshot = await provider.getSubscription({ externalId });
  if (!snapshot) return;
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
      provider: providerId,
      product_id: result.productId,
      status: result.status,
    },
    input.workspaceId,
  );
}

async function refreshStripeSubscription(workspaceId: string): Promise<{
  plan: "free" | "premium";
  status: string;
  currentPeriodEnd: string | null;
} | null> {
  const customerId = await getStripeCustomerIdForWorkspace(workspaceId);
  if (!customerId) {
    const next = await getWorkspaceEntitlement(workspaceId);
    return {
      plan: next.plan,
      status: next.status,
      currentPeriodEnd: next.currentPeriodEnd
        ? next.currentPeriodEnd.toISOString()
        : null,
    };
  }

  const stripe = getStripe();
  const subscriptionId = await getStripeSubscriptionIdForWorkspace(workspaceId);

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await upsertSubscriptionFromStripe({ subscription, workspaceId });
    return null;
  }

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
      workspaceId,
    });
    return null;
  }

  const next = await getWorkspaceEntitlement(workspaceId);
  return {
    plan: next.plan,
    status: next.status,
    currentPeriodEnd: next.currentPeriodEnd
      ? next.currentPeriodEnd.toISOString()
      : null,
  };
}
