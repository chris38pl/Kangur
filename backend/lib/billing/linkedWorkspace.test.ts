import assert from "node:assert/strict";
import test from "node:test";

import { isStoreSubscriptionLinkedElsewhere } from "./linkedWorkspace.ts";

test("same workspace can refresh its own subscription", () => {
  assert.equal(isStoreSubscriptionLinkedElsewhere("ws-a", "ws-a"), false);
});

test("a new workspace cannot take a subscription already linked", () => {
  assert.equal(isStoreSubscriptionLinkedElsewhere("ws-a", "ws-b"), true);
});

test("the first claim has no existing workspace", () => {
  assert.equal(isStoreSubscriptionLinkedElsewhere(null, "ws-b"), false);
  assert.equal(isStoreSubscriptionLinkedElsewhere(undefined, "ws-b"), false);
  assert.equal(isStoreSubscriptionLinkedElsewhere("", "ws-b"), false);
});
