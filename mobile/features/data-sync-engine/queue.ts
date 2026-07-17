import { dataSyncPersistence } from "./persistence";
import type { SyncOperation } from "./types";

/**
 * In-memory queue with durable backing. Ordered iteration; efficient enqueue.
 */
export class SyncQueue {
  private ops: SyncOperation[] = [];
  private loaded = false;

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.ops = await dataSyncPersistence.loadQueue();
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

  async enqueue(op: SyncOperation): Promise<void> {
    await this.ensureLoaded();
    this.ops.push(op);
    await dataSyncPersistence.saveQueue(this.ops);
  }

  async replaceAll(ops: SyncOperation[]): Promise<void> {
    await this.ensureLoaded();
    this.ops = ops;
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

  async getAll(listId?: string): Promise<SyncOperation[]> {
    await this.ensureLoaded();
    const list = listId
      ? this.ops.filter((op) => op.listId === listId)
      : [...this.ops];
    return list.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    });
  }

  async pendingCount(listId?: string): Promise<number> {
    const all = await this.getAll(listId);
    return all.filter((op) => op.state === "PENDING" || op.state === "FAILED")
      .length;
  }
}
