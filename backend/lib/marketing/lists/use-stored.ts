"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Everything typed into the tools stays on this device, under one prefix. */
const PREFIX = "kangur-www:";

const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  // Private mode may refuse to store anything; the tool still has to work until reload.
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Kept in memory above.
  }
  listeners.get(key)?.forEach((listener) => listener());
}

/**
 * State that survives a reload. Server HTML and the first client render use `fallback`, so
 * there is nothing to mismatch. `fallback` has to be a stable reference.
 */
export function useStored<T>(
  key: string,
  fallback: T,
): [value: T, set: (next: T) => void, clear: () => void] {
  const subscribe = useCallback(
    (listener: () => void) => {
      const set = listeners.get(key) ?? new Set();
      listeners.set(key, set);
      set.add(listener);
      return () => set.delete(listener);
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
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const set = useCallback((next: T) => write(key, JSON.stringify(next)), [key]);
  const clear = useCallback(() => write(key, null), [key]);
  return [value, set, clear];
}
