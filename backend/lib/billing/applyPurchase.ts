import type {
  BillingPurchaseStatus,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";
import {
  featureSetForProduct,
  type ApplyInput,
  type ProductCatalogId,
} from "@shared/billing";

import { prisma } from "@/lib/prisma";

import {
  recordDuplicatePurchase,
  recordOrphanPurchase,
  recordProviderMismatch,
} from "./monitoring";

function mapPurchaseStatusToSubscription(
  status: BillingPurchaseStatus,
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "pending":
    case "cancelled":
    case "expired":
    case "revoked":
    case "superseded":
    default:
      return "cancelled";
  }
}

export type ApplyPurchaseContext = {
  workspaceId: string;
  userId: string;
  /** Mark other active purchases for this workspace+provider as superseded. */
  supersedePrevious?: boolean;
  acknowledgedAt?: Date | null;
  /** When applying Google RTDN etc. — warn if workspace has different active provider */
  checkProviderMismatch?: boolean;
};

export type ApplyPurchaseResult = {
  purchaseId: string;
  productId: ProductCatalogId;
  status: BillingPurchaseStatus;
  expiresAt: Date | null;
  entitlementStatus: SubscriptionStatus;
};

/**
 * Single write entrypoint for BillingPurchase + entitlement.
 * Deterministic: same snapshot → same DB state. No emails / analytics / push.
 * Transactional: purchase + subscription commit together.
 */
export async function applyPurchase(
  snapshot: ApplyInput,
  context: ApplyPurchaseContext,
): Promise<ApplyPurchaseResult> {
  if (!context.workspaceId) {
    recordOrphanPurchase(snapshot.externalId);
    throw new Error("workspaceId required for billing purchase");
  }

  if (context.checkProviderMismatch) {
    await warnIfProviderMismatch(
      context.workspaceId,
      snapshot.providerId,
      snapshot.externalId,
    );
  }

  const featureSetAtPurchase = featureSetForProduct(snapshot.productId);
  const metadata = snapshot.providerMetadata as Prisma.InputJsonValue;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.billingPurchase.findUnique({
      where: {
        providerId_externalId: {
          providerId: snapshot.providerId,
          externalId: snapshot.externalId,
        },
      },
    });

    if (
      existing &&
      existing.status === snapshot.status &&
      existing.workspaceId === context.workspaceId
    ) {
      recordDuplicatePurchase(snapshot.providerId);
    }

    // Newest wins: if existing expiresAt is newer than snapshot, keep newer for RTDN races
    let status = snapshot.status;
    let expiresAt = snapshot.expiresAt;
    if (
      existing?.expiresAt &&
      snapshot.expiresAt &&
      existing.expiresAt > snapshot.expiresAt &&
      isEntitledStatus(existing.status) &&
      snapshot.kind === "subscription"
    ) {
      // Incoming snapshot is older — still apply status if revoked/expired is stronger
      if (!isTerminalLoss(snapshot.status)) {
        status = existing.status;
        expiresAt = existing.expiresAt;
      }
    }

    let purchaseId: string;

    if (existing) {
      if (
        snapshot.linkedExternalId &&
        snapshot.linkedExternalId !== snapshot.externalId
      ) {
        await tx.billingPurchase.updateMany({
          where: {
            providerId: snapshot.providerId,
            externalId: snapshot.linkedExternalId,
            status: {
              in: ["active", "trialing", "past_due", "cancelled", "pending"],
            },
          },
          data: { status: "superseded" },
        });
      }

      const updated = await tx.billingPurchase.update({
        where: { id: existing.id },
        data: {
          status,
          expiresAt,
          featureSetAtPurchase,
          productId: snapshot.productId,
          ...(context.acknowledgedAt !== undefined
            ? { acknowledgedAt: context.acknowledgedAt }
            : snapshot.kind === "purchase" && !snapshot.requiresAcknowledgement
              ? { acknowledgedAt: new Date() }
              : {}),
          payload: metadata,
        },
      });
      purchaseId = updated.id;
    } else {
      if (context.supersedePrevious !== false) {
        await tx.billingPurchase.updateMany({
          where: {
            workspaceId: context.workspaceId,
            providerId: snapshot.providerId,
            status: {
              in: ["active", "trialing", "past_due", "cancelled", "pending"],
            },
          },
          data: { status: "superseded" },
        });
      }

      if (snapshot.linkedExternalId) {
        await tx.billingPurchase.updateMany({
          where: {
            providerId: snapshot.providerId,
            externalId: snapshot.linkedExternalId,
          },
          data: { status: "superseded" },
        });
      }

      const created = await tx.billingPurchase.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          providerId: snapshot.providerId,
          productId: snapshot.productId,
          externalId: snapshot.externalId,
          status,
          expiresAt,
          featureSetAtPurchase,
          acknowledgedAt:
            context.acknowledgedAt ??
            (snapshot.kind === "purchase" && !snapshot.requiresAcknowledgement
              ? new Date()
              : null),
          payload: metadata,
        },
      });
      purchaseId = created.id;
    }

    const entitlementStatus = await updateEntitlementInTx(tx, {
      workspaceId: context.workspaceId,
      userId: context.userId,
      productId: snapshot.productId,
      featureSetAtPurchase,
      purchaseId,
      purchaseStatus: status,
      expiresAt,
    });

    return {
      purchaseId,
      productId: snapshot.productId,
      status,
      expiresAt,
      entitlementStatus,
    };
  });
}

