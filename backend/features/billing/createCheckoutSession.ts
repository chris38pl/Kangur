import type Stripe from "stripe";

import { conflict, validationError } from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { getWorkspaceEntitlement } from "@/lib/premium";
import {
  getBillingReturnUrlBase,
  getPremiumPriceId,
  getStripe,
} from "@/lib/stripe";

const TRIAL_PERIOD_DAYS = 30;

function billingReturnUrl(
  workspaceId: string,
  checkout: "success" | "cancel",
): string {
  const base = getBillingReturnUrlBase();
  const params = new URLSearchParams({
    workspaceId,
    checkout,
  });
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${params.toString()}`;
}

/** True if this Stripe Customer has ever had any subscription (any status). */
async function customerHasSubscriptionHistory(
  stripe: Stripe,
  customerId: string,
): Promise<boolean> {
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  return existing.data.length > 0;
}

export async function createCheckoutSession(input: {
  workspaceId: string;
  userId: string;
}): Promise<{ url: string }> {
  const { membership } = await authorize(input.workspaceId, input.userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can manage billing.",
  );

  const entitlement = await getWorkspaceEntitlement(input.workspaceId);
  if (entitlement.isPremium) {
    throw conflict("Workspace already has an active Premium subscription.");
  }

  const stripe = getStripe();
  const priceId = getPremiumPriceId();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: input.userId },
    select: { email: true },
  });

  let customerId = entitlement.stripeCustomerId;
  let eligibleForTrial = !customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { workspaceId: input.workspaceId },
    });
    customerId = customer.id;

    // Persist customer id early (not Premium until webhook sets active/trialing).
    await prisma.subscription.upsert({
      where: { workspaceId: input.workspaceId },
      create: {
        workspaceId: input.workspaceId,
        status: "cancelled",
        stripeCustomerId: customerId,
      },
      update: {
        stripeCustomerId: customerId,
      },
    });
  } else {
    // Stripe is source of truth: any prior subscription → no second trial.
    eligibleForTrial = !(await customerHasSubscriptionHistory(
      stripe,
      customerId,
    ));
  }

  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
    {
      metadata: { workspaceId: input.workspaceId },
      ...(eligibleForTrial
        ? { trial_period_days: TRIAL_PERIOD_DAYS }
        : {}),
    };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: input.workspaceId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: subscriptionData,
    metadata: { workspaceId: input.workspaceId },
    success_url: billingReturnUrl(input.workspaceId, "success"),
    cancel_url: billingReturnUrl(input.workspaceId, "cancel"),
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw validationError("Stripe Checkout did not return a URL.");
  }

  return { url: session.url };
}
