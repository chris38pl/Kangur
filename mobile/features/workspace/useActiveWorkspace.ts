import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import type { Workspace } from "./schemas";

const STORAGE_KEY = "kangur.activeWorkspaceId";

export function useActiveWorkspace(workspaces: Workspace[] | undefined) {
  const [storedId, setStoredId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setStoredId(stored);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const activeWorkspace =
    workspaces?.find((w) => w.id === storedId) ?? workspaces?.[0] ?? null;

  // Persist fallback when stored id is missing/invalid — no React state update needed
  useEffect(() => {
    if (!hydrated || !activeWorkspace) return;
    if (storedId === activeWorkspace.id) return;
    void AsyncStorage.setItem(STORAGE_KEY, activeWorkspace.id);
  }, [hydrated, activeWorkspace, storedId]);

  const setActiveId = useCallback(async (id: string) => {
    setStoredId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  return {
    activeWorkspace,
    activeId: activeWorkspace?.id ?? null,
    setActiveId,
    hydrated,
  };
}
