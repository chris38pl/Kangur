import type {
  BillingCapability,
  BillingProduct,
  ProductCatalogId,
  PurchaseUnavailableReason,
} from "@shared/billing";
import { listCatalogProductsSorted } from "@shared/billing";

import type { MobileBillingProvider, StoreProof } from "../types";

/**
 * Apple stub — purchase disabled until App Store IAP.
 */
export class AppleMobileBillingProvider implements MobileBillingProvider {
  readonly id = "apple" as const;

  capabilities(): BillingCapability {
    return {
      supportsPurchase: false,
      supportsTrial: false,
      supportsRestore: false,
      supportsManage: false,
      supportsManageExternally: true,
      supportsUpgrade: false,
      supportsDowngrade: false,
      priceSource: "store",
      purchaseMode: "native_iap",
    };
  }

  purchaseUnavailableReason(): PurchaseUnavailableReason | null {
    return "COMING_SOON";
  }

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  async fetchProducts(): Promise<BillingProduct[]> {
    return listCatalogProductsSorted().map((entry) => ({
      productId: entry.id,
      displayName: entry.displayNameKey,
      displayPrice: "",
      currency: null,
      billingInterval: entry.billingInterval,
      isAvailable: false,
      source: "fallback" as const,
    }));
  }

  async purchase(_productId: ProductCatalogId): Promise<StoreProof> {
    throw new Error("Apple IAP not available yet");
  }

  async collectRestoreProofs(): Promise<StoreProof[]> {
    return [];
  }

  async finishPurchase(_proof: StoreProof): Promise<void> {}

  async openManage(): Promise<void> {
    // Settings → Subscriptions on device; deep link varies by iOS version
  }
}
