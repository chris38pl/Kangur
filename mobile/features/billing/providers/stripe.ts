import type {
  BillingCapability,
  BillingProduct,
  ProductCatalogId,
  PurchaseUnavailableReason,
} from "@shared/billing";
import { DEFAULT_PREMIUM_PRODUCT, listCatalogProductsSorted } from "@shared/billing";

import type { MobileBillingProvider, StoreProof } from "../types";

/**
 * Stripe mobile adapter — Checkout URL flow (Web / legacy).
 * purchase() is not used; BillingService uses createBillingCheckout for checkout_url mode.
 */
export class StripeMobileBillingProvider implements MobileBillingProvider {
  readonly id = "stripe" as const;

  capabilities(): BillingCapability {
    return {
      supportsPurchase: true,
      supportsTrial: true,
      supportsRestore: true,
      supportsManage: true,
      supportsManageExternally: true,
      supportsUpgrade: false,
      supportsDowngrade: false,
      priceSource: "backend",
      purchaseMode: "checkout_url",
    };
  }

  purchaseUnavailableReason(): PurchaseUnavailableReason | null {
    return null;
  }

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  async fetchProducts(): Promise<BillingProduct[]> {
    // Prices filled by ProductRepository from GET premium-price for default product
    return listCatalogProductsSorted().map((entry) => ({
      productId: entry.id,
      displayName: entry.displayNameKey,
      displayPrice: "",
      currency: null,
      billingInterval: entry.billingInterval,
      isAvailable: entry.id === DEFAULT_PREMIUM_PRODUCT,
      source: "fallback" as const,
    }));
  }

  async purchase(_productId: ProductCatalogId): Promise<StoreProof> {
    throw new Error("Stripe uses checkout_url mode — use BillingService.purchase");
  }

  async collectRestoreProofs(): Promise<StoreProof[]> {
    return [];
  }

  async finishPurchase(_proof: StoreProof): Promise<void> {}

  async openManage(): Promise<void> {
    // BillingService.manage opens portal URL
  }
}
