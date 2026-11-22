import type { Prisma } from "@prisma/client";

import {
  forbidden,
  lastWorkspace,
  ownerCannotLeave,
  workspaceHasActiveSubscription,
  type ApiError,
} from "@/lib/auth/errors";
import { loadAppleAutoRenewEnabled } from "@/lib/billing/apple/api";
import { prisma } from "@/lib/prisma";

import {
  needsLiveRenewalCheck,
  renewalVerdict,
  type RemovalBlocker,
  type RenewalVerdict,
  type SubscriptionForRemoval,
} from "./workspaceRemoval";

type Db = Prisma.TransactionClient | typeof prisma;

export type StoredSubscription = {
  sub: SubscriptionForRemoval;
  /** activePurchase.externalId, e.g. Apple originalTransactionId. */
  externalId: string | null;
};

export async function loadStoredSubscription(
  db: Db,
  workspaceId: string,
): Promise<StoredSubscription | null> {
  const row = await db.subscription.findUnique({
    where: { workspaceId },
    select: {
      status: true,
      currentPeriodEnd: true,
      billingOwnerUserId: true,
      activePurchase: { select: { providerId: true, externalId: true } },
    },
  });
  if (!row) return null;
  return {
    sub: {
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd,
      billingOwnerUserId: row.billingOwnerUserId,
      providerId: row.activePurchase?.providerId ?? null,
    },
    externalId: row.activePurchase?.externalId ?? null,
  };
}

export type ResolvedRenewal = {
  verdict: RenewalVerdict;
  stored: StoredSubscription | null;
  /** Apple's live answer, reused when re-checking inside the transaction. */
  liveAutoRenew: boolean | null;
};

/** Stored subscription plus, for Apple, a live auto-renew lookup. */
export async function resolveWorkspaceRenewal(
  workspaceId: string,
): Promise<ResolvedRenewal> {
  const stored = await loadStoredSubscription(prisma, workspaceId);
  let liveAutoRenew: boolean | null = null;
  if (stored && needsLiveRenewalCheck(stored.sub) && stored.externalId) {
    liveAutoRenew = await loadAppleAutoRenewEnabled(stored.externalId);
  }
  return {
    verdict: renewalVerdict(stored?.sub, liveAutoRenew),
    stored,
    liveAutoRenew,
  };
}

/**
 * Same verdict from a fresh read inside the transaction. The live Apple answer
 * only counts while the active purchase is unchanged; a purchase that landed
 * meanwhile is treated as renewing.
 */
export async function recheckRenewalInTx(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  before: ResolvedRenewal,
): Promise<RenewalVerdict> {
  const fresh = await loadStoredSubscription(tx, workspaceId);
  const samePurchase =
    fresh?.externalId != null &&
    fresh.externalId === before.stored?.externalId;
  return renewalVerdict(fresh?.sub, samePurchase ? before.liveAutoRenew : null);
}

export function removalBlockerError(
  blocker: RemovalBlocker,
  action: "delete" | "leave",
): ApiError {
  switch (blocker.kind) {
    case "not_owner":
      return forbidden("Only the owner can delete this workspace.");
    case "last_workspace":
      return lastWorkspace();
    case "owner_cannot_leave":
      return ownerCannotLeave(
        "The owner cannot leave the workspace. Delete it instead.",
      );
    case "active_subscription":
      return workspaceHasActiveSubscription(
        action === "delete"
          ? "Cancel the Premium subscription before deleting this workspace."
          : "Cancel the Premium subscription you pay for before leaving this workspace.",
        {
          provider: blocker.providerId,
          currentPeriodEnd: blocker.currentPeriodEnd?.toISOString() ?? null,
          billingOwnerIsYou: blocker.billingOwnerIsCaller,
        },
      );
  }
}
