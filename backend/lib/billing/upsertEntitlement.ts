import type { BillingProviderId, Prisma } from "@prisma/client";
import { DEFAULT_PREMIUM_PRODUCT } from "@shared/billing";

import { prisma } from "@/lib/prisma";

export {
  applyPurchase,
  upsertPurchaseAndEntitlement,
  type ApplyPurchaseContext,
  type ApplyPurchaseResult,
} from "./applyPurchase";

/** Ensure a non-premium subscription shell exists (e.g. Stripe customer bootstrap). */
export async function ensureSubscriptionShell(input: {
  workspaceId: string;
  billingOwnerUserId?: string;
}): Promise<void> {
  await prisma.subscription.upsert({
    where: { workspaceId: input.workspaceId },
    create: {
      workspaceId: input.workspaceId,
      status: "cancelled",
      productId: DEFAULT_PREMIUM_PRODUCT,
      billingOwnerUserId: input.billingOwnerUserId ?? null,
    },
    update: {
      ...(input.billingOwnerUserId
        ? { billingOwnerUserId: input.billingOwnerUserId }
        : {}),
    },
  });
}

export async function appendBillingEvent(input: {
  providerId: BillingProviderId;
  type: string;
  externalId?: string | null;
  payload?: Prisma.InputJsonValue;
  processed?: boolean;
}): Promise<string> {
  const row = await prisma.billingEvent.create({
    data: {
      providerId: input.providerId,
      type: input.type,
      externalId: input.externalId ?? null,
      payload: input.payload ?? undefined,
      processedAt: input.processed ? new Date() : null,
    },
  });
  return row.id;
}

export async function getStripeCustomerIdForWorkspace(
  workspaceId: string,
): Promise<string | null> {
  const purchase = await prisma.billingPurchase.findFirst({
    where: {
      workspaceId,
      providerId: "stripe",
      status: { not: "superseded" },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!purchase?.payload || typeof purchase.payload !== "object") {
    if (purchase?.externalId.startsWith("customer:")) {
      return purchase.externalId.slice("customer:".length);
    }
    return null;
  }
  const payload = purchase.payload as Record<string, unknown>;
  const id = payload.stripeCustomerId;
  if (typeof id === "string") return id;
  if (purchase.externalId.startsWith("customer:")) {
    return purchase.externalId.slice("customer:".length);
  }
  return null;
}

export async function getStripeSubscriptionIdForWorkspace(
  workspaceId: string,
): Promise<string | null> {
  const purchase = await prisma.billingPurchase.findFirst({
    where: {
      workspaceId,
      providerId: "stripe",
      status: { not: "superseded" },
      NOT: { externalId: { startsWith: "customer:" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return purchase?.externalId ?? null;
}

export async function getGooglePurchaseTokenForWorkspace(
  workspaceId: string,
): Promise<string | null> {
  const purchase = await prisma.billingPurchase.findFirst({
    where: {
      workspaceId,
      providerId: "google",
      status: { in: ["active", "trialing", "past_due", "cancelled"] },
    },
    orderBy: { updatedAt: "desc" },
  });
  return purchase?.externalId ?? null;
}

export async function resolveBillingOwnerUserId(
  workspaceId: string,
): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { billingOwnerUserId: true },
  });
  if (sub?.billingOwnerUserId) return sub.billingOwnerUserId;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { createdByUserId: true },
  });
  return workspace?.createdByUserId ?? null;
}

export async function findWorkspaceIdByPurchaseToken(
  providerId: BillingProviderId,
  externalId: string,
): Promise<string | null> {
  const row = await prisma.billingPurchase.findUnique({
    where: {
      providerId_externalId: { providerId, externalId },
    },
    select: { workspaceId: true },
  });
  return row?.workspaceId ?? null;
}
