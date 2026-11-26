import type { ShoppingItem } from "@/features/shopping-item/schemas";

import { isPermanentRejection } from "./replay";
import type { SyncOperation } from "./types";

export type SyncTransport = {
  /** Must return canonical server entity when the API provides one (never invent fields). */
  execute(op: SyncOperation): Promise<ShoppingItem | null>;
};

export type SyncFlushResult = {
  /** Sent and confirmed by the server. */
  done: string[];
  /** Could not be sent (offline, server error); kept for the next flush. */
  failed: string[];
  /** Rejected by the server for good (e.g. 404 list gone); retrying cannot help. */
  dropped: string[];
};

/**
 * Single worker - no concurrent flushes. Transport-agnostic.
 *
 * Ops run in the order given. Once an op fails and can be retried, the rest
 * of that list waits for the next flush, so no later change (and no finish)
 * overtakes it.
 */
export class SyncWorker {
  private running = false;
  private transport: SyncTransport | null = null;

  setTransport(transport: SyncTransport): void {
    this.transport = transport;
  }

  isRunning(): boolean {
    return this.running;
  }

  async flush(
    ops: SyncOperation[],
    hooks: {
      onStart?: () => void;
      /**
       * Latest version of the op to send, or null to leave it queued for a
       * later flush (removed meanwhile, or it has to wait for other ops).
       */
      prepare?: (op: SyncOperation) => Promise<SyncOperation | null>;
      onOpState?: (id: string, state: SyncOperation["state"]) => Promise<void>;
      onOpSuccess?: (
        op: SyncOperation,
        item: ShoppingItem | null,
      ) => void | Promise<void>;
      onOpFailed?: (
        op: SyncOperation,
        error: unknown,
      ) => void | Promise<void>;
      onOpDropped?: (
        op: SyncOperation,
        error: unknown,
      ) => void | Promise<void>;
      onDone?: (failed: number) => void;
    },
  ): Promise<SyncFlushResult> {
    const result: SyncFlushResult = { done: [], failed: [], dropped: [] };
    if (this.running) {
      return result;
    }
    if (!this.transport || ops.length === 0) {
      return result;
    }

    this.running = true;
    hooks.onStart?.();
    const blockedLists = new Set<string>();

    try {
      for (const queued of ops) {
        if (blockedLists.has(queued.listId)) continue;
        const op = hooks.prepare ? await hooks.prepare(queued) : queued;
        if (!op) continue;

        await hooks.onOpState?.(op.id, "SYNCING");
        try {
          const item = await this.transport.execute(op);
          await hooks.onOpSuccess?.(op, item);
          result.done.push(op.id);
        } catch (error) {
          if (__DEV__) {
            console.warn("[DataSync]", op.action, op.id, error);
          }
          if (isPermanentRejection(error)) {
            result.dropped.push(op.id);
            await hooks.onOpDropped?.(op, error);
            continue;
          }
          result.failed.push(op.id);
          blockedLists.add(op.listId);
          await hooks.onOpFailed?.(op, error);
          await hooks.onOpState?.(op.id, "FAILED");
        }
      }
    } finally {
      this.running = false;
      hooks.onDone?.(result.failed.length);
    }

    return result;
  }
}
