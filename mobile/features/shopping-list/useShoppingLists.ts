import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveShoppingList,
  createShoppingList,
  getShoppingList,
  listShoppingLists,
  updateShoppingList,
} from "./api";
import type { ShoppingList } from "./schemas";

export function useShoppingLists(workspaceId: string | null, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["shopping-lists", workspaceId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace id");
      }
      return listShoppingLists(token, workspaceId);
    },
  });
}

export function useShoppingList(listId: string | null, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["shopping-list", listId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(listId),
    queryFn: async (): Promise<ShoppingList> => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      return getShoppingList(token, listId);
    },
  });
}

export function useCreateShoppingList(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; emoji?: string }) => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace id");
      }
      return createShoppingList(token, workspaceId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shopping-lists", workspaceId],
      });
    },
  });
}

/** Soft-delete (archive) — removes list from active home. */
export function useArchiveShoppingList(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing auth token");
      }
      await archiveShoppingList(token, listId);
      return listId;
    },
    onSuccess: async (listId) => {
      if (workspaceId) {
        queryClient.setQueryData(
          ["shopping-lists", workspaceId],
          (prev: ShoppingList[] | undefined) =>
            prev?.filter((list) => list.id !== listId) ?? prev,
        );
      }
      queryClient.removeQueries({ queryKey: ["shopping-list", listId] });
      queryClient.removeQueries({ queryKey: ["shopping-items", listId] });
      await queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
    },
  });
}

export function useUpdateShoppingList(listId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name?: string; emoji?: string }) => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      return updateShoppingList(token, listId, input);
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(["shopping-list", updated.id], updated);
      await queryClient.invalidateQueries({
        queryKey: ["shopping-lists", updated.workspaceId],
      });
    },
  });
}
