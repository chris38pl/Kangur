import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const STORAGE_KEY = "kangur.adminBrowsingWorkspaceId";

export const ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY = [
  "admin-browsing-workspace-id",
] as const;

export const ADMIN_BROWSING_WORKSPACE_QUERY_KEY = [
  "admin-browsing-workspace",
] as const;

export async function readAdminBrowsingWorkspaceId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function writeAdminBrowsingWorkspaceId(
  id: string | null,
): Promise<void> {
  if (id) await AsyncStorage.setItem(STORAGE_KEY, id);
  else await AsyncStorage.removeItem(STORAGE_KEY);
}

export function useAdminBrowsingWorkspaceId() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY,
    queryFn: readAdminBrowsingWorkspaceId,
    staleTime: Infinity,
  });

  const setBrowsingId = useCallback(
    async (id: string | null) => {
      await writeAdminBrowsingWorkspaceId(id);
      queryClient.setQueryData(ADMIN_BROWSING_WORKSPACE_ID_QUERY_KEY, id);
      if (!id) {
        queryClient.removeQueries({
          queryKey: ADMIN_BROWSING_WORKSPACE_QUERY_KEY,
        });
      }
    },
    [queryClient],
  );

  return {
    browsingId: query.data ?? null,
    hydrated: query.isSuccess || query.isError,
    setBrowsingId,
  };
}
