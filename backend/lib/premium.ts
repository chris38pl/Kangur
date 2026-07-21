import type { Subscription, SubscriptionStatus } from "@prisma/client";

import { premiumRequired } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";

export type EntitlementStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export type WorkspaceEntitlement = {
  plan: "free" | "premium";
  isPremium: boolean;
  status: EntitlementStatus;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type SubscriptionFields = Pick<
  Subscription,
  | "status"
  | "currentPeriodEnd"
  | "stripeCustomerId"
  | "stripeSubscriptionId"
>;

const PREMIUM_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "trialing",
]);

function mapStatus(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  now = new Date(),
): EntitlementStatus {
  if (status === "cancelled") {
    if (currentPeriodEnd && currentPeriodEnd.getTime() <= now.getTime()) {
      return "expired";
    }
    return "cancelled";
  }
  return status;
}

/** Pure mapping - same rules as DB lookup. Used by DTO when subscription is already loaded. */
export function entitlementFromSubscription(
  sub: SubscriptionFields | null | undefined,
  now = new Date(),
): WorkspaceEntitlement {
  if (!sub) {
    return {
      plan: "free",
      isPremium: false,
      status: "none",
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  const status = mapStatus(sub.status, sub.currentPeriodEnd, now);
  // Cancelled-but-not-expired still has Premium until currentPeriodEnd.
  const isPremium =
    PREMIUM_STATUSES.has(sub.status) ||
    (status === "cancelled" &&
      sub.currentPeriodEnd != null &&
      sub.currentPeriodEnd.getTime() > now.getTime());

  return {
    plan: isPremium ? "premium" : "free",
    isPremium,
    status,
    currentPeriodEnd: sub.currentPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
  };
}

/** Single source of truth for workspace Premium entitlement. */
export async function getWorkspaceEntitlement(
  workspaceId: string,
): Promise<WorkspaceEntitlement> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: {
      status: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
  return entitlementFromSubscription(sub);
}

export function isPremium(entitlement: WorkspaceEntitlement): boolean {
  return entitlement.isPremium;
}

export async function assertPremiumWorkspace(
  workspaceId: string,
): Promise<WorkspaceEntitlement> {
  const entitlement = await getWorkspaceEntitlement(workspaceId);
  if (!entitlement.isPremium) {
    throw premiumRequired();
  }
  return entitlement;
}
