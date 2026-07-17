import { DataSyncEngine } from "@/features/data-sync-engine";
import { dataSyncPersistence } from "@/features/data-sync-engine/persistence";

import type {
  SessionAddItem,
  SessionItemPatch,
  SessionSnapshot,
  SessionState,
} from "./types";

type Listener = (snapshot: SessionSnapshot | null) => void;

const ALLOWED: Record<SessionState, SessionState[]> = {
  IDLE: ["STARTING"],
  STARTING: ["ACTIVE", "IDLE"],
  ACTIVE: ["FINISHING", "ENDED"],
  FINISHING: ["ENDED", "ACTIVE"],
  ENDED: ["IDLE"],
};

/**
 * Shopping Session state machine.
 * Only this module mutates SessionState — UI calls methods only.
 *
 * IDLE → STARTING → ACTIVE → FINISHING → ENDED
 */
class ShoppingSessionManager {
  private snapshots = new Map<string, SessionSnapshot>();
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(snapshot: SessionSnapshot | null) {
    for (const l of this.listeners) l(snapshot);
  }

  get(listId: string): SessionSnapshot | null {
    return this.snapshots.get(listId) ?? null;
  }

  /** Active / interrupted sessions for Home Continue Shopping. */
  async listResumable(): Promise<SessionSnapshot[]> {
    const all =
      await dataSyncPersistence.listSessionSnapshots<SessionSnapshot>();
    return all.filter(
      (s) =>
        s.state === "ACTIVE" ||
        s.state === "STARTING" ||
        s.state === "FINISHING",
    );
  }

  /**
   * Restore an interrupted session. Opening shopping mode (e.g. Home "Resume")
   * already means continue — no confirmation prompt.
   */
  async hydrate(listId: string): Promise<SessionSnapshot | null> {
    const saved =
      await dataSyncPersistence.loadSessionSnapshot<SessionSnapshot>(listId);
    if (!saved) return null;

    if (
      saved.state === "ACTIVE" ||
      saved.state === "STARTING" ||
      saved.state === "FINISHING"
    ) {
      const next: SessionSnapshot = {
        ...saved,
        state: "ACTIVE",
        updatedAt: new Date().toISOString(),
      };
      if (saved.state !== "ACTIVE") {
        await this.persist(next);
      } else {
        this.snapshots.set(listId, next);
        this.emit(next);
      }
      return next;
    }
    return null;
  }

  private async persist(snapshot: SessionSnapshot): Promise<void> {
    this.snapshots.set(snapshot.listId, snapshot);
    await dataSyncPersistence.saveSessionSnapshot(snapshot.listId, snapshot);
    this.emit(snapshot);
  }

  private assertTransition(from: SessionState, to: SessionState): void {
    if (!ALLOWED[from].includes(to)) {
      throw new Error(`Invalid session transition ${from} → ${to}`);
    }
  }

  async start(listId: string, workspaceId: string): Promise<SessionSnapshot> {
    const existing = this.snapshots.get(listId);
    if (existing?.state === "ACTIVE") return existing;

    let snap: SessionSnapshot = {
      sessionVersion: 1,
      listId,
      workspaceId,
      state: "IDLE",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.assertTransition(snap.state, "STARTING");
    snap = { ...snap, state: "STARTING", updatedAt: new Date().toISOString() };
    await this.persist(snap);

    this.assertTransition(snap.state, "ACTIVE");
    snap = { ...snap, state: "ACTIVE", updatedAt: new Date().toISOString() };
    await this.persist(snap);
    return snap;
  }

  async discard(listId: string): Promise<void> {
    await DataSyncEngine.clear(listId);
    await dataSyncPersistence.clearSessionSnapshot(listId);
    this.snapshots.delete(listId);
    this.emit(null);
  }

  /** Optimistic status change — enqueues SET_STATUS; UI never waits on network. */
  async setItemStatus(listId: string, patch: SessionItemPatch): Promise<void> {
    await DataSyncEngine.enqueue({
      listId,
      itemId: patch.itemId,
      action: "SET_STATUS",
      payload: { status: patch.status },
    });
  }

  async addItem(listId: string, item: SessionAddItem): Promise<void> {
    await DataSyncEngine.enqueue({
      listId,
      itemId: item.clientId,
      action: "ADD_ITEM",
      payload: { ...item },
    });
  }

  /**
   * Finish shopping. Offline: end session, enqueue ARCHIVE_LIST, hide locally.
   */
  async finish(listId: string): Promise<SessionSnapshot> {
    let snap = this.snapshots.get(listId);
    if (!snap || snap.state !== "ACTIVE") {
      snap = {
        sessionVersion: 1,
        listId,
        workspaceId: snap?.workspaceId ?? "",
        state: "ACTIVE",
        startedAt: snap?.startedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.snapshots.set(listId, snap);
    }

    this.assertTransition(snap.state, "FINISHING");
    snap = { ...snap, state: "FINISHING", updatedAt: new Date().toISOString() };
    await this.persist(snap);

    await DataSyncEngine.enqueue({
      listId,
      action: "ARCHIVE_LIST",
      payload: {},
    });

    this.assertTransition(snap.state, "ENDED");
    snap = {
      ...snap,
      state: "ENDED",
      locallyHidden: true,
      updatedAt: new Date().toISOString(),
    };
    await this.persist(snap);

    void DataSyncEngine.flush(listId);
    return snap;
  }

  async clearEnded(listId: string): Promise<void> {
    await dataSyncPersistence.clearSessionSnapshot(listId);
    this.snapshots.delete(listId);
    this.emit(null);
  }
}

export const ShoppingSession = new ShoppingSessionManager();
