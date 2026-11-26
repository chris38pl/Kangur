import { dataSyncPersistence } from "./persistence";
import { compareReplayOrder, remapItemId } from "./replay";
import type { SyncOperation } from "./types";

/**
 * In-memory queue with durable backing. Ordered iteration; efficient enqueue.
 */
export class SyncQueue {
  private ops: SyncOperation[] = [];
  private loaded = false;
  private lastSeq = 0;

  private noteSeq(ops: readonly SyncOperation[]): void {
    for (const op of ops) {
      if (typeof op.seq === "number" && op.seq > this.lastSeq) {
        this.lastSeq = op.seq;
      }
    }
  }

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.ops = await dataSyncPersistence.loadQueue();
    this.noteSeq(this.ops);
    // Restart-safe: SYNCING → PENDING
    let changed = false;
    this.ops = this.ops.map((op) => {
      if (op.state === "SYNCING") {
        changed = true;
        return { ...op, state: "PENDING" as const };
      }
      return op;
    });
    if (changed) {
      await dataSyncPersistence.saveQueue(this.ops);
    }
    this.loaded = true;
  }

  /** Stores the op with the next `seq` and returns the stored copy. */
  async enqueue(op: SyncOperation): Promise<SyncOperation> {
    await this.ensureLoaded();
    this.lastSeq += 1;
    const stored: SyncOperation = { ...op, seq: this.lastSeq };
    this.ops.push(stored);
    await dataSyncPersistence.saveQueue(this.ops);
    return stored;
  }

  async replaceAll(ops: SyncOperation[]): Promise<void> {
    await this.ensureLoaded();
    this.ops = ops;
    this.noteSeq(ops);
    await dataSyncPersistence.saveQueue(this.ops);
  }

  async update(id: string, patch: Partial<SyncOperation>): Promise<void> {
    await this.ensureLoaded();
    this.ops = this.ops.map((op) => (op.id === id ? { ...op, ...patch } : op));
    await dataSyncPersistence.saveQueue(this.ops);
  }

  async remove(ids: string[]): Promise<void> {
    await this.ensureLoaded();
    const set = new Set(ids);
    this.ops = this.ops.filter((op) => !set.has(op.id));
    await dataSyncPersistence.saveQueue(this.ops);
  }

  /** Point queued ops on `fromId` (an item's clientId) at its server id. */
  async remapItemId(listId: string, fromId: string, toId: string): Promise<void> {
    await this.ensureLoaded();
    this.ops = remapItemId(this.ops, listId, fromId, toId);
    await dataSyncPersistence.saveQueue(this.ops);
  }

  /** Ops in replay order (see {@link compareReplayOrder}). */
  async getAll(listId?: string): Promise<SyncOperation[]> {
    await this.ensureLoaded();
    const list = listId
      ? this.ops.filter((op) => op.listId === listId)
      : [...this.ops];
    return list.sort(compareReplayOrder);
  }

  async pendingCount(listId?: string): Promise<number> {
    const all = await this.getAll(listId);
    return all.filter((op) => op.state === "PENDING" || op.state === "FAILED")
      .length;
  }
}
