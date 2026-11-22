import assert from "node:assert/strict";
import test from "node:test";

import {
  describeRemovalFailure,
  isOnlyWorkspace,
  pickNextWorkspaceId,
  queryKeyMentionsWorkspace,
  removalModeForRole,
} from "./workspace-removal.ts";

test("owners delete, admins and members leave", () => {
  assert.equal(removalModeForRole("owner"), "delete");
  assert.equal(removalModeForRole("admin"), "leave");
  assert.equal(removalModeForRole("member"), "leave");
});

test("subscription conflict keeps the provider", () => {
  for (const provider of ["apple", "google", "stripe"] as const) {
    assert.deepEqual(
      describeRemovalFailure({
        code: "WORKSPACE_HAS_ACTIVE_SUBSCRIPTION",
        status: 409,
        details: { provider, billingOwnerIsYou: true },
      }),
      { kind: "active_subscription", provider, billingOwnerIsYou: true },
    );
  }
});

test("subscription paid by someone else is flagged", () => {
  assert.deepEqual(
    describeRemovalFailure({
      code: "WORKSPACE_HAS_ACTIVE_SUBSCRIPTION",
      details: { provider: "apple", billingOwnerIsYou: false },
    }),
    { kind: "active_subscription", provider: "apple", billingOwnerIsYou: false },
  );
});

test("unknown provider falls back to null", () => {
  assert.deepEqual(
    describeRemovalFailure({
      code: "WORKSPACE_HAS_ACTIVE_SUBSCRIPTION",
      details: { provider: null },
    }),
    { kind: "active_subscription", provider: null, billingOwnerIsYou: true },
  );
  assert.deepEqual(
    describeRemovalFailure({ code: "WORKSPACE_HAS_ACTIVE_SUBSCRIPTION" }),
    { kind: "active_subscription", provider: null, billingOwnerIsYou: true },
  );
});

test("other 409 codes map to their own copy", () => {
  assert.deepEqual(describeRemovalFailure({ code: "LAST_WORKSPACE" }), {
    kind: "last_workspace",
  });
  assert.deepEqual(describeRemovalFailure({ code: "OWNER_CANNOT_LEAVE" }), {
    kind: "owner_cannot_leave",
  });
  assert.deepEqual(describeRemovalFailure({ code: "NOT_FOUND" }), {
    kind: "not_found",
  });
});

test("anything else is a generic failure", () => {
  assert.deepEqual(describeRemovalFailure(new Error("boom")), {
    kind: "generic",
  });
  assert.deepEqual(describeRemovalFailure({ code: "NETWORK_ERROR" }), {
    kind: "generic",
  });
  assert.deepEqual(describeRemovalFailure(null), { kind: "generic" });
});

test("next workspace skips the removed one", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(pickNextWorkspaceId(list, "a"), "b");
  assert.equal(pickNextWorkspaceId(list, "b"), "a");
  assert.equal(pickNextWorkspaceId([{ id: "a" }], "a"), null);
  assert.equal(pickNextWorkspaceId(undefined, "a"), null);
});

test("only workspace needs a loaded list", () => {
  assert.equal(isOnlyWorkspace([{ id: "a" }], "a"), true);
  assert.equal(isOnlyWorkspace([{ id: "a" }, { id: "b" }], "a"), false);
  assert.equal(isOnlyWorkspace(undefined, "a"), false);
});

test("query keys for the removed workspace are found", () => {
  assert.equal(queryKeyMentionsWorkspace(["workspace-members", "a"], "a"), true);
  assert.equal(queryKeyMentionsWorkspace(["shopping-lists", "b"], "a"), false);
  assert.equal(queryKeyMentionsWorkspace(["workspaces"], "a"), false);
});
