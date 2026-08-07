import type {
  BillingInterval,
  BillingProviderId,
  PlatformBillingChannel,
  ProductCatalogId,
} from "./product-catalog";

/** Purchase / entitlement write statuses (mirror Prisma BillingPurchaseStatus). */
export type BillingPurchaseStatus =
  | "pending"
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired"
  | "revoked"
  | "superseded";

export type BillingCapability = {
  supportsPurchase: boolean;
  supportsTrial: boolean;
  supportsRestore: boolean;
  supportsManage: boolean;
  supportsManageExternally: boolean;
  supportsUpgrade: boolean;
  supportsDowngrade: boolean;
  priceSource: "store" | "backend";
  purchaseMode: "native_iap" | "checkout_url";
};

export type PurchaseUnavailableReason =
  | "COMING_SOON"
  | "STORE_NOT_SUPPORTED";

export type BillingProductSource = "store" | "cache" | "fallback";

/** UI-facing product DTO — sorted by ProductRepository; no sortOrder field. */
export type BillingProduct = {
  productId: ProductCatalogId;
  displayName: string;
  displayPrice: string;
  currency: string | null;
  billingInterval: BillingInterval;
  isAvailable: boolean;
  source: BillingProductSource;
  introductoryOffer?: { displayPrice: string; period?: string } | null;
};

/** Shared fields for ApplyPurchase — providerMetadata is raw store/API only. */
export type PurchaseApplyBase = {
  providerId: BillingProviderId;
  externalId: string;
  productId: ProductCatalogId;
  status: BillingPurchaseStatus;
  expiresAt: Date | null;
  purchasedAt: Date | null;
  /** RAW store/API response ONLY — never local flags / app status / business fields */
  providerMetadata: Record<string, unknown>;
  linkedExternalId?: string | null;
};

export type PurchaseSnapshot = PurchaseApplyBase & {
  kind: "purchase";
  requiresAcknowledgement: boolean;
};

export type SubscriptionSnapshot = PurchaseApplyBase & {
  kind: "subscription";
};

export type ApplyInput = PurchaseSnapshot | SubscriptionSnapshot;

export type ProviderDecision = {
  platform: string;
  channel: PlatformBillingChannel;
  providerId: BillingProviderId;
  why: string;
};
