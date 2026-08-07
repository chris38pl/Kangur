import {
  getProduct,
  listCatalogProductsSorted,
  type BillingProduct,
  type ProductCatalogId,
} from "@shared/billing";

import { productCache } from "./product-cache";
import { MobileBillingRegistry } from "./registry";
import { getPremiumPrice } from "./api";

/**
 * Isolates product listing from purchase logic.
 * Future: Remote Config, A/B, promotions, regions.
 */
export const ProductRepository = {
  async list(options?: {
    forceRefresh?: boolean;
    authToken?: string | null;
  }): Promise<{
    products: BillingProduct[];
    cacheHit: boolean;
    durationMs: number;
    meta: ReturnType<typeof productCache.meta>;
  }> {
    const provider = MobileBillingRegistry.resolveCurrent();
    const caps = provider.capabilities();

    const fetchFn = async (): Promise<BillingProduct[]> => {
      if (caps.priceSource === "backend" && options?.authToken) {
        try {
          const price = await getPremiumPrice(options.authToken);
          return listCatalogProductsSorted().map((entry) => {
            const isDefault = entry.id === "PREMIUM_MONTHLY";
            return {
              productId: entry.id,
              displayName: entry.displayNameKey,
              displayPrice: isDefault ? price.formatted : "",
              currency: isDefault ? price.currency : null,
              billingInterval: entry.billingInterval,
              isAvailable: isDefault,
              source: "store" as const,
            };
          });
        } catch {
          return provider.fetchProducts();
        }
      }
      return provider.fetchProducts();
    };

    const result = options?.forceRefresh
      ? {
          products: await productCache.forceRefresh(fetchFn),
          cacheHit: false,
          durationMs: 0,
        }
      : await productCache.getOrRefresh(fetchFn);

    // Sort by catalog sortOrder (DTO has no sortOrder field)
    const order = new Map(
      listCatalogProductsSorted().map((p, i) => [p.id, i]),
    );
    const products = [...result.products].sort(
      (a, b) => (order.get(a.productId) ?? 99) - (order.get(b.productId) ?? 99),
    );

    return {
      products,
      cacheHit: result.cacheHit,
      durationMs: result.durationMs,
      meta: productCache.meta(),
    };
  },

  async get(
    productId: ProductCatalogId,
    options?: { authToken?: string | null },
  ): Promise<BillingProduct | null> {
    const { products } = await this.list(options);
    return products.find((p) => p.productId === productId) ?? null;
  },

  catalogFallback(productId: ProductCatalogId): BillingProduct {
    const entry = getProduct(productId);
    return {
      productId: entry.id,
      displayName: entry.displayNameKey,
      displayPrice: "",
      currency: null,
      billingInterval: entry.billingInterval,
      isAvailable: false,
      source: "fallback",
    };
  },
};
