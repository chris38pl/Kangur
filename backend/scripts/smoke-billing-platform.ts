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
  resolveProductIdFromGoogleSku,
  resolveProductIdFromStripePriceId,
} from "@shared/billing";
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
assert.equal(listCatalogProductsSorted()[0].id, "PREMIUM_MONTHLY");

assert.equal(BillingRegistry.resolveCurrent("android").id, "google");
assert.equal(BillingRegistry.resolveCurrent("ios").id, "apple");
assert.equal(BillingRegistry.resolveCurrent("web").id, "stripe");
assert.equal(BillingRegistry.resolve("google").capabilities().purchaseMode, "native_iap");
assert.equal(BillingRegistry.resolve("apple").capabilities().supportsPurchase, false);

assert.equal(
  resolveProductIdFromStripePriceId("price_year", {
    monthly: "price_month",
    yearly: "price_year",
  }),
  "PREMIUM_YEARLY",
);

console.log("smoke-billing-platform: ok");
