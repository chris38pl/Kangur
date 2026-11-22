import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REVIEW_COOLDOWN_MS,
  shouldRequestStoreReview,
} from "./review-prompt-eligibility.ts";

const now = Date.UTC(2026, 10, 22);
const base = {
  platformOS: "android",
  finishedCount: 2,
  boughtCount: 5,
  lastRequestedAtMs: null,
  nowMs: now,
};

describe("shouldRequestStoreReview", () => {
  it("asks after the second good trip", () => {
    assert.equal(shouldRequestStoreReview(base), true);
    assert.equal(shouldRequestStoreReview({ ...base, platformOS: "ios" }), true);
  });

  it("waits for two trips with at least three products", () => {
    assert.equal(shouldRequestStoreReview({ ...base, finishedCount: 1 }), false);
    assert.equal(shouldRequestStoreReview({ ...base, boughtCount: 2 }), false);
  });

  it("keeps a cooldown and skips the web", () => {
    assert.equal(
      shouldRequestStoreReview({ ...base, lastRequestedAtMs: now - 1000 }),
      false,
    );
    assert.equal(
      shouldRequestStoreReview({
        ...base,
        lastRequestedAtMs: now - REVIEW_COOLDOWN_MS - 1,
      }),
      true,
    );
    assert.equal(shouldRequestStoreReview({ ...base, platformOS: "web" }), false);
  });
});
