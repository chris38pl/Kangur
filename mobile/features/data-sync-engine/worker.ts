import type { SyncOperation } from "./types";

export type SyncTransport = {
  execute(op: SyncOperation): Promise<void>;
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
          await this.transport.execute(op);
          await hooks.onOpState?.(op.id, "PENDING"); // removed by caller after success
        } catch (error) {
          if (__DEV__) {
            console.warn("[DataSync]", op.action, op.id, error);
          }
          failed.push(op.id);
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
