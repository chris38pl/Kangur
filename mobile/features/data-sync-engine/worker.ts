import type { ShoppingItem } from "@/features/shopping-item/schemas";

import type { SyncOperation } from "./types";

export type SyncTransport = {
  /** Must return canonical server entity when the API provides one (never invent fields). */
  execute(op: SyncOperation): Promise<ShoppingItem | null>;
};

/**
 * Single worker — no concurrent flushes. Transport-agnostic.
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
      onOpState?: (id: string, state: SyncOperation["state"]) => Promise<void>;
      onOpSuccess?: (
        op: SyncOperation,
        item: ShoppingItem | null,
      ) => void | Promise<void>;
      onOpFailed?: (
        op: SyncOperation,
        error: unknown,
      ) => void | Promise<void>;
      onDone?: (failed: number) => void;
    },
  ): Promise<{ failed: string[] }> {
    if (this.running) {
      return { failed: [] };
    }
    if (!this.transport || ops.length === 0) {
      return { failed: [] };
    }

    this.running = true;
    hooks.onStart?.();
    const failed: string[] = [];

    try {
      for (const op of ops) {
        await hooks.onOpState?.(op.id, "SYNCING");
        try {
          const item = await this.transport.execute(op);
          await hooks.onOpSuccess?.(op, item);
          await hooks.onOpState?.(op.id, "PENDING"); // removed by caller after success
        } catch (error) {
          if (__DEV__) {
            console.warn("[DataSync]", op.action, op.id, error);
          }
          failed.push(op.id);
          await hooks.onOpFailed?.(op, error);
          await hooks.onOpState?.(op.id, "FAILED");
        }
      }
    } finally {
      this.running = false;
      hooks.onDone?.(failed.length);
    }

    return { failed };
  }
}
