import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BillingProduct } from "@shared/billing";

const STORAGE_KEY = "kangur.billing.productCache.v1";
const TTL_MS = 30 * 60 * 1000;

export type ProductCacheMeta = {
  lastSuccessfulRefreshAt: number | null;
  lastAttemptAt: number | null;
  source: "memory" | "disk" | "network";
};

type DiskPayload = {
  products: BillingProduct[];
  savedAt: number;
};

/**
 * Stale-while-revalidate product cache.
 * disk → memory immediately; network refresh async / on TTL.
 */
export class ProductCache {
  private memory: BillingProduct[] | null = null;
  private memorySavedAt: number | null = null;
  lastSuccessfulRefreshAt: number | null = null;
  lastAttemptAt: number | null = null;
  lastSource: ProductCacheMeta["source"] = "memory";
  private inflight: Promise<BillingProduct[]> | null = null;

  meta(): ProductCacheMeta {
    return {
      lastSuccessfulRefreshAt: this.lastSuccessfulRefreshAt,
      lastAttemptAt: this.lastAttemptAt,
      source: this.lastSource,
    };
  }

  async hydrateFromDisk(): Promise<BillingProduct[] | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DiskPayload;
      if (!Array.isArray(parsed.products)) return null;
      this.memory = parsed.products.map((p) => ({
        ...p,
        source: "cache" as const,
      }));
      this.memorySavedAt = parsed.savedAt;
      this.lastSuccessfulRefreshAt = parsed.savedAt;
      this.lastSource = "disk";
      return this.memory;
    } catch {
      return null;
    }
  }

  peek(): BillingProduct[] | null {
    return this.memory;
  }

  isFresh(): boolean {
    if (!this.memorySavedAt) return false;
    return Date.now() - this.memorySavedAt < TTL_MS;
  }

  cacheAgeMs(): number | null {
    if (!this.lastSuccessfulRefreshAt) return null;
    return Date.now() - this.lastSuccessfulRefreshAt;
  }

  async setFromNetwork(products: BillingProduct[]): Promise<void> {
    const now = Date.now();
    this.memory = products.map((p) => ({ ...p, source: "store" as const }));
    this.memorySavedAt = now;
    this.lastSuccessfulRefreshAt = now;
    this.lastAttemptAt = now;
    this.lastSource = "network";
    const payload: DiskPayload = {
      products: this.memory.map((p) => ({ ...p, source: "cache" })),
      savedAt: now,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  markAttempt(): void {
    this.lastAttemptAt = Date.now();
  }

  /**
   * Returns stale products immediately when possible; refreshes in background
   * when TTL expired. forceRefresh awaits network.
   */
  async getOrRefresh(
    fetchFn: () => Promise<BillingProduct[]>,
    options?: { force?: boolean },
  ): Promise<{
    products: BillingProduct[];
    cacheHit: boolean;
    durationMs: number;
  }> {
    const started = Date.now();
    if (!this.memory) {
      await this.hydrateFromDisk();
    }

    const force = options?.force === true;
    if (this.memory && this.isFresh() && !force) {
      this.lastSource = this.lastSource === "disk" ? "disk" : "memory";
      return {
        products: this.memory,
        cacheHit: true,
        durationMs: Date.now() - started,
      };
    }

    if (this.memory && !force) {
      // Stale-while-revalidate: return stale, refresh async
      void this.runFetch(fetchFn);
      this.lastSource = "memory";
      return {
        products: this.memory.map((p) => ({ ...p, source: "cache" })),
        cacheHit: true,
        durationMs: Date.now() - started,
      };
    }

    const products = await this.runFetch(fetchFn);
    return {
      products,
      cacheHit: false,
      durationMs: Date.now() - started,
    };
  }

  async forceRefresh(
    fetchFn: () => Promise<BillingProduct[]>,
  ): Promise<BillingProduct[]> {
    return this.runFetch(fetchFn);
  }

  private async runFetch(
    fetchFn: () => Promise<BillingProduct[]>,
  ): Promise<BillingProduct[]> {
    if (this.inflight) return this.inflight;
    this.inflight = (async () => {
      this.markAttempt();
      try {
        const products = await fetchFn();
        if (products.length > 0) {
          await this.setFromNetwork(products);
          return this.memory ?? products;
        }
        // Empty network — keep last good
        if (this.memory?.length) {
          this.lastSource = "memory";
          return this.memory.map((p) => ({ ...p, source: "cache" as const }));
        }
        this.lastSource = "network";
        return [];
      } catch {
        if (this.memory?.length) {
          this.lastSource = "memory";
          return this.memory.map((p) => ({ ...p, source: "cache" as const }));
        }
        throw new Error("Product fetch failed and no cache");
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  }
}

export const productCache = new ProductCache();
