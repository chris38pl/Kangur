import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SyncOperation } from "./types";

const QUEUE_KEY = "kangur.dataSync.queue.v1";
const SESSION_PREFIX = "kangur.shoppingSession.v1.";

/**
 * Persistence abstraction — durable across restart / process kill.
 * AsyncStorage satisfies requirements; MMKV/SQLite can replace later.
 */
export const dataSyncPersistence = {
  async loadQueue(): Promise<SyncOperation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as SyncOperation[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async saveQueue(ops: SyncOperation[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  },

  async loadSessionSnapshot<T>(listId: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(SESSION_PREFIX + listId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async saveSessionSnapshot(listId: string, snapshot: unknown): Promise<void> {
    await AsyncStorage.setItem(SESSION_PREFIX + listId, JSON.stringify(snapshot));
  },

  async clearSessionSnapshot(listId: string): Promise<void> {
    await AsyncStorage.removeItem(SESSION_PREFIX + listId);
  },

  async listSessionSnapshots<T>(): Promise<T[]> {
    const keys = await AsyncStorage.getAllKeys();
    const sessionKeys = keys.filter((k) => k.startsWith(SESSION_PREFIX));
    if (sessionKeys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(sessionKeys);
    const out: T[] = [];
    for (const [, raw] of pairs) {
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as T);
      } catch {
        // skip corrupt
      }
    }
    return out;
  },
};
