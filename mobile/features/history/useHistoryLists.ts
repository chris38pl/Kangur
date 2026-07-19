import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listHistoryLists,
  repeatHistoryList,
  restoreHistoryList,
} from "./api";

export function useHistoryLists(workspaceId: string | null, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["shopping-lists-history", workspaceId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace id");
      }
      return listHistoryLists(token, workspaceId);
    },
  });
}

export function useRepeatHistoryList(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return repeatHistoryList(token, listId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists-history", workspaceId],
        }),
      ]);
    },
  });
}

export function useRestoreHistoryList(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return restoreHistoryList(token, listId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists-history", workspaceId],
        }),
      ]);
    },
  });
}
