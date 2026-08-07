import type {
  ApplyInput,
  BillingCapability,
  BillingProviderId,
  ProductCatalogId,
  PurchaseSnapshot,
  SubscriptionSnapshot,
} from "@shared/billing";

export type {
  ApplyInput,
  BillingCapability,
  BillingProviderId,
  PurchaseSnapshot,
  SubscriptionSnapshot,
};

export type VerifyPurchaseInput = {
  workspaceId: string;
  userId: string;
  productId: ProductCatalogId;
  proof: Record<string, unknown>;
};

export type ManageSubscriptionInput = {
  workspaceId: string;
  userId: string;
};

export type ManageSubscriptionResult = {
  url: string;
};

/**
 * Backend billing adapter — no initialize/dispose (stateless API clients).
 * Writes go through ApplyPurchase, never inside the provider.
 */
export interface BackendBillingProvider {
  readonly id: BillingProviderId;

  capabilities(): BillingCapability;

  verifyPurchase(input: VerifyPurchaseInput): Promise<PurchaseSnapshot>;

  acknowledge(input: {
    externalId: string;
    proof?: Record<string, unknown>;
  }): Promise<void>;

  getSubscription(input: {
    externalId: string;
    /** Optional product SKU hint for providers that need it */
    productId?: ProductCatalogId;
  }): Promise<SubscriptionSnapshot | null>;

  manage(input: ManageSubscriptionInput): Promise<ManageSubscriptionResult>;
}

/** @deprecated Use BackendBillingProvider */
export type BillingProvider = BackendBillingProvider;
