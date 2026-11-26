import { AppState, type AppStateStatus } from "react-native";

type Listener = (online: boolean) => void;

/** While offline in the foreground, the probe runs again this often. */
const OFFLINE_RECHECK_MS = 15_000;

/**
 * Connectivity without native NetInfo dependency.
 * Defaults online; flips offline when marked by transport failures;
 * re-checks via optional probe on AppState active, and every
 * OFFLINE_RECHECK_MS while offline in the foreground. Android fires no
 * AppState change when airplane mode is switched off from the notification
 * shade, so without the re-check the queue would wait for the next app switch.
 */
export class Connectivity {
  private online = true;
  private listeners = new Set<Listener>();
  private appSub: { remove: () => void } | null = null;
  private foreground = false;
  private probe: (() => Promise<boolean>) | null = null;
  /** Probe in flight. Callers share it, so answers never arrive out of order. */
  private checking: Promise<void> | null = null;
  private recheckTimer: ReturnType<typeof setTimeout> | null = null;

  setProbe(probe: () => Promise<boolean>): void {
    this.probe = probe;
  }

  start(): void {
    if (this.appSub) return;
    this.foreground = AppState.currentState === "active";
    this.appSub = AppState.addEventListener("change", (next: AppStateStatus) => {
      this.foreground = next === "active";
      if (this.foreground) {
        void this.refresh();
      } else {
        this.updateRecheck();
      }
    });
    void this.refresh();
  }

  stop(): void {
    this.appSub?.remove();
    this.appSub = null;
    this.foreground = false;
    this.updateRecheck();
  }

  refresh(): Promise<void> {
    const probe = this.probe;
    if (!probe) return Promise.resolve();
    this.checking ??= (async () => {
      let next = false;
      try {
        next = await probe();
      } catch {
        next = false;
      }
      this.checking = null;
      this.setOnline(next);
    })();
    return this.checking;
  }

  setOnline(next: boolean): void {
    const changed = next !== this.online;
    this.online = next;
    this.updateRecheck();
    if (!changed) return;
    for (const l of this.listeners) l(this.online);
  }

  isOnline(): boolean {
    return this.online;
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** One re-check pending while offline in the foreground, none otherwise. */
  private updateRecheck(): void {
    if (this.online || !this.foreground || !this.probe) {
      if (this.recheckTimer) clearTimeout(this.recheckTimer);
      this.recheckTimer = null;
      return;
    }
    if (this.recheckTimer) return;
    this.recheckTimer = setTimeout(() => {
      this.recheckTimer = null;
      void this.refresh();
    }, OFFLINE_RECHECK_MS);
  }
}
