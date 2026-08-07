import type {
  BillingCapability,
  ProductCatalogId,
  PurchaseSnapshot,
  SubscriptionSnapshot,
} from "@shared/billing";

import type {
  BackendBillingProvider,
  ManageSubscriptionInput,
  ManageSubscriptionResult,
  VerifyPurchaseInput,
} from "../types";

/**
 * Apple App Store adapter — stub until iOS IAP phase.
 */
export class AppleBillingProvider implements BackendBillingProvider {
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

  async verifyPurchase(
    _input: VerifyPurchaseInput,
  ): Promise<PurchaseSnapshot> {
    throw new Error("Apple verifyPurchase not implemented yet");
  }

  async acknowledge(_input: {
    externalId: string;
    proof?: Record<string, unknown>;
  }): Promise<void> {
    // ASN / StoreKit ack — wired with iOS IAP
  }

  async getSubscription(_input: {
    externalId: string;
    productId?: ProductCatalogId;
  }): Promise<SubscriptionSnapshot | null> {
    return null;
  }

  async manage(
    _input: ManageSubscriptionInput,
  ): Promise<ManageSubscriptionResult> {
    return {
      url: "https://apps.apple.com/account/subscriptions",
    };
  }
}
