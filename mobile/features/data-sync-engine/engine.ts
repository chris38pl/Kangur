import { compressOperations } from "./compress";
import { Connectivity } from "./connectivity";
import { conflictResolver } from "./conflict-resolver";
import { createSyncOpId } from "./id";
import { dataSyncPersistence } from "./persistence";
import { SyncQueue } from "./queue";
import { syncTelemetry } from "./telemetry";
import {
  ACTION_PRIORITY,
  type DataSyncEvent,
  type DataSyncEventHandler,
  type SyncOpAction,
  type SyncOperation,
} from "./types";
import { SyncWorker, type SyncTransport } from "./worker";
import { createClientId, isLegacyLocalItemId, isUuid } from "@/lib/createClientId";

const DEBOUNCE_MS = 1000;

export type EnqueueInput = {
  listId: string;
  itemId?: string;
  action: SyncOpAction;
  payload?: Record<string, unknown>;
};

/**
 * Data Sync Engine façade — Queue + Worker + Persistence + Connectivity.
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
        await fetchHealth();
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
   * server item ids are cuids — only drop ops still targeting local_* ids.
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
      itemId: input.itemId,
      action: input.action,
      payload: input.payload ?? {},
      createdAt: new Date().toISOString(),
      priority: ACTION_PRIORITY[input.action],
      state: "PENDING",
    };
    await this.queue.enqueue(op);
    const pending = await this.queue.pendingCount(input.listId);
    syncTelemetry.queueLength(pending);
    this.emit("queueChanged", { listId: input.listId, pendingCount: pending });
    if (this.connectivity.isOnline()) {
      this.scheduleFlush(input.listId);
    }
    return op;
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

  async flush(listId?: string): Promise<void> {
    if (this.worker.isRunning()) return;
    if (!this.connectivity.isOnline()) return;

    await this.compress(listId);
    const ops = (await this.queue.getAll(listId)).filter(
      (op) => op.state === "PENDING" || op.state === "FAILED",
    );
    if (ops.length === 0) return;

    const started = Date.now();
    this.emit("syncStarted", { listId });

    const { failed } = await this.worker.flush(ops, {
      onOpState: async (id, state) => {
        if (state === "SYNCING" || state === "FAILED") {
          await this.queue.update(id, { state });
        }
      },
      onDone: (failedCount) => {
        syncTelemetry.failedOps(failedCount);
        syncTelemetry.syncDuration(Date.now() - started);
      },
    });

    const failedSet = new Set(failed);
    const doneIds = ops.map((o) => o.id).filter((id) => !failedSet.has(id));
    if (doneIds.length) {
      await this.queue.remove(doneIds);
    }

    const pending = await this.queue.pendingCount(listId);
    this.emit("queueChanged", { listId, pendingCount: pending });
    this.emit("syncFinished", {
      listId,
      pendingCount: pending,
      syncedCount: doneIds.length,
    });
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
