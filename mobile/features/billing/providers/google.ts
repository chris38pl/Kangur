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
  type SubscriptionOffer,
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
import {
  isFreeTrialOffer,
  offerTokenOf,
  recurringDisplayPrice,
  selectSubscriptionOffer,
  serializeOfferForDebug,
  trialPhaseSummary,
} from "./google-offers";

function packageName(): string {
  return (
    Constants.expoConfig?.android?.package?.trim() ||
    "app.kangur"
  );
}

function catalogIdFromSku(sku: string): ProductCatalogId | null {
  return resolveProductIdFromGoogleSku(sku);
}

function subscriptionOffersOf(
  sub: ProductSubscription,
): SubscriptionOffer[] {
  if ("subscriptionOffers" in sub && Array.isArray(sub.subscriptionOffers)) {
    return sub.subscriptionOffers;
  }
  return [];
}

function mapSubscriptionToBillingProduct(
  sub: ProductSubscription,
  source: BillingProduct["source"],
): BillingProduct | null {
  const productId = catalogIdFromSku(sub.id);
  if (!productId) return null;
  const catalog = getProduct(productId);
  const googleCfg = catalog.providerConfig.google;
  const offers = subscriptionOffersOf(sub);
  const selected = selectSubscriptionOffer(offers, {
    basePlanId: googleCfg.basePlanId,
    preferredOfferId: googleCfg.preferredOfferId,
  });
  const trial = selected ? trialPhaseSummary(selected) : null;

  return {
    productId,
    displayName: sub.title || catalog.displayNameKey,
    displayPrice: selected
      ? recurringDisplayPrice(selected)
      : sub.displayPrice || "",
    currency:
      selected?.currency ||
      ("currency" in sub ? sub.currency : null) ||
      null,
    billingInterval: catalog.billingInterval,
    isAvailable: Boolean(selected && offerTokenOf(selected)),
    source,
    introductoryOffer: trial
      ? {
          displayPrice: trial.displayPrice,
          period: trial.period,
          paymentMode: trial.paymentMode,
          offerId: selected?.id,
        }
      : null,
  };
}

/**
 * Google Play mobile adapter (expo-iap). No ProductCache here.
 */
export class GoogleMobileBillingProvider implements MobileBillingProvider {
  readonly id = "google" as const;
  private connected = false;
  private lastPurchaseByToken = new Map<string, Purchase>();
  private lastOfferInspect: Record<string, unknown> | null = null;
  private lastPurchaseRequest: Record<string, unknown> | null = null;

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

  /** Last offer / purchase payload for Billing Debug (no purchase tokens). */
  getOfferDiagnostics(): Record<string, unknown> {
    return {
      lastOfferInspect: this.lastOfferInspect,
      lastPurchaseRequest: this.lastPurchaseRequest,
    };
  }

  async inspectOffers(): Promise<Record<string, unknown>> {
    await this.initialize();
    const skus = listCatalogProductsSorted().map(
      (p) => p.providerConfig.google.externalProductId,
    );
    const result = await fetchProducts({ skus, type: "subs" });
    const list = (Array.isArray(result) ? result : []) as ProductSubscription[];
    const bySku: Record<string, unknown> = {};

    for (const entry of listCatalogProductsSorted()) {
      const sku = entry.providerConfig.google.externalProductId;
      const googleCfg = entry.providerConfig.google;
      const found = list.find((s) => s.id === sku);
      if (!found) {
        bySku[sku] = { found: false };
        continue;
      }
      const offers = subscriptionOffersOf(found);
      const selected = selectSubscriptionOffer(offers, {
        basePlanId: googleCfg.basePlanId,
        preferredOfferId: googleCfg.preferredOfferId,
      });
      bySku[sku] = {
        found: true,
        productId: entry.id,
        catalogBasePlanId: googleCfg.basePlanId,
        preferredOfferId: googleCfg.preferredOfferId ?? null,
        productDisplayPrice: found.displayPrice,
        productStatusAndroid:
          "productStatusAndroid" in found
            ? found.productStatusAndroid
            : null,
        offers: offers.map(serializeOfferForDebug),
        selectedOffer: selected ? serializeOfferForDebug(selected) : null,
        selectedOfferTokenPresent: Boolean(
          selected && offerTokenOf(selected),
        ),
        selectedIsFreeTrial: selected ? isFreeTrialOffer(selected) : false,
      };
    }

    this.lastOfferInspect = {
      fetchedAt: new Date().toISOString(),
      skus,
      bySku,
    };
    return this.lastOfferInspect;
  }

  async fetchProducts(): Promise<BillingProduct[]> {
    await this.initialize();
    const skus = listCatalogProductsSorted().map(
      (p) => p.providerConfig.google.externalProductId,
    );
    const result = await fetchProducts({ skus, type: "subs" });
    const list = (Array.isArray(result) ? result : []) as ProductSubscription[];
    // Keep diagnostics warm for Billing Debug without a second network call.
    void this.inspectOffersFromList(list);
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

  private inspectOffersFromList(list: ProductSubscription[]): void {
    const bySku: Record<string, unknown> = {};
    for (const entry of listCatalogProductsSorted()) {
      const sku = entry.providerConfig.google.externalProductId;
      const googleCfg = entry.providerConfig.google;
      const found = list.find((s) => s.id === sku);
      if (!found) {
        bySku[sku] = { found: false };
        continue;
      }
      const offers = subscriptionOffersOf(found);
      const selected = selectSubscriptionOffer(offers, {
        basePlanId: googleCfg.basePlanId,
        preferredOfferId: googleCfg.preferredOfferId,
      });
      bySku[sku] = {
        found: true,
        offers: offers.map(serializeOfferForDebug),
        selectedOffer: selected ? serializeOfferForDebug(selected) : null,
      };
    }
    this.lastOfferInspect = {
      fetchedAt: new Date().toISOString(),
      bySku,
    };
  }

  async purchase(productId: ProductCatalogId): Promise<StoreProof> {
    try {
      await this.initialize();
      const catalog = getProduct(productId);
      const googleCfg = catalog.providerConfig.google;
      const sku = googleCfg.externalProductId;
      const products = await fetchProducts({ skus: [sku], type: "subs" });
      const list = (Array.isArray(products) ? products : []) as ProductSubscription[];
      const sub = list.find((s) => s.id === sku);
      const offers = sub ? subscriptionOffersOf(sub) : [];
      const selected = selectSubscriptionOffer(offers, {
        basePlanId: googleCfg.basePlanId,
        preferredOfferId: googleCfg.preferredOfferId,
      });
      const offerToken = selected ? offerTokenOf(selected) : null;
      if (!selected || !offerToken) {
        throw new Error(
          "Google subscription offerToken missing — create/activate the offer in Play Console.",
        );
      }

      const purchasePayload = {
        type: "subs" as const,
        request: {
          google: {
            skus: [sku],
            subscriptionOffers: [{ sku, offerToken }],
          },
        },
      };
      this.lastPurchaseRequest = {
        productId,
        sku,
        basePlanId: googleCfg.basePlanId,
        preferredOfferId: googleCfg.preferredOfferId ?? null,
        selectedOffer: serializeOfferForDebug(selected),
        // Truncate token in debug — full token only goes to Play.
        offerTokenPreview: `${offerToken.slice(0, 8)}…`,
        requestPurchase: {
          type: purchasePayload.type,
          request: {
            google: {
              skus: purchasePayload.request.google.skus,
              subscriptionOffers: [
                { sku, offerToken: `${offerToken.slice(0, 8)}…` },
              ],
            },
          },
        },
      };

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

        void requestPurchase(purchasePayload).catch((err) => {
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
