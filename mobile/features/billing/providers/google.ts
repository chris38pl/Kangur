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
  type Purchase,
} from "expo-iap";
import {
  getProduct,
  listCatalogProductsSorted,
  resolveProductIdFromGoogleSku,
  type BillingCapability,
  type BillingProduct,
  type ProductCatalogId,
  type PurchaseUnavailableReason,
} from "@shared/billing";

import type { MobileBillingProvider, StoreProof } from "../types";

function packageName(): string {
  return (
    Constants.expoConfig?.android?.package?.trim() ||
    "app.kangur"
  );
}

function catalogIdFromSku(sku: string): ProductCatalogId | null {
  return resolveProductIdFromGoogleSku(sku);
}

function mapSubscriptionToBillingProduct(
  sub: ProductSubscription,
  source: BillingProduct["source"],
): BillingProduct | null {
  const productId = catalogIdFromSku(sub.id);
  if (!productId) return null;
  const catalog = getProduct(productId);
  const androidOffers =
    "subscriptionOffers" in sub && Array.isArray(sub.subscriptionOffers)
      ? sub.subscriptionOffers
      : [];
  const offer = androidOffers[0] as
    | { offerToken?: string; displayPrice?: string; currency?: string }
    | undefined;
  const displayPrice =
    offer?.displayPrice ||
    sub.displayPrice ||
    "";
  const currency =
    offer?.currency ||
    ("currency" in sub ? sub.currency : null) ||
    null;

  return {
    productId,
    displayName: sub.title || catalog.displayNameKey,
    displayPrice,
    currency,
    billingInterval: catalog.billingInterval,
    isAvailable: true,
    source,
    introductoryOffer: null,
  };
}

/**
 * Google Play mobile adapter (expo-iap). No ProductCache here.
 */
export class GoogleMobileBillingProvider implements MobileBillingProvider {
  readonly id = "google" as const;
  private connected = false;
  private lastPurchaseByToken = new Map<string, Purchase>();

  capabilities(): BillingCapability {
    return {
      supportsPurchase: true,
      supportsTrial: true,
      supportsRestore: true,
      supportsManage: true,
      supportsManageExternally: true,
      supportsUpgrade: true,
      supportsDowngrade: true,
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
      throw new Error(
        "Play Store service is not connected. Open the Play Store app, sign in, then retry.",
      );
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

  /** Drop local connected flag so the next initialize() retries Play Billing. */
  markDisconnected(): void {
    this.connected = false;
  }

  async fetchProducts(): Promise<BillingProduct[]> {
    await this.initialize();
    const skus = listCatalogProductsSorted().map(
      (p) => p.providerConfig.google.externalProductId,
    );
    const result = await fetchProducts({ skus, type: "subs" });
    const list = (Array.isArray(result) ? result : []) as ProductSubscription[];
    const mapped: BillingProduct[] = [];
    for (const entry of listCatalogProductsSorted()) {
      const sku = entry.providerConfig.google.externalProductId;
      const found = list.find((s) => s.id === sku);
      if (found) {
        const bp = mapSubscriptionToBillingProduct(found, "store");
        if (bp) mapped.push(bp);
      } else {
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
    }
    return mapped;
  }

  async purchase(productId: ProductCatalogId): Promise<StoreProof> {
    try {
      await this.initialize();
      const sku = getProduct(productId).providerConfig.google.externalProductId;
      const products = await fetchProducts({ skus: [sku], type: "subs" });
      const list = (Array.isArray(products) ? products : []) as ProductSubscription[];
      const sub = list.find((s) => s.id === sku);
      const androidOffers =
        sub && "subscriptionOffers" in sub && Array.isArray(sub.subscriptionOffers)
          ? sub.subscriptionOffers
          : [];
      const offerToken =
        (androidOffers[0] as { offerTokenAndroid?: string; offerToken?: string } | undefined)
          ?.offerTokenAndroid ??
        (androidOffers[0] as { offerToken?: string } | undefined)?.offerToken ??
        null;
      if (!offerToken) {
        throw new Error(
          "Google subscription offerToken missing — create/activate the product in Play Console.",
        );
      }

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

        const successSub = purchaseUpdatedListener(async (purchase) => {
          const token =
            purchase.purchaseToken ??
            (purchase as { purchaseTokenAndroid?: string }).purchaseTokenAndroid;
          if (!token) {
            remove();
            reject(new Error("Missing purchaseToken"));
            return;
          }
          this.lastPurchaseByToken.set(token, purchase);
          remove();
          resolve({
            productId,
            purchaseToken: token,
            packageName: packageName(),
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
            google: {
              skus: [sku],
              subscriptionOffers: [{ sku, offerToken }],
            },
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
      const purchases = await getAvailablePurchases();
      const proofs: StoreProof[] = [];
      for (const purchase of purchases) {
        const token =
          purchase.purchaseToken ??
          (purchase as { purchaseTokenAndroid?: string }).purchaseTokenAndroid;
        if (!token) continue;
        const catalogId = catalogIdFromSku(purchase.productId);
        if (!catalogId) continue;
        this.lastPurchaseByToken.set(token, purchase);
        proofs.push({
          productId: catalogId,
          purchaseToken: token,
          packageName: packageName(),
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
    const purchase = this.lastPurchaseByToken.get(proof.purchaseToken);
    if (!purchase) return;
    await finishTransaction({ purchase, isConsumable: false });
    this.lastPurchaseByToken.delete(proof.purchaseToken);
  }

  async openManage(): Promise<void> {
    await Linking.openURL(
      "https://play.google.com/store/account/subscriptions",
    );
  }
}
