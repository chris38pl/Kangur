/**
 * Premium product catalog — SSOT for display, feature sets, providerConfig, analytics.
 * Business code must not scatter raw store/Stripe price strings.
 */

export const FEATURE_SETS = {
  PREMIUM_V1: {
    id: "PREMIUM_V1",
    unlocks: [
      "unlimited_ai_credits",
      "full_history_depth",
      "ai_generate_from_history",
    ],
  },
} as const;

export type FeatureSetId = keyof typeof FEATURE_SETS;

export const PRODUCT_IDS = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY"] as const;
export type ProductCatalogId = (typeof PRODUCT_IDS)[number];

export type BillingProviderId = "google" | "apple" | "stripe";

export type BillingInterval = "month" | "year";

export type GoogleProviderConfig = {
  externalProductId: string;
  basePlanId: string;
};

export type AppleProviderConfig = {
  productId: string;
};

export type StripeProviderConfig = {
  /** Literal price id or `env:STRIPE_PRICE_…` placeholder resolved at runtime */
  priceId: string;
};

export type ProductProviderConfig = {
  google: GoogleProviderConfig;
  apple: AppleProviderConfig;
  stripe: StripeProviderConfig;
};

export type ProductCatalogEntry = {
  id: ProductCatalogId;
  displayNameKey: string;
  descriptionKey: string;
  featureSetId: FeatureSetId;
  billingInterval: BillingInterval;
  sortOrder: number;
  analyticsKey: string;
  providerConfig: ProductProviderConfig;
};

/**
 * Logical products. Stripe price IDs come from env at runtime
 * (`STRIPE_PRICE_PREMIUM_MONTHLY` / `STRIPE_PRICE_PREMIUM_YEARLY`);
 * catalog stores stable placeholders resolved by StripeProvider.
 */
export const PRODUCT_CATALOG: Record<ProductCatalogId, ProductCatalogEntry> = {
  PREMIUM_MONTHLY: {
    id: "PREMIUM_MONTHLY",
    displayNameKey: "billing.product.premiumMonthly",
    descriptionKey: "billing.product.premiumMonthlyDescription",
    featureSetId: "PREMIUM_V1",
    billingInterval: "month",
    sortOrder: 10,
    analyticsKey: "premium_monthly",
    providerConfig: {
      google: {
        externalProductId: "premium_monthly",
        basePlanId: "monthly",
      },
      apple: { productId: "premium_monthly" },
      stripe: { priceId: "env:STRIPE_PRICE_PREMIUM_MONTHLY" },
    },
  },
  PREMIUM_YEARLY: {
    id: "PREMIUM_YEARLY",
    displayNameKey: "billing.product.premiumYearly",
    descriptionKey: "billing.product.premiumYearlyDescription",
    featureSetId: "PREMIUM_V1",
    billingInterval: "year",
    sortOrder: 20,
    analyticsKey: "premium_yearly",
    providerConfig: {
      google: {
        externalProductId: "premium_yearly",
        basePlanId: "yearly",
      },
      apple: { productId: "premium_yearly" },
      stripe: { priceId: "env:STRIPE_PRICE_PREMIUM_YEARLY" },
    },
  },
};

export const DEFAULT_PREMIUM_PRODUCT: ProductCatalogId = "PREMIUM_MONTHLY";

export function getProduct(id: ProductCatalogId): ProductCatalogEntry {
  return PRODUCT_CATALOG[id];
}

export function featureSetForProduct(id: ProductCatalogId): FeatureSetId {
  return PRODUCT_CATALOG[id].featureSetId;
}

export function isProductCatalogId(value: string): value is ProductCatalogId {
  return (PRODUCT_IDS as readonly string[]).includes(value);
}

export function listCatalogProductsSorted(): ProductCatalogEntry[] {
  return PRODUCT_IDS.map((id) => PRODUCT_CATALOG[id]).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

/** Resolve catalog id from Google Play product id (subscription SKU). */
export function resolveProductIdFromGoogleSku(
  sku: string,
): ProductCatalogId | null {
  for (const id of PRODUCT_IDS) {
    if (PRODUCT_CATALOG[id].providerConfig.google.externalProductId === sku) {
      return id;
    }
  }
  return null;
}

/** Client build channel → BillingRegistry.resolveCurrent */
export type PlatformBillingChannel = "android" | "ios" | "web";

export function resolveProductIdFromStripePriceId(
  priceId: string,
  env: {
    monthly?: string | null;
    yearly?: string | null;
  } = {},
): ProductCatalogId {
  const monthly = env.monthly?.trim();
  const yearly = env.yearly?.trim();
  if (yearly && priceId === yearly) return "PREMIUM_YEARLY";
  if (monthly && priceId === monthly) return "PREMIUM_MONTHLY";
  return DEFAULT_PREMIUM_PRODUCT;
}
