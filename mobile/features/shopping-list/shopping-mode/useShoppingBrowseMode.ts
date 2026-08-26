import { useCallback, useEffect, useState } from "react";

import { useMe } from "@/features/auth/useMe";

import {
  readShoppingBrowseMode,
  writeShoppingBrowseMode,
  type ShoppingBrowseMode,
} from "./shopping-browse-mode-storage";

const DEFAULT_MODE: ShoppingBrowseMode = "aisles";

/** Global per-user shopping home layout preference (aisles vs flat list). */
export function useShoppingBrowseMode() {
  const me = useMe();
  const userId = me.data?.id ?? null;
  const [mode, setModeState] = useState<ShoppingBrowseMode>(DEFAULT_MODE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      // Defer so we don't sync-setState inside the effect body (react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        setModeState(DEFAULT_MODE);
        setReady(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setReady(false);
    });
    void readShoppingBrowseMode(userId).then((stored) => {
      if (cancelled) return;
      setModeState(stored);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setMode = useCallback(
    (next: ShoppingBrowseMode) => {
      setModeState(next);
      if (userId) void writeShoppingBrowseMode(userId, next);
    },
    [userId],
  );

  return { mode, setMode, ready, userId };
}
