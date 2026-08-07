import { authorize, requireRole } from "@/lib/authorize";
import { validationError } from "@/lib/auth/errors";
import { getStripeCustomerIdForWorkspace } from "@/lib/billing";
import { getBillingReturnUrlBase, getStripe } from "@/lib/stripe";

function billingReturnUrl(workspaceId: string): string {
  const base = getBillingReturnUrlBase();
  const params = new URLSearchParams({ workspaceId });
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${params.toString()}`;
}

export async function createCustomerPortalSession(input: {
  workspaceId: string;
  userId: string;
}): Promise<{ url: string }> {
  const { membership } = await authorize(input.workspaceId, input.userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can manage billing.",
  );

  const customerId = await getStripeCustomerIdForWorkspace(input.workspaceId);
  if (!customerId) {
    throw validationError("No Stripe customer for this workspace yet.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: billingReturnUrl(input.workspaceId),
  });

  return { url: session.url };
}
