import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import {
  ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY,
  readAdminBrowsingWorkspaceId,
  writeAdminBrowsingWorkspaceId,
} from "@/features/platform-workspaces/admin-browsing";

import type { Workspace } from "./schemas";

const STORAGE_KEY = "kangur.activeWorkspaceId";

export const ACTIVE_WORKSPACE_ID_QUERY_KEY = ["active-workspace-id"] as const;

/**
 * Shared active workspace id (AsyncStorage + React Query) so Home / Workspace /
 * Profile / CreateList all see the same selection immediately.
 */
export function useActiveWorkspace(workspaces: Workspace[] | undefined) {
  const queryClient = useQueryClient();

  const idQuery = useQuery({
    queryKey: ACTIVE_WORKSPACE_ID_QUERY_KEY,
    queryFn: async () => AsyncStorage.getItem(STORAGE_KEY),
    staleTime: Infinity,
  });

  const storedId = idQuery.data ?? null;
  const hydrated = idQuery.isSuccess || idQuery.isError;

  const activeWorkspace =
    workspaces?.find((w) => w.id === storedId) ?? workspaces?.[0] ?? null;

  // Persist fallback when stored id is missing/invalid
  useEffect(() => {
    if (!hydrated || !activeWorkspace) return;
    if (storedId === activeWorkspace.id) return;
    void AsyncStorage.setItem(STORAGE_KEY, activeWorkspace.id).then(() => {
      queryClient.setQueryData(ACTIVE_WORKSPACE_ID_QUERY_KEY, activeWorkspace.id);
    });
  }, [hydrated, activeWorkspace, storedId, queryClient]);

  const setActiveId = useCallback(
    async (id: string) => {
      const browsingId = await readAdminBrowsingWorkspaceId();
      // Leaving admin-browsed space for another workspace clears the overlay.
      if (browsingId && browsingId !== id) {
        await writeAdminBrowsingWorkspaceId(null);
        queryClient.setQueryData(ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY, null);
        queryClient.removeQueries({
          queryKey: ["admin-browsing-workspace"],
        });
      }
      queryClient.setQueryData(ACTIVE_WORKSPACE_ID_QUERY_KEY, id);
      await AsyncStorage.setItem(STORAGE_KEY, id);
    },
    [queryClient],
  );

  return {
    activeWorkspace,
    activeId: activeWorkspace?.id ?? null,
    /** Raw AsyncStorage id — use to prefetch lists before workspaces resolve. */
    storedId,
    setActiveId,
    hydrated,
  };
}
