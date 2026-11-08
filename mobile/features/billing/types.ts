import type {
  BillingCapability,
  BillingProduct,
  BillingProviderId,
  PlatformBillingChannel,
  ProductCatalogId,
  PurchaseUnavailableReason,
} from "@shared/billing";

export type PurchaseState =
  | "idle"
  | "pending"
  | "verifying"
  | "restoring"
  | "active"
  | "failed";

export type StoreProof = {
  productId: ProductCatalogId;
  /** Google purchase token, or the App Store transaction id when `transactionId` is set. */
  purchaseToken: string;
  packageName?: string;
  /** App Store transaction id. The server stores originalTransactionId. */
  transactionId?: string;
  raw?: Record<string, unknown>;
};

/**
 * Mobile store adapter — lifecycle + store IO only.
 * Cache / TTL live in ProductRepository, not here.
 */
export interface MobileBillingProvider {
  readonly id: BillingProviderId;
  capabilities(): BillingCapability;
  purchaseUnavailableReason(): PurchaseUnavailableReason | null;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  fetchProducts(): Promise<BillingProduct[]>;
  purchase(productId: ProductCatalogId): Promise<StoreProof>;
  collectRestoreProofs(): Promise<StoreProof[]>;
  finishPurchase(proof: StoreProof): Promise<void>;
  openManage(): Promise<void>;
}

export type ProviderResolveInfo = {
  platform: string;
  channel: PlatformBillingChannel;
  providerId: BillingProviderId;
  why: string;
};
