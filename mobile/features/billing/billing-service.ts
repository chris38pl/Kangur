import type {
  BillingCapability,
  BillingProduct,
  BillingProviderId,
  ProductCatalogId,
  PurchaseUnavailableReason,
} from "@shared/billing";
import { DEFAULT_PREMIUM_PRODUCT } from "@shared/billing";

import { Analytics } from "@/lib/analytics";

import {
  createBillingCheckout,
  createBillingPortal,
  syncBillingEntitlement,
  verifyBillingPurchase,
} from "./api";
import { productCache } from "./product-cache";
import { ProductRepository } from "./product-repository";
import { MobileBillingRegistry } from "./registry";
import type { BillingSyncResponse, BillingUrlResponse } from "./schemas";
import type { ProviderResolveInfo, PurchaseState, StoreProof } from "./types";

export type { PurchaseState };

/**
 * UI-facing billing facade. Premium screen must not import store SDKs.
 */
export const BillingService = {
  resolveCurrentProvider() {
    return MobileBillingRegistry.resolveCurrent();
  },

  providerId(): BillingProviderId {
    return MobileBillingRegistry.resolveCurrent().id;
  },

  decisionTree(): ProviderResolveInfo {
    return MobileBillingRegistry.decisionTree();
  },

  capabilities(): BillingCapability {
    return MobileBillingRegistry.resolveCurrent().capabilities();
  },

  purchaseUnavailableReason(): PurchaseUnavailableReason | null {
    return MobileBillingRegistry.resolveCurrent().purchaseUnavailableReason();
  },

  async initialize(): Promise<void> {
    const provider = MobileBillingRegistry.resolveCurrent();
    const decision = MobileBillingRegistry.decisionTree();
    Analytics.track("billing_provider_resolved", {
      provider: decision.providerId,
      platform: decision.platform,
      channel: decision.channel,
      purchase_mode: provider.capabilities().purchaseMode,
    });
    await provider.initialize();
    await productCache.hydrateFromDisk();
  },

  async dispose(): Promise<void> {
    await MobileBillingRegistry.resolveCurrent().dispose();
  },

  async availableProducts(options?: {
    forceRefresh?: boolean;
    authToken?: string | null;
    workspaceId?: string | null;
  }): Promise<BillingProduct[]> {
    const provider = MobileBillingRegistry.resolveCurrent();
    const listed = await ProductRepository.list({
      forceRefresh: options?.forceRefresh,
      authToken: options?.authToken,
    });
    Analytics.track("billing_products_loaded", {
      provider: provider.id,
      count: listed.products.length,
      duration_ms: listed.durationMs,
      cache_hit: listed.cacheHit,
      cache_age_ms: productCache.cacheAgeMs() ?? undefined,
      ...(options?.workspaceId ? { workspace_id: options.workspaceId } : {}),
    });
    return listed.products;
  },

  async forceRefreshProducts(authToken?: string | null): Promise<BillingProduct[]> {
    const listed = await ProductRepository.list({
      forceRefresh: true,
      authToken,
    });
    return listed.products;
  },

  cacheMeta() {
    return productCache.meta();
  },

  /**
   * Native IAP: store purchase → verify → finishTransaction.
   * Checkout URL (Stripe): returns { mode: 'checkout', url }.
   */
  async purchase(
    token: string,
    workspaceId: string,
    productId: ProductCatalogId = DEFAULT_PREMIUM_PRODUCT,
  ): Promise<
    | { mode: "native"; sync: BillingSyncResponse }
    | { mode: "checkout"; url: string }
  > {
    const provider = MobileBillingRegistry.resolveCurrent();
    const caps = provider.capabilities();
    if (!caps.supportsPurchase) {
      throw new Error(
        provider.purchaseUnavailableReason() ?? "STORE_NOT_SUPPORTED",
      );
    }

    Analytics.track("billing_purchase_started", {
      workspace_id: workspaceId,
      provider: provider.id,
      product_id: productId,
    });

    if (caps.purchaseMode === "checkout_url") {
      const { url } = await createBillingCheckout(token, workspaceId);
      return { mode: "checkout", url };
    }

    try {
      const proof = await provider.purchase(productId);
      const sync = await this.verifyProof(token, workspaceId, proof);
      await provider.finishPurchase(proof);
      Analytics.track("billing_purchase_verified", {
        workspace_id: workspaceId,
        provider: provider.id,
        product_id: productId,
      });
      return { mode: "native", sync };
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : err instanceof Error
            ? err.message
            : "unknown";
      if (
        code.toLowerCase().includes("cancel") ||
        code === "E_USER_CANCELLED"
      ) {
        Analytics.track("billing_purchase_cancelled", {
          workspace_id: workspaceId,
          provider: provider.id,
          product_id: productId,
        });
      } else {
        Analytics.track("billing_purchase_failed", {
          workspace_id: workspaceId,
          provider: provider.id,
          product_id: productId,
          code,
        });
      }
      throw err;
    }
  },

  async manage(
    token: string,
    workspaceId: string,
  ): Promise<BillingUrlResponse | { openedExternally: true }> {
    const provider = MobileBillingRegistry.resolveCurrent();
    const caps = provider.capabilities();
    if (caps.purchaseMode === "checkout_url") {
      return createBillingPortal(token, workspaceId);
    }
    await provider.openManage();
    return { openedExternally: true };
  },

  async restore(
    token: string,
    workspaceId: string,
  ): Promise<BillingSyncResponse> {
    const provider = MobileBillingRegistry.resolveCurrent();
    Analytics.track("billing_restore", {
      workspace_id: workspaceId,
      provider: provider.id,
    });
    try {
      if (provider.capabilities().purchaseMode === "native_iap") {
        const proofs = await provider.collectRestoreProofs();
        let last: BillingSyncResponse | null = null;
        for (const proof of proofs) {
          last = await this.verifyProof(token, workspaceId, proof);
          await provider.finishPurchase(proof);
        }
        if (last) return last;
      }
      return syncBillingEntitlement(token, workspaceId);
    } catch (err) {
      Analytics.track("billing_restore_failed", {
        workspace_id: workspaceId,
        provider: provider.id,
        code: err instanceof Error ? err.message : "unknown",
      });
      throw err;
    }
  },
  async verifyProof(
    token: string,
    workspaceId: string,
    proof: StoreProof,
  ): Promise<BillingSyncResponse> {
    return verifyBillingPurchase(token, workspaceId, {
      provider: MobileBillingRegistry.resolveCurrent().id,
      productId: proof.productId,
      proof: {
        purchaseToken: proof.purchaseToken,
        packageName: proof.packageName,
      },
    });
  },

  exportDiagnostics(input: {
    entitlement?: Record<string, unknown> | null;
    products?: BillingProduct[];
    purchaseState?: PurchaseState;
    lastError?: string | null;
  }): string {
    const decision = this.decisionTree();
    const caps = this.capabilities();
    const meta = productCache.meta();
    const lines = [
      "Kangur Billing Diagnostics",
      `platform: ${decision.platform}`,
      `channel: ${decision.channel}`,
      `provider: ${decision.providerId}`,
      `why: ${decision.why}`,
      `purchaseMode: ${caps.purchaseMode}`,
      `supportsPurchase: ${caps.supportsPurchase}`,
      `supportsRestore: ${caps.supportsRestore}`,
      `unavailableReason: ${this.purchaseUnavailableReason() ?? "none"}`,
      `cacheSource: ${meta.source}`,
      `lastSuccessfulRefreshAt: ${meta.lastSuccessfulRefreshAt ?? "null"}`,
      `lastAttemptAt: ${meta.lastAttemptAt ?? "null"}`,
      `purchaseState: ${input.purchaseState ?? "n/a"}`,
      `products: ${(input.products ?? [])
        .map(
          (p) =>
            `${p.productId} available=${p.isAvailable} price=${p.displayPrice || "—"} source=${p.source}`,
        )
        .join("; ") || "none"}`,
      `entitlement: ${JSON.stringify(input.entitlement ?? null)}`,
      `lastError: ${input.lastError ?? "none"}`,
      "(no purchase tokens included)",
    ];
    return lines.join("\n");
  },

  isBillingDebugEnabled(): boolean {
    return (
      process.env.EXPO_PUBLIC_ENABLE_BILLING_DEBUG === "1" ||
      process.env.EXPO_PUBLIC_ENABLE_BILLING_DEBUG === "true" ||
      process.env.EXPO_PUBLIC_APP_ENV === "development" ||
      process.env.EXPO_PUBLIC_APP_ENV === "preview"
    );
  },
};
