import type { ItemStatus } from "@/features/shopping-item/schemas";
import { useEffect, useState } from "react";

import { ShoppingSession } from "./shopping-session";
import type { SessionAddItem, SessionSnapshot } from "./types";

export function useShoppingSession(listId: string | null) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(
    listId ? ShoppingSession.get(listId) : null,
  );
  const [needsResume, setNeedsResume] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!listId) {
      setHydrated(true);
      return;
    }
    let mounted = true;
    setHydrated(false);
    void ShoppingSession.hydrate(listId).then((saved) => {
      if (!mounted) return;
      if (saved && ShoppingSession.getRecoveryPrompt()?.listId === listId) {
        setNeedsResume(true);
      }
      setSnapshot(ShoppingSession.get(listId));
      setHydrated(true);
    });
    return ShoppingSession.subscribe((s) => {
      if (!s || s.listId === listId) setSnapshot(s);
    });
  }, [listId]);

  return {
    snapshot,
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
