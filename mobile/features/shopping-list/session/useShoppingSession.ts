import type { ItemStatus } from "@/features/shopping-item/schemas";
import { useEffect, useState } from "react";

import { ShoppingSession } from "./shopping-session";
import type { SessionAddItem, SessionSnapshot } from "./types";

export function useShoppingSession(listId: string | null) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(
    listId ? ShoppingSession.get(listId) : null,
  );
  const [needsResume, setNeedsResume] = useState(false);
  /** Which listId finished AsyncStorage hydrate (null list = already ready). */
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const hydrated = listId === null || hydratedFor === listId;

  useEffect(() => {
    if (!listId) return;

    let mounted = true;
    void ShoppingSession.hydrate(listId).then((saved) => {
      if (!mounted) return;
      if (saved && ShoppingSession.getRecoveryPrompt()?.listId === listId) {
        setNeedsResume(true);
      }
      setSnapshot(ShoppingSession.get(listId));
      setHydratedFor(listId);
    });

    const unsubscribe = ShoppingSession.subscribe((s) => {
      if (!s || s.listId === listId) setSnapshot(s);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [listId]);

  return {
    snapshot: listId ? snapshot : null,
    needsResume,
    hydrated,
    clearResumePrompt: () => setNeedsResume(false),
    start: (workspaceId: string) =>
      listId
        ? ShoppingSession.start(listId, workspaceId)
        : Promise.reject(new Error("No list")),
    continueRecovery: () =>
      listId
        ? ShoppingSession.continueRecovery(listId)
        : Promise.reject(new Error("No list")),
    discard: () =>
      listId ? ShoppingSession.discard(listId) : Promise.resolve(),
    setItemStatus: (itemId: string, status: ItemStatus) =>
      listId
        ? ShoppingSession.setItemStatus(listId, { itemId, status })
        : Promise.resolve(),
    addItem: (item: SessionAddItem) =>
      listId ? ShoppingSession.addItem(listId, item) : Promise.resolve(),
    finish: () =>
      listId
        ? ShoppingSession.finish(listId)
        : Promise.reject(new Error("No list")),
    clearEnded: () =>
      listId ? ShoppingSession.clearEnded(listId) : Promise.resolve(),
  };
}
