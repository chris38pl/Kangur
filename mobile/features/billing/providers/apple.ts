import Constants from "expo-constants";
import * as Linking from "expo-linking";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type ProductSubscription,
  type ProductSubscriptionIOS,
  type Purchase,
} from "expo-iap";
import {
  getProduct,
  listCatalogProductsSorted,
  type BillingCapability,
  type BillingProduct,
  type ProductCatalogId,
  type PurchaseUnavailableReason,
} from "@shared/billing";

import type { MobileBillingProvider, StoreProof } from "../types";

const MANAGE_URL = "https://apps.apple.com/account/subscriptions";

function bundleId(): string {
  return Constants.expoConfig?.ios?.bundleIdentifier?.trim() || "app.kangur";
}

function catalogIdFromSku(sku: string): ProductCatalogId | null {
  for (const entry of listCatalogProductsSorted()) {
    if (entry.providerConfig.apple.productId === sku) return entry.id;
  }
  return null;
}

function isIosSubscription(
  product: ProductSubscription,
): product is ProductSubscriptionIOS {
  return product.platform === "ios";
}

function transactionIdOf(purchase: Purchase): string | null {
  if ("transactionId" in purchase && purchase.transactionId) {
    return purchase.transactionId;
  }
  if (
    "originalTransactionIdentifierIOS" in purchase &&
    purchase.originalTransactionIdentifierIOS
  ) {
    return purchase.originalTransactionIdentifierIOS;
  }
  return null;
}

function introductoryOfferOf(
  sub: ProductSubscriptionIOS,
): BillingProduct["introductoryOffer"] {
  const fromOffers = sub.subscriptionOffers?.find(
    (offer) => offer.type === "introductory",
  );
  const paymentMode =
    sub.introductoryPricePaymentModeIOS !== "empty"
      ? sub.introductoryPricePaymentModeIOS
      : (fromOffers?.paymentMode ?? null);
  if (!paymentMode || paymentMode === "unknown") {
    if (!fromOffers) return null;
  }
  const unit = sub.introductoryPriceSubscriptionPeriodIOS;
  const count = sub.introductoryPriceNumberOfPeriodsIOS;
  const period =
    unit && unit !== "empty"
      ? `${count ?? "1"} ${unit}`
      : fromOffers?.period
        ? `${fromOffers.period.value} ${fromOffers.period.unit}`
        : undefined;
  const displayPrice =
    paymentMode === "free-trial"
      ? sub.introductoryPriceIOS || fromOffers?.displayPrice || "0"
      : sub.introductoryPriceIOS || fromOffers?.displayPrice || "";
  if (!displayPrice && !paymentMode) return null;
  return {
    displayPrice: displayPrice || "0",
    period,
    paymentMode: paymentMode ?? fromOffers?.paymentMode ?? undefined,
    offerId: fromOffers?.id,
  };
}

function mapSubscription(
  sub: ProductSubscriptionIOS,
): BillingProduct | null {
  const productId = catalogIdFromSku(sub.id);
  if (!productId) return null;
  const catalog = getProduct(productId);
  return {
    productId,
    displayName: sub.displayNameIOS || sub.title || catalog.displayNameKey,
    displayPrice: sub.displayPrice || "",
    currency: sub.currency || null,
    billingInterval: catalog.billingInterval,
    isAvailable: true,
    source: "store",
    introductoryOffer: introductoryOfferOf(sub),
  };
}

/**
 * App Store mobile adapter (expo-iap / StoreKit 2).
 * Introductory offers are applied by StoreKit when the Apple ID is eligible.
 */
export class AppleMobileBillingProvider implements MobileBillingProvider {
  readonly id = "apple" as const;
  private connected = false;
  private purchasesByTransactionId = new Map<string, Purchase>();

  capabilities(): BillingCapability {
    return {
      supportsPurchase: true,
      supportsTrial: true,
      supportsRestore: true,
      supportsManage: true,
      supportsManageExternally: true,
      supportsUpgrade: false,
      supportsDowngrade: false,
      priceSource: "store",
      purchaseMode: "native_iap",
    };
  }

  purchaseUnavailableReason(): PurchaseUnavailableReason | null {
    return null;
  }

