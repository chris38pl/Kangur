import { AppState, type AppStateStatus } from "react-native";

type Listener = (online: boolean) => void;

/**
 * Connectivity without native NetInfo dependency.
 * Defaults online; flips offline when marked by transport failures;
 * re-checks on AppState active via optional probe.
 */
export class Connectivity {
  private online = true;
  private listeners = new Set<Listener>();
  private appSub: { remove: () => void } | null = null;
  private probe: (() => Promise<boolean>) | null = null;

  setProbe(probe: () => Promise<boolean>): void {
    this.probe = probe;
  }

  start(): void {
    if (this.appSub) return;
    this.appSub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        void this.refresh();
      }
    });
    void this.refresh();
  }

  stop(): void {
    this.appSub?.remove();
    this.appSub = null;
  }

  async refresh(): Promise<void> {
    if (!this.probe) return;
    try {
      const next = await this.probe();
      this.setOnline(next);
    } catch {
      this.setOnline(false);
    }
  }

  setOnline(next: boolean): void {
    if (next === this.online) return;
    this.online = next;
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
}
