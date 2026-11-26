import type { ShoppingItem } from "@/features/shopping-item/schemas";
import { MetricNames } from "@shared/metrics/names";
import { getMetrics } from "@/lib/metrics";
import { createClientId, isLegacyLocalItemId, isUuid } from "@/lib/createClientId";
import { ApiClientError } from "@/lib/api/client";

import { compressOperations } from "./compress";
import { Connectivity } from "./connectivity";
import { conflictResolver } from "./conflict-resolver";
import { createSyncOpId } from "./id";
import { dataSyncPersistence } from "./persistence";
import { SyncQueue } from "./queue";
import type { SyncCacheAdapter } from "./sync-cache-adapter";
import { syncTelemetry } from "./telemetry";
import {
  ACTION_PRIORITY,
  type DataSyncEvent,
  type DataSyncEventHandler,
  type SyncOpAction,
  type SyncOperation,
} from "./types";
import { SyncWorker, type SyncTransport } from "./worker";

const DEBOUNCE_MS = 1000;
const REFRESH_DEBOUNCE_MS = 250;
const REFRESH_POLL_IDLE_MS = 100;
/** A connection check with no answer by then counts as offline. */
const PROBE_TIMEOUT_MS = 5000;

export type EnqueueInput = {
  listId: string;
  itemId?: string;
  action: SyncOpAction;
  payload?: Record<string, unknown>;
};

/**
 * Data Sync Engine façade - Queue + Worker + Persistence + Connectivity.
 * Events are informational only; do not build business logic on event order.
 */
class DataSyncEngineImpl {
  readonly queue = new SyncQueue();
  readonly worker = new SyncWorker();
  readonly connectivity = new Connectivity();
  readonly persistence = dataSyncPersistence;
  readonly conflictResolver = conflictResolver;

  private handlers = new Map<DataSyncEvent, Set<DataSyncEventHandler>>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private syncCache: SyncCacheAdapter | null = null;

  private refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshDeferTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshWaitingListId: string | null = null;

  /** In-flight flush, so callers can wait for it instead of skipping. */
  private flushing: Promise<void> | null = null;
  /** clientId → server id for items created during this app run. */
  private itemIdAliases = new Map<string, string>();

  setSyncCacheAdapter(adapter: SyncCacheAdapter): void {
    this.syncCache = adapter;
  }

  start(transport: SyncTransport): void {
    if (this.started) {
      this.worker.setTransport(transport);
      return;
    }
    this.started = true;
    this.worker.setTransport(transport);
    this.connectivity.setProbe(async () => {
      try {
        const { hasApiUrl, fetchHealth } = await import("@/lib/api/client");
        if (!hasApiUrl()) return true;
        await fetchHealth({ timeoutMs: PROBE_TIMEOUT_MS });
        return true;
      } catch {
        return false;
      }
    });
    this.connectivity.start();
    this.connectivity.onChange((online) => {
      if (online) this.scheduleFlush();
    });
    void this.queue.ensureLoaded().then(async () => {
      await this.repairInvalidClientIds();
      void this.pendingCount().then((n) => syncTelemetry.queueLength(n));
      if (this.connectivity.isOnline()) this.scheduleFlush();
    });
  }

  /**
   * Legacy shopping-mode used `local_…` ids. API clientId must be UUID;
   * server item ids are cuids - only drop ops still targeting local_* ids.
   */
  private async repairInvalidClientIds(): Promise<void> {
    const all = await this.queue.getAll();
    let changed = false;
    const next: SyncOperation[] = [];

    for (const op of all) {
      if (op.action === "ADD_ITEM") {
        const raw = String(op.payload.clientId ?? op.itemId ?? "");
        if (isUuid(raw)) {
          next.push(op);
          continue;
        }
        const clientId = createClientId();
        changed = true;
        next.push({
          ...op,
          itemId: clientId,
          payload: { ...op.payload, clientId },
          state: "PENDING",
        });
        continue;
      }

      if (
        (op.action === "SET_STATUS" ||
          op.action === "EDIT_ITEM" ||
          op.action === "REMOVE_ITEM") &&
        op.itemId &&
        isLegacyLocalItemId(op.itemId)
      ) {
        changed = true;
        continue;
      }

      next.push(op);
    }

    if (changed) {
      await this.queue.replaceAll(next);
      if (__DEV__) {
        console.info(
          "[DataSync] repaired queue ops with legacy local_* ids",
        );
      }
    }
  }

