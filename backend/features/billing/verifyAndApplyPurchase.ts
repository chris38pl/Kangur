import { z } from "zod";
import {
  isProductCatalogId,
  type ProductCatalogId,
} from "@shared/billing";

import { Analytics } from "@/lib/analytics";
import { notFound, validationError } from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import {
  applyPurchase,
  BillingRegistry,
  recordPurchaseToEntitlementMs,
} from "@/lib/billing";
import { getWorkspaceEntitlement } from "@/lib/premium";

export const GoogleProofSchema = z.object({
  purchaseToken: z.string().min(1),
  packageName: z.string().min(1).optional(),
});

export const AppleProofSchema = z.object({
  transactionId: z.string().min(1),
});

export const StripeProofSchema = z
  .object({
    subscriptionId: z.string().min(1).optional(),
    checkoutSessionId: z.string().min(1).optional(),
  })
  .refine(
    (v) => Boolean(v.subscriptionId || v.checkoutSessionId),
    "subscriptionId or checkoutSessionId required",
  );

export const VerifyPurchaseBodySchema = z.object({
  provider: z.enum(["google", "apple", "stripe"]),
  productId: z.string().min(1),
  proof: z.unknown(),
});

function parseProof(
  provider: "google" | "apple" | "stripe",
  proof: unknown,
): Record<string, unknown> {
  switch (provider) {
    case "google":
      return GoogleProofSchema.parse(proof);
    case "apple":
      return AppleProofSchema.parse(proof);
    case "stripe":
      return StripeProofSchema.parse(proof);
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

/**
 * Provider-agnostic verify → optional acknowledge → ApplyPurchase.
 * Analytics emitted by this orchestrator after successful commit (not inside Apply).
 */
export async function verifyAndApplyPurchase(input: {
  workspaceId: string;
  userId: string;
  provider: "google" | "apple" | "stripe";
  productId: string;
  proof: unknown;
}): Promise<{
  plan: "free" | "premium";
  status: string;
  currentPeriodEnd: string | null;
  purchaseId: string;
  externalId: string;
}> {
  const { membership } = await authorize(input.workspaceId, input.userId);
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can manage billing.",
  );

  if (!isProductCatalogId(input.productId)) {
    throw validationError("Invalid productId.");
  }
  const productId = input.productId as ProductCatalogId;

  let proof: Record<string, unknown>;
  try {
    proof = parseProof(input.provider, input.proof);
  } catch {
    throw validationError("Invalid proof for provider.");
  }

  const provider = BillingRegistry.resolve(input.provider);
  const started = Date.now();

  const snapshot = await provider.verifyPurchase({
    workspaceId: input.workspaceId,
    userId: input.userId,
    productId,
    proof,
  });

  if (snapshot.requiresAcknowledgement) {
    await provider.acknowledge({
      externalId: snapshot.externalId,
      proof: {
        ...proof,
        productId: snapshot.productId,
        subscriptionId:
          typeof snapshot.providerMetadata === "object" &&
          Array.isArray(
            (snapshot.providerMetadata as { lineItems?: unknown }).lineItems,
          )
            ? (
                snapshot.providerMetadata as {
                  lineItems?: Array<{ productId?: string }>;
                }
              ).lineItems?.[0]?.productId
            : undefined,
      },
    });
  }

  const result = await applyPurchase(snapshot, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    supersedePrevious: true,
    acknowledgedAt: snapshot.requiresAcknowledgement ? new Date() : undefined,
    checkProviderMismatch: true,
  });

  recordPurchaseToEntitlementMs(input.provider, Date.now() - started);

  Analytics.track(
    "billing_apply_completed",
    {
      workspace_id: input.workspaceId,
      provider: input.provider,
      product_id: result.productId,
      status: result.status,
    },
    input.workspaceId,
  );

  const entitlement = await getWorkspaceEntitlement(input.workspaceId);
  return {
    plan: entitlement.plan,
    status: entitlement.status,
    currentPeriodEnd: entitlement.currentPeriodEnd
      ? entitlement.currentPeriodEnd.toISOString()
      : null,
    purchaseId: result.purchaseId,
    externalId: snapshot.externalId,
  };
}

export async function applySubscriptionSnapshot(input: {
  workspaceId: string;
  userId: string;
  provider: "google" | "apple" | "stripe";
  externalId: string;
}): Promise<void> {
  const provider = BillingRegistry.resolve(input.provider);
  const snapshot = await provider.getSubscription({
    externalId: input.externalId,
  });
  if (!snapshot) {
    throw notFound("Subscription not found at provider.");
  }
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
      provider: input.provider,
      product_id: result.productId,
      status: result.status,
    },
    input.workspaceId,
  );
}
