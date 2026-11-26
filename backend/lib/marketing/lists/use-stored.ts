"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Everything typed into the tools stays on this device, under one prefix. */
const PREFIX = "kangur-www:";

/** Only what the browser refused to store. The tool still has to work until reload. */
const memory = new Map<string, string | null>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): string | null {
  const kept = memory.get(key);
  if (kept !== undefined) return kept;
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

/** Is anything saved under this name? */
export const hasStored = (key: string): boolean => read(key) !== null;

/** What is saved right now, also before React has caught up with it. */
export function readStored<T>(key: string, fallback: T, parse: (stored: unknown) => T): T {
  const raw = read(key);
  if (raw === null) return fallback;
  try {
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
    try {
      // Full storage must not bring yesterday's list back after a reload.
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      // Kept in memory above.
    }
  }
  listeners.get(key)?.forEach((listener) => listener());
}

const never = () => () => {};

/** False in the server HTML and until React has taken the page over. */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    never,
    () => true,
    () => false,
  );

/**
 * State that survives a reload and follows the other tabs. Server HTML and the first client
 * render use `fallback`, so there is nothing to mismatch. `parse` turns whatever is in the
 * browser into a value we can trust. Both have to be stable references.
 */
export function useStored<T>(
  key: string,
  fallback: T,
  parse: (stored: unknown) => T,
): [value: T, set: (next: T) => void, clear: () => void] {
  const subscribe = useCallback(
    (listener: () => void) => {
      const set = listeners.get(key) ?? new Set();
      listeners.set(key, set);
      set.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === PREFIX + key || event.key === null) listener();
      };
      // A page taken from the back-forward cache has slept through everything.
      const onShow = (event: PageTransitionEvent) => {
        if (event.persisted) listener();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener("pageshow", onShow);
      return () => {
        set.delete(listener);
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("pageshow", onShow);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      return parse(JSON.parse(raw));
    } catch {
      return fallback;
    }
  }, [raw, fallback, parse]);

  const set = useCallback((next: T) => write(key, JSON.stringify(next)), [key]);
  const clear = useCallback(() => write(key, null), [key]);
  return [value, set, clear];
}
