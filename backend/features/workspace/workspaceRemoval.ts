import type {
  BillingProviderId,
  SubscriptionStatus,
  WorkspaceRole,
} from "@prisma/client";

/**
 * Pure rules for deleting or leaving a workspace. No Prisma / path aliases so
 * `node --test --experimental-strip-types` can run the tests directly.
 */

/**
 * Subscription statuses that the provider keeps charging unless someone
 * cancels: active, a trial that converts to paid, and a failed charge the
 * store or Stripe still retries.
 *
 * `cancelled` covers both "auto-renew off, paid period still running"
 * (Stripe cancel_at_period_end, Google SUBSCRIPTION_STATE_CANCELED) and
 * "ended". Neither charges again, so neither blocks.
 */
const RENEWING_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "trialing",
  "past_due",
]);

export type SubscriptionForRemoval = {
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  billingOwnerUserId: string | null;
  /** Provider of Subscription.activePurchase; null when unknown. */
  providerId: BillingProviderId | null;
};

export type RenewalVerdict =
  | { renewing: false }
  | {
      renewing: true;
      providerId: BillingProviderId | null;
      currentPeriodEnd: Date | null;
      billingOwnerUserId: string | null;
    };

/**
 * Apple keeps our stored status `active` after auto-renew is turned off, so
 * only Apple needs a live lookup to tell "will renew" from "cancelled".
 */
export function needsLiveRenewalCheck(
  sub: SubscriptionForRemoval | null | undefined,
): boolean {
  return (
    sub != null &&
    RENEWING_STATUSES.has(sub.status) &&
    sub.providerId === "apple"
  );
}

/**
 * @param liveAutoRenew Store answer for Apple: `false` = auto-renew off.
 *   `null`/`undefined` = no answer, so the stored status decides (fail closed).
 */
export function renewalVerdict(
  sub: SubscriptionForRemoval | null | undefined,
  liveAutoRenew?: boolean | null,
): RenewalVerdict {
  if (!sub || !RENEWING_STATUSES.has(sub.status)) return { renewing: false };
  if (liveAutoRenew === false) return { renewing: false };
  return {
    renewing: true,
    providerId: sub.providerId,
    currentPeriodEnd: sub.currentPeriodEnd,
    billingOwnerUserId: sub.billingOwnerUserId,
  };
}

export type RemovalBlocker =
  | { kind: "not_owner" }
  | { kind: "last_workspace" }
  | { kind: "owner_cannot_leave" }
  | {
      kind: "active_subscription";
      providerId: BillingProviderId | null;
      currentPeriodEnd: Date | null;
      billingOwnerIsCaller: boolean;
    };

function subscriptionBlocker(
  renewal: RenewalVerdict,
  callerUserId: string,
): RemovalBlocker | null {
  if (!renewal.renewing) return null;
  return {
    kind: "active_subscription",
    providerId: renewal.providerId,
    currentPeriodEnd: renewal.currentPeriodEnd,
    billingOwnerIsCaller: renewal.billingOwnerUserId === callerUserId,
  };
}

/**
 * Owner only. The last-workspace rule comes before billing: cancelling a
 * subscription would not make the user's only workspace deletable.
 */
export function deleteWorkspaceBlocker(input: {
  role: WorkspaceRole;
  callerUserId: string;
  /** Caller's memberships in other workspaces. */
  otherMembershipCount: number;
  renewal: RenewalVerdict;
}): RemovalBlocker | null {
  if (input.role !== "owner") return { kind: "not_owner" };
  if (input.otherMembershipCount < 1) return { kind: "last_workspace" };
  return subscriptionBlocker(input.renewal, input.callerUserId);
}

/**
 * Non-owners may leave. A member who pays for a renewing subscription must
 * cancel it first, or they keep paying for a workspace they cannot open.
 */
export function leaveWorkspaceBlocker(input: {
  role: WorkspaceRole;
  callerUserId: string;
  renewal: RenewalVerdict;
}): RemovalBlocker | null {
  if (input.role === "owner") return { kind: "owner_cannot_leave" };
  if (
    input.renewal.renewing &&
    input.renewal.billingOwnerUserId === input.callerUserId
  ) {
    return subscriptionBlocker(input.renewal, input.callerUserId);
  }
  return null;
}
