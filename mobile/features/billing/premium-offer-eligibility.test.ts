import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  shouldOfferPremiumAfterWin,
  type PremiumOfferInput,
} from "./premium-offer-eligibility.ts";

const base: PremiumOfferInput = {
  platformOS: "android",
  purchasesAvailable: true,
  flagEnabled: true,
  alreadyShown: false,
  appliedCount: 12,
  workspace: { plan: "free", role: "owner", billingStatus: "none" },
};

describe("shouldOfferPremiumAfterWin", () => {
  it("offers to a free owner after the first win on a phone", () => {
    assert.equal(shouldOfferPremiumAfterWin(base), true);
    assert.equal(
      shouldOfferPremiumAfterWin({ ...base, platformOS: "ios" }),
      true,
    );
    assert.equal(
      shouldOfferPremiumAfterWin({
        ...base,
        workspace: { ...base.workspace!, role: "admin" },
      }),
      true,
    );
  });

  it("never offers on the web or without store purchases", () => {
    assert.equal(shouldOfferPremiumAfterWin({ ...base, platformOS: "web" }), false);
    assert.equal(
      shouldOfferPremiumAfterWin({ ...base, purchasesAvailable: false }),
      false,
    );
  });

  it("respects the flag, the once gate and an empty import", () => {
    assert.equal(shouldOfferPremiumAfterWin({ ...base, flagEnabled: false }), false);
    assert.equal(shouldOfferPremiumAfterWin({ ...base, alreadyShown: true }), false);
    assert.equal(shouldOfferPremiumAfterWin({ ...base, appliedCount: 0 }), false);
  });

  it("skips members, Premium and former subscribers", () => {
    assert.equal(
      shouldOfferPremiumAfterWin({
        ...base,
        workspace: { ...base.workspace!, role: "member" },
      }),
      false,
    );
    assert.equal(
      shouldOfferPremiumAfterWin({
        ...base,
        workspace: { ...base.workspace!, plan: "premium", billingStatus: "trialing" },
      }),
      false,
    );
    assert.equal(
      shouldOfferPremiumAfterWin({
        ...base,
        workspace: { ...base.workspace!, billingStatus: "expired" },
      }),
      false,
    );
    assert.equal(shouldOfferPremiumAfterWin({ ...base, workspace: null }), false);
  });
});
