/**
 * Smoke: ProductCatalog providerConfig + BillingRegistry.
 * Run: pnpm exec tsx scripts/smoke-billing-platform.ts
 */
import assert from "node:assert/strict";

import {
  DEFAULT_PREMIUM_PRODUCT,
  FEATURE_SETS,
  PRODUCT_CATALOG,
  featureSetForProduct,
  listCatalogProductsSorted,
  resolveProductIdFromAppleSku,
  resolveProductIdFromGoogleSku,
  resolveProductIdFromStripePriceId,
} from "@shared/billing";
import { mapAppleSubscription } from "@/lib/billing/apple/mapAppleSubscription";
import { BillingRegistry } from "@/lib/billing/registry";

assert.equal(PRODUCT_CATALOG.PREMIUM_MONTHLY.featureSetId, "PREMIUM_V1");
assert.equal(featureSetForProduct("PREMIUM_YEARLY"), "PREMIUM_V1");
assert.ok(FEATURE_SETS.PREMIUM_V1.unlocks.includes("unlimited_ai_credits"));
assert.equal(DEFAULT_PREMIUM_PRODUCT, "PREMIUM_MONTHLY");
assert.equal(
  PRODUCT_CATALOG.PREMIUM_MONTHLY.providerConfig.google.basePlanId,
  "monthly",
);
assert.equal(
  PRODUCT_CATALOG.PREMIUM_YEARLY.providerConfig.google.externalProductId,
  "premium_yearly",
);
assert.equal(resolveProductIdFromGoogleSku("premium_monthly"), "PREMIUM_MONTHLY");
assert.equal(resolveProductIdFromAppleSku("premium_monthly"), "PREMIUM_MONTHLY");
assert.equal(resolveProductIdFromAppleSku("premium_yearly"), "PREMIUM_YEARLY");
assert.equal(resolveProductIdFromAppleSku("unknown"), null);
assert.equal(listCatalogProductsSorted()[0].id, "PREMIUM_MONTHLY");

assert.equal(BillingRegistry.resolveCurrent("android").id, "google");
assert.equal(BillingRegistry.resolveCurrent("ios").id, "apple");
assert.equal(BillingRegistry.resolveCurrent("web").id, "stripe");
assert.equal(BillingRegistry.resolve("google").capabilities().purchaseMode, "native_iap");
assert.equal(BillingRegistry.resolve("apple").capabilities().supportsPurchase, true);
assert.equal(BillingRegistry.resolve("apple").capabilities().supportsTrial, true);
assert.equal(BillingRegistry.resolve("apple").capabilities().purchaseMode, "native_iap");

const future = Date.now() + 86_400_000;
const trial = mapAppleSubscription({
  transaction: {
    originalTransactionId: "orig",
    transactionId: "tx",
    productId: "premium_monthly",
    purchaseDate: 1_700_000_000_000,
    expiresDate: future,
    offerType: 1,
    offerDiscountType: "FREE_TRIAL",
  },
  status: 1,
});
assert.equal(trial.status, "trialing");
assert.ok(trial.expiresAt && trial.expiresAt.getTime() === future);

const paid = mapAppleSubscription({
  transaction: {
    originalTransactionId: "orig",
    transactionId: "tx2",
    productId: "premium_monthly",
    purchaseDate: 1_700_000_000_000,
    expiresDate: future,
  },
  status: 1,
});
assert.equal(paid.status, "active");

const grace = mapAppleSubscription({
  transaction: {
    originalTransactionId: "orig",
    transactionId: "tx3",
    productId: "premium_monthly",
    expiresDate: future,
  },
  status: 4,
});
assert.equal(grace.status, "active");

const revoked = mapAppleSubscription({
  transaction: {
    originalTransactionId: "orig",
    transactionId: "tx4",
    productId: "premium_monthly",
    expiresDate: future,
    revocationDate: Date.now() - 1000,
  },
  status: 5,
});
assert.equal(revoked.status, "expired");
assert.ok(revoked.expiresAt && revoked.expiresAt.getTime() <= Date.now());

assert.equal(
  resolveProductIdFromStripePriceId("price_year", {
    monthly: "price_month",
    yearly: "price_year",
  }),
  "PREMIUM_YEARLY",
);

console.log("smoke-billing-platform: ok");
