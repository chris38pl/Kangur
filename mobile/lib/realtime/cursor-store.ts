import AsyncStorage from "@react-native-async-storage/async-storage";

import type { EventCursor } from "./types";

const keyFor = (listId: string) => `realtime:cursor:${listId}`;

export async function loadEventCursor(
  listId: string,
): Promise<EventCursor | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(listId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EventCursor>;
    if (
      typeof parsed.lastEventId !== "string" ||
      typeof parsed.lastUpdatedAt !== "string"
    ) {
      return null;
    }
    return {
      lastEventId: parsed.lastEventId,
      lastUpdatedAt: parsed.lastUpdatedAt,
    };
  } catch {
    return null;
  }
}

export async function saveEventCursor(
  listId: string,
  cursor: EventCursor,
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(listId), JSON.stringify(cursor));
  } catch {
    // best-effort
  }
}
