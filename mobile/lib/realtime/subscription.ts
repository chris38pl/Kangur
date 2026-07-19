import { AppState, type AppStateStatus } from "react-native";

import { DataSyncEngine } from "@/features/data-sync-engine";
import { listShoppingEvents } from "@/features/shopping-item/api";
import type { ShoppingEvent } from "@/features/shopping-item/schemas";

import {
  createEventPollingProvider,
  type EventPollingProviderInstance,
} from "./EventPollingProvider";
import type { EventBatchMeta } from "./types";

type GetToken = () => Promise<string | null>;
type BatchHandler = (
  events: ShoppingEvent[],
  meta: EventBatchMeta,
) => void;

type SubState = {
  listId: string | null;
  refCount: number;
  provider: EventPollingProviderInstance | null;
  getToken: GetToken | null;
  onBatch: BatchHandler | null;
  appSub: { remove: () => void } | null;
  offOnline: (() => void) | null;
};

const sub: SubState = {
  listId: null,
  refCount: 0,
  provider: null,
  getToken: null,
  onBatch: null,
  appSub: null,
  offOnline: null,
};

function ensureProvider(): EventPollingProviderInstance {
  if (sub.provider) return sub.provider;

  sub.provider = createEventPollingProvider({
    isOnline: () => DataSyncEngine.isOnline(),
    fetchPage: async (listId, after) => {
      const token = await sub.getToken?.();
      if (!token) throw new Error("Missing auth token");
      return listShoppingEvents(token, listId, after);
    },
    onBatch: (events, meta) => {
      sub.onBatch?.(events, meta);
    },
    onError: (error) => {
      if (__DEV__) {
        console.info("[realtime]", "PollFailed", error);
      }
    },
  });

  return sub.provider;
}

function attachGlobalListeners(provider: EventPollingProviderInstance) {
  if (!sub.appSub) {
    sub.appSub = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (sub.refCount <= 0) return;
        if (next === "background" || next === "inactive") {
          provider.pause();
        } else if (next === "active") {
          provider.resume();
          provider.pollNow();
        }
      },
    );
  }

  if (!sub.offOnline) {
    let wasOnline = DataSyncEngine.isOnline();
    sub.offOnline = DataSyncEngine.connectivity.onChange((online) => {
      if (sub.refCount <= 0) return;
      if (!online) {
        provider.pause();
        wasOnline = false;
        return;
      }
      if (!wasOnline) {
        provider.resume();
        provider.pollNow();
      }
      wasOnline = online;
    });
  }
}

function detachGlobalListenersIfIdle() {
  if (sub.refCount > 0) return;
  sub.appSub?.remove();
  sub.appSub = null;
  sub.offOnline?.();
  sub.offOnline = null;
}

/**
 * Ref-counted subscription to event polling for a list.
 * Same listId increments refCount without restart; list change stops old / starts new.
 */
export function subscribeListEvents(input: {
  listId: string;
  getToken: GetToken;
  onBatch: BatchHandler;
}): () => void {
  const provider = ensureProvider();
  attachGlobalListeners(provider);

  sub.getToken = input.getToken;
  sub.onBatch = input.onBatch;

  if (sub.listId === input.listId && sub.refCount > 0) {
    sub.refCount += 1;
  } else if (sub.listId && sub.listId !== input.listId) {
    provider.stop();
    sub.listId = input.listId;
    sub.refCount = 1;
    if (DataSyncEngine.isOnline()) {
      provider.start(input.listId);
    } else {
      // Stay stopped until online; still record active list for resume.
      provider.start(input.listId);
      provider.pause();
    }
  } else {
    sub.listId = input.listId;
    sub.refCount = 1;
    if (DataSyncEngine.isOnline()) {
      provider.start(input.listId);
    } else {
      provider.start(input.listId);
      provider.pause();
    }
  }

  let unsubscribed = false;
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
    sub.refCount = Math.max(0, sub.refCount - 1);
    if (sub.refCount === 0) {
      provider.stop();
      sub.listId = null;
      sub.onBatch = null;
      detachGlobalListenersIfIdle();
    }
  };
}