  on(event: DataSyncEvent, handler: DataSyncEventHandler): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  private emit(
    event: DataSyncEvent,
    payload?: Parameters<DataSyncEventHandler>[0],
  ) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of set) {
      try {
        h(payload);
      } catch {
        // informational only
      }
    }
  }

  async enqueue(input: EnqueueInput): Promise<SyncOperation> {
    const op: SyncOperation = {
      id: createSyncOpId(),
      queueVersion: 1,
      listId: input.listId,
      // A row can still show its clientId for a moment after the server
      // created it; send the op to the server id.
      itemId:
        input.action === "ADD_ITEM"
          ? input.itemId
          : this.resolveItemId(input.itemId),
      action: input.action,
      payload: input.payload ?? {},
      createdAt: new Date().toISOString(),
      priority: ACTION_PRIORITY[input.action],
      state: "PENDING",
    };
    const stored = await this.queue.enqueue(op);
    const pending = await this.queue.pendingCount(input.listId);
    syncTelemetry.queueLength(pending);
    this.emit("queueChanged", { listId: input.listId, pendingCount: pending });
    if (this.connectivity.isOnline()) {
      this.scheduleFlush(input.listId);
    }
    return stored;
  }

  async compress(listId?: string): Promise<number> {
    const all = await this.queue.getAll();
    const pending = all.filter((op) => {
      if (listId && op.listId !== listId) return false;
      return op.state === "PENDING" || op.state === "FAILED";
    });
    const { compressed, ratio } = compressOperations(pending);
    syncTelemetry.compressionRatio(ratio);

    const toCompressIds = new Set(pending.map((p) => p.id));
    const remainder = all.filter((op) => !toCompressIds.has(op.id));
    await this.queue.replaceAll([...remainder, ...compressed]);
    return compressed.length;
  }

  private scheduleFlush(listId?: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      void this.flush(listId);
    }, DEBOUNCE_MS);
  }

  /** Replay queued ops. While a flush runs, callers get that flush. */
  flush(listId?: string): Promise<void> {
    if (this.flushing) return this.flushing;
    this.flushing = this.runFlush(listId).finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  /**
   * Try to send everything queued for this list now, its finish last.
   * Checks the connection first: the signal can be back while the app still
   * thinks it is offline. Resolves with the number of ops still waiting, at
   * the latest after `timeoutMs` so a weak signal does not hold the screen
   * (the rest keeps replaying in the background).
   */
  async drain(listId: string, options: { timeoutMs: number }): Promise<number> {
    const attempt = (async () => {
      if (!this.connectivity.isOnline()) await this.connectivity.refresh();
      // A flush already running may predate the ops just queued.
      while (this.flushing) await this.flushing;
      await this.flush(listId);
    })().catch(() => undefined);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, options.timeoutMs);
    });
    try {
      await Promise.race([attempt, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
    return this.outboundBusyCount(listId);
  }

  private async runFlush(listId?: string): Promise<void> {
    if (this.worker.isRunning()) return;
    if (!this.connectivity.isOnline()) return;

    await this.compress(listId);
    const ops = (await this.queue.getAll(listId)).filter(
      (op) => op.state === "PENDING" || op.state === "FAILED",
    );
    if (ops.length === 0) return;

    const started = Date.now();
    this.emit("syncStarted", { listId });

    const { done } = await this.worker.flush(ops, {
      prepare: (op) => this.prepareForSend(op),
      onOpState: async (id, state) => {
        if (state === "SYNCING" || state === "FAILED") {
          await this.queue.update(id, { state });
        }
      },
      onOpSuccess: async (op, item) => {
        if (op.action === "ADD_ITEM" && item) {
          await this.adoptServerItemId(op, item.id);
        }
        // Pass live outbound ops so an older SET_STATUS success cannot revert
        // a newer PENDING/SYNCING status already chosen by the user.
        const outboundOps = await this.queue.getAll(op.listId);
        this.syncCache?.applyOperationResult(
          op,
          {
            status: "success",
            item: item ?? undefined,
          },
          outboundOps,
        );
        // Confirmed: drop it now so a crash mid-flush never replays it.
        await this.queue.remove([op.id]);
      },
      onOpFailed: (op, error) => {
        const httpStatus =
          error instanceof ApiClientError ? error.status : undefined;
        this.syncCache?.applyOperationResult(op, {
          status: "failed",
          error,
          httpStatus,
        });
      },
      onOpDropped: async (op, error) => {
        // Rejected for good (list or item gone): retrying cannot help and
        // would hold back the finish of this list forever.
        const httpStatus =
          error instanceof ApiClientError ? error.status : undefined;
        this.syncCache?.applyOperationResult(op, {
          status: "failed",
          error,
          httpStatus,
        });
        await this.queue.remove([op.id]);
      },
      onDone: (failedCount) => {
        syncTelemetry.failedOps(failedCount);
        syncTelemetry.syncDuration(Date.now() - started);
      },
    });

    const pending = await this.queue.pendingCount(listId);
    this.emit("queueChanged", { listId, pendingCount: pending });
    this.emit("syncFinished", {
      listId,
      pendingCount: pending,
      syncedCount: done.length,
    });

    // Settled reconcile: after local work lands, one GET — not poll-as-confirm.
    if (done.length > 0 && pending === 0) {
      const doneSet = new Set(done);
      const settledListIds = new Set(
        ops.filter((o) => doneSet.has(o.id)).map((o) => o.listId),
      );
      for (const id of settledListIds) {
        this.scheduleInvalidate(id);
      }
    }

    // Ops enqueued while the worker was running must not wait for another tap.
    if (pending > 0 && this.connectivity.isOnline()) {
      this.scheduleFlush(listId);
    }
  }

  /**
   * Latest stored version of a queued op, pointed at the server id when its
   * item was created earlier in the replay. ARCHIVE_LIST waits until nothing
   * else for its list is queued, so finishing never overtakes a tick or an
   * added item (they would 404 against the archived list).
   */
  private async prepareForSend(
    op: SyncOperation,
  ): Promise<SyncOperation | null> {
    const listOps = await this.queue.getAll(op.listId);
    const live = listOps.find((o) => o.id === op.id);
    if (!live) return null;

    if (
      live.action === "ARCHIVE_LIST" &&
      listOps.some((o) => o.action !== "ARCHIVE_LIST")
    ) {
      return null;
    }

    if (live.action === "ADD_ITEM") return live;
    const itemId = this.resolveItemId(live.itemId);
    return itemId === live.itemId ? live : { ...live, itemId };
  }

  /** Ops queued after an offline add still target its clientId. */
  private async adoptServerItemId(
    op: SyncOperation,
    serverId: string,
  ): Promise<void> {
    const clientId = String(op.payload.clientId ?? op.itemId ?? "");
    if (!clientId || clientId === serverId) return;
    this.itemIdAliases.set(clientId, serverId);
    await this.queue.remapItemId(op.listId, clientId, serverId);
  }

  private resolveItemId(itemId: string | undefined): string | undefined {
    if (!itemId) return itemId;
    return this.itemIdAliases.get(itemId) ?? itemId;
  }

  /**
   * Eventual consistency: if outbound queue is idle for this list, invalidate
   * once so GET + overlay merges remote state. No-op while local ops are busy.
   */
  reconcileIfSettled(listId: string): void {
    void (async () => {
      const busy = await this.outboundBusyCount(listId);
      if (busy > 0) return;
      this.scheduleInvalidate(listId);
    })();
  }

  /**
   * Pending/syncing ops that are not quiet SET_STATUS (adds, edits, etc.).
   * Used to hide "Synchronizacja…" for own status swipes in shopping mode.
   */
  async pendingNonStatusCount(listId?: string): Promise<number> {
    const all = await this.queue.getAll(listId);
    return all.filter(
      (op) =>
        (op.state === "PENDING" || op.state === "SYNCING") &&
        op.action !== "SET_STATUS",
    ).length;
  }

  /**
   * Inbound GET reconcile: last local outbound op wins over stale server rows.
   * Realtime / queryFn must use this instead of writing raw server lists.
   */
  async reconcileServerSnapshot(
    listId: string,
    serverItems: ShoppingItem[],
  ): Promise<ShoppingItem[]> {
    const outboundOps = await this.queue.getAll(listId);
    if (!this.syncCache) {
      const { reconcileWithOutbound } = await import("./overlay-local-ops");
      return reconcileWithOutbound(serverItems, outboundOps);
    }
    return this.syncCache.reconcileServerSnapshot(
      listId,
      serverItems,
      outboundOps,
    );
  }

  /**
   * Realtime hint: something changed on the server for this list.
   * Never force-invalidate while outbound ops are in flight (avoids UX rollback).
   */
  requestItemsRefresh(listId: string): void {
    this.clearRefreshDefer();
    this.refreshWaitingListId = listId;

    const attempt = async () => {
      if (this.refreshWaitingListId !== listId) return;

      const busy = await this.outboundBusyCount(listId);
      if (busy === 0) {
        this.refreshWaitingListId = null;
        this.scheduleInvalidate(listId);
        return;
      }

      getMetrics().increment(MetricNames.realtimeRefreshDeferred);

      if (!this.connectivity.isOnline()) {
        this.refreshWaitingListId = null;
        this.clearRefreshDebounce();
        getMetrics().increment(MetricNames.realtimeRefreshCancelledOffline);
        return;
      }

      // Keep waiting — never force a GET that would overwrite optimistic UI.
      this.refreshDeferTimer = setTimeout(() => {
        this.refreshDeferTimer = null;
        void attempt();
      }, REFRESH_POLL_IDLE_MS);
    };

    void attempt();
  }

  cancelItemsRefresh(): void {
    this.clearRefreshDebounce();
    this.clearRefreshDefer();
    this.refreshWaitingListId = null;
  }

  private scheduleInvalidate(listId: string): void {
    this.clearRefreshDebounce();
    this.refreshDebounceTimer = setTimeout(() => {
      this.refreshDebounceTimer = null;
      getMetrics().increment(MetricNames.realtimeRefreshRequests);
      this.syncCache?.invalidateShoppingItems(listId);
    }, REFRESH_DEBOUNCE_MS);
  }

  private clearRefreshDebounce(): void {
    if (this.refreshDebounceTimer) {
      clearTimeout(this.refreshDebounceTimer);
      this.refreshDebounceTimer = null;
    }
  }

  private clearRefreshDefer(): void {
    if (this.refreshDeferTimer) {
      clearTimeout(this.refreshDeferTimer);
      this.refreshDeferTimer = null;
    }
  }

  /** PENDING + SYNCING + FAILED — local mutation still owns item status. */
  async outboundBusyCount(listId?: string): Promise<number> {
    const all = await this.queue.getAll(listId);
    return all.filter(
      (op) =>
        op.state === "PENDING" ||
        op.state === "SYNCING" ||
        op.state === "FAILED",
    ).length;
  }

  async retry(ids?: string[]): Promise<void> {
    const all = await this.queue.getAll();
    const targets = ids
      ? all.filter((op) => ids.includes(op.id))
      : all.filter((op) => op.state === "FAILED");
    for (const op of targets) {
      await this.queue.update(op.id, { state: "PENDING" });
    }
    syncTelemetry.retryCount(targets.length);
    // Banner tap after the signal is back: re-check, or flush never runs.
    if (!this.connectivity.isOnline()) void this.connectivity.refresh();
    this.scheduleFlush();
  }

  async clear(listId?: string): Promise<void> {
    if (!listId) {
      await this.queue.replaceAll([]);
    } else {
      const rest = (await this.queue.getAll()).filter(
        (op) => op.listId !== listId,
      );
      await this.queue.replaceAll(rest);
    }
    this.emit("queueChanged", { listId, pendingCount: 0 });
  }

  async pendingCount(listId?: string): Promise<number> {
    return this.queue.pendingCount(listId);
  }

  async failedCount(listId?: string): Promise<number> {
    const all = await this.queue.getAll(listId);
    return all.filter((op) => op.state === "FAILED").length;
  }

  isOnline(): boolean {
    return this.connectivity.isOnline();
  }
}

export const DataSyncEngine = new DataSyncEngineImpl();