  async initialize(): Promise<void> {
    if (this.connected) return;
    const ok = await initConnection();
    if (!ok) {
      this.connected = false;
      throw new Error("App Store is not connected. Sign in to the App Store, then retry.");
    }
    this.connected = true;
  }

  async dispose(): Promise<void> {
    if (!this.connected) return;
    try {
      await endConnection();
    } finally {
      this.connected = false;
    }
  }

  private markDisconnected(): void {
    this.connected = false;
  }

  async fetchProducts(): Promise<BillingProduct[]> {
    await this.initialize();
    const skus = listCatalogProductsSorted().map(
      (entry) => entry.providerConfig.apple.productId,
    );
    const result = await fetchProducts({ skus, type: "subs" });
    const list = (Array.isArray(result) ? result : []) as ProductSubscription[];
    const mapped: BillingProduct[] = [];
    for (const entry of listCatalogProductsSorted()) {
      const sku = entry.providerConfig.apple.productId;
      const found = list.find((product) => product.id === sku);
      if (found && isIosSubscription(found)) {
        const product = mapSubscription(found);
        if (product) {
          mapped.push(product);
          continue;
        }
      }
      mapped.push({
        productId: entry.id,
        displayName: entry.displayNameKey,
        displayPrice: "",
        currency: null,
        billingInterval: entry.billingInterval,
        isAvailable: false,
        source: "store",
        introductoryOffer: null,
      });
    }
    return mapped;
  }

  async purchase(productId: ProductCatalogId): Promise<StoreProof> {
    try {
      await this.initialize();
      const sku = getProduct(productId).providerConfig.apple.productId;
      return await new Promise<StoreProof>((resolve, reject) => {
        const timeout = setTimeout(() => {
          remove();
          reject(new Error("Purchase timed out"));
        }, 120_000);

        const remove = () => {
          clearTimeout(timeout);
          successSub.remove();
          errorSub.remove();
        };

        const successSub = purchaseUpdatedListener((purchase) => {
          if (purchase.productId !== sku && purchase.currentPlanId !== sku) {
            return;
          }
          if (purchase.purchaseState === "pending") return;
          const transactionId = transactionIdOf(purchase);
          if (!transactionId) {
            remove();
            reject(new Error("Missing App Store transactionId"));
            return;
          }
          this.purchasesByTransactionId.set(transactionId, purchase);
          remove();
          resolve({
            productId,
            purchaseToken: transactionId,
            transactionId,
            packageName: bundleId(),
            raw: purchase as unknown as Record<string, unknown>,
          });
        });

        const errorSub = purchaseErrorListener((err) => {
          remove();
          reject(err);
        });

        void requestPurchase({
          type: "subs",
          request: {
            apple: { sku },
          },
        }).catch((err) => {
          remove();
          reject(err);
        });
      });
    } catch (err) {
      this.markDisconnected();
      throw err;
    }
  }

  async collectRestoreProofs(): Promise<StoreProof[]> {
    try {
      await this.initialize();
      const purchases = await getAvailablePurchases({
        onlyIncludeActiveItemsIOS: true,
      });
      const proofs: StoreProof[] = [];
      for (const purchase of purchases) {
        const catalogId = catalogIdFromSku(purchase.productId);
        const transactionId = transactionIdOf(purchase);
        if (!catalogId || !transactionId) continue;
        this.purchasesByTransactionId.set(transactionId, purchase);
        proofs.push({
          productId: catalogId,
          purchaseToken: transactionId,
          transactionId,
          packageName: bundleId(),
          raw: purchase as unknown as Record<string, unknown>,
        });
      }
      return proofs;
    } catch (err) {
      this.markDisconnected();
      throw err;
    }
  }

  async finishPurchase(proof: StoreProof): Promise<void> {
    const transactionId = proof.transactionId ?? proof.purchaseToken;
    const purchase = this.purchasesByTransactionId.get(transactionId);
    if (!purchase) return;
    await finishTransaction({ purchase, isConsumable: false });
    this.purchasesByTransactionId.delete(transactionId);
  }

  async openManage(): Promise<void> {
    await Linking.openURL(MANAGE_URL);
  }
}
