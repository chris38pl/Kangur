import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteWorkspaceBlocker,
  leaveWorkspaceBlocker,
  needsLiveRenewalCheck,
  renewalVerdict,
  type SubscriptionForRemoval,
} from "./workspaceRemoval.ts";

const PERIOD_END = new Date("2026-12-22T00:00:00.000Z");

function sub(
  overrides: Partial<SubscriptionForRemoval> = {},
): SubscriptionForRemoval {
  return {
    status: "active",
    currentPeriodEnd: PERIOD_END,
    billingOwnerUserId: "owner",
    providerId: "stripe",
    ...overrides,
  };
}

test("no subscription never blocks", () => {
  assert.deepEqual(renewalVerdict(null), { renewing: false });
  assert.deepEqual(renewalVerdict(undefined), { renewing: false });
});

test("active, trialing and past_due will renew", () => {
  for (const status of ["active", "trialing", "past_due"] as const) {
    const verdict = renewalVerdict(sub({ status }));
    assert.equal(verdict.renewing, true, status);
  }
});

test("cancelled inside the paid period does not renew", () => {
  // Stripe cancel_at_period_end and Google SUBSCRIPTION_STATE_CANCELED land here.
  assert.deepEqual(renewalVerdict(sub({ status: "cancelled" })), {
    renewing: false,
  });
});

test("only Apple needs the live auto-renew lookup", () => {
  assert.equal(needsLiveRenewalCheck(sub({ providerId: "apple" })), true);
  assert.equal(needsLiveRenewalCheck(sub({ providerId: "google" })), false);
  assert.equal(needsLiveRenewalCheck(sub({ providerId: "stripe" })), false);
  assert.equal(
    needsLiveRenewalCheck(sub({ providerId: "apple", status: "cancelled" })),
    false,
  );
  assert.equal(needsLiveRenewalCheck(null), false);
});

test("Apple with auto-renew off may be deleted", () => {
  const apple = sub({ providerId: "apple" });
  assert.deepEqual(renewalVerdict(apple, false), { renewing: false });
});

test("Apple without a live answer fails closed", () => {
  const apple = sub({ providerId: "apple" });
  assert.equal(renewalVerdict(apple, null).renewing, true);
  assert.equal(renewalVerdict(apple, undefined).renewing, true);
  assert.equal(renewalVerdict(apple, true).renewing, true);
});

test("only the owner can delete", () => {
  for (const role of ["admin", "member"] as const) {
    assert.deepEqual(
      deleteWorkspaceBlocker({
        role,
        callerUserId: "u",
        otherMembershipCount: 3,
        renewal: { renewing: false },
      }),
      { kind: "not_owner" },
    );
  }
});

test("the owner's last workspace cannot be deleted", () => {
  assert.deepEqual(
    deleteWorkspaceBlocker({
      role: "owner",
      callerUserId: "owner",
      otherMembershipCount: 0,
      renewal: renewalVerdict(sub()),
    }),
    { kind: "last_workspace" },
  );
});

test("a renewing subscription blocks delete and names the provider", () => {
  assert.deepEqual(
    deleteWorkspaceBlocker({
      role: "owner",
      callerUserId: "owner",
      otherMembershipCount: 1,
      renewal: renewalVerdict(sub({ providerId: "google" })),
    }),
    {
      kind: "active_subscription",
      providerId: "google",
      currentPeriodEnd: PERIOD_END,
      billingOwnerIsCaller: true,
    },
  );
});

test("a subscription bought by another member is reported as theirs", () => {
  const blocker = deleteWorkspaceBlocker({
    role: "owner",
    callerUserId: "owner",
    otherMembershipCount: 1,
    renewal: renewalVerdict(sub({ billingOwnerUserId: "admin" })),
  });
  assert.equal(blocker?.kind, "active_subscription");
  assert.equal(
    blocker?.kind === "active_subscription" && blocker.billingOwnerIsCaller,
    false,
  );
});

test("owner with another workspace and no renewal may delete", () => {
  assert.equal(
    deleteWorkspaceBlocker({
      role: "owner",
      callerUserId: "owner",
      otherMembershipCount: 1,
      renewal: renewalVerdict(sub({ status: "cancelled" })),
    }),
    null,
  );
});

test("the owner cannot leave", () => {
  assert.deepEqual(
    leaveWorkspaceBlocker({
      role: "owner",
      callerUserId: "owner",
      renewal: { renewing: false },
    }),
    { kind: "owner_cannot_leave" },
  );
});

test("members and admins may leave a workspace someone else pays for", () => {
  for (const role of ["admin", "member"] as const) {
    assert.equal(
      leaveWorkspaceBlocker({
        role,
        callerUserId: "member",
        renewal: renewalVerdict(sub({ billingOwnerUserId: "owner" })),
      }),
      null,
      role,
    );
  }
});

test("a member who pays for a renewing subscription must cancel first", () => {
  const blocker = leaveWorkspaceBlocker({
    role: "admin",
    callerUserId: "admin",
    renewal: renewalVerdict(
      sub({ billingOwnerUserId: "admin", providerId: "apple" }),
    ),
  });
  assert.deepEqual(blocker, {
    kind: "active_subscription",
    providerId: "apple",
    currentPeriodEnd: PERIOD_END,
    billingOwnerIsCaller: true,
  });
});

test("a payer whose subscription is cancelled may leave", () => {
  assert.equal(
    leaveWorkspaceBlocker({
      role: "admin",
      callerUserId: "admin",
      renewal: renewalVerdict(
        sub({ billingOwnerUserId: "admin", status: "cancelled" }),
      ),
    }),
    null,
  );
});