function isEntitledStatus(status: BillingPurchaseStatus): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

function isTerminalLoss(status: BillingPurchaseStatus): boolean {
  return (
    status === "expired" ||
    status === "revoked" ||
    status === "cancelled" ||
    status === "superseded"
  );
}

async function warnIfProviderMismatch(
  workspaceId: string,
  incomingProviderId: string,
  externalId: string,
): Promise<void> {
  const active = await prisma.billingPurchase.findFirst({
    where: {
      workspaceId,
      status: { in: ["active", "trialing", "past_due"] },
      NOT: { providerId: incomingProviderId as never },
    },
    select: { providerId: true, externalId: true },
  });
  if (active) {
    recordProviderMismatch({
      workspaceId,
      incomingProviderId,
      existingProviderId: active.providerId,
      externalId,
    });
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Entitlement policy — separate from purchase persistence.
 * Same transaction as ApplyPurchase on MVP.
 */
export async function updateEntitlementInTx(
  tx: Tx,
  input: {
    workspaceId: string;
    userId: string;
    productId: ProductCatalogId;
    featureSetAtPurchase: string;
    purchaseId: string;
    purchaseStatus: BillingPurchaseStatus;
    expiresAt: Date | null;
  },
): Promise<SubscriptionStatus> {
  const subStatus = mapPurchaseStatusToSubscription(input.purchaseStatus);

  await tx.subscription.upsert({
    where: { workspaceId: input.workspaceId },
    create: {
      workspaceId: input.workspaceId,
      status: subStatus,
      productId: input.productId,
      featureSetAtPurchase: input.featureSetAtPurchase,
      billingOwnerUserId: input.userId,
      activePurchaseId: input.purchaseId,
      currentPeriodEnd: input.expiresAt,
    },
    update: {
      status: subStatus,
      productId: input.productId,
      featureSetAtPurchase: input.featureSetAtPurchase,
      billingOwnerUserId: input.userId,
      activePurchaseId: input.purchaseId,
      currentPeriodEnd: input.expiresAt,
    },
  });

  return subStatus;
}

/**
 * @deprecated Prefer applyPurchase — kept for gradual Stripe migration callers.
 */
export async function upsertPurchaseAndEntitlement(input: {
  workspaceId: string;
  userId: string;
  providerId: import("@prisma/client").BillingProviderId;
  productId: ProductCatalogId;
  externalId: string;
  status: BillingPurchaseStatus;
  expiresAt: Date | null;
  payload?: Prisma.InputJsonValue;
  acknowledgedAt?: Date | null;
  supersedePrevious?: boolean;
}): Promise<{ purchaseId: string }> {
  const result = await applyPurchase(
    {
      kind: "subscription",
      providerId: input.providerId,
      externalId: input.externalId,
      productId: input.productId,
      status: input.status,
      expiresAt: input.expiresAt,
      purchasedAt: null,
      providerMetadata:
        input.payload && typeof input.payload === "object"
          ? (input.payload as Record<string, unknown>)
          : {},
    },
    {
      workspaceId: input.workspaceId,
      userId: input.userId,
      supersedePrevious: input.supersedePrevious,
      acknowledgedAt: input.acknowledgedAt,
    },
  );
  return { purchaseId: result.purchaseId };
}
