import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataSyncEngine } from "@/features/data-sync-engine";

import {
  createShoppingItem,
  listShoppingItems,
  updateShoppingItem,
} from "./api";
import type { ItemStatus, ShoppingCategory } from "./schemas";

export function useShoppingItems(listId: string | null, enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["shopping-items", listId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(listId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      const serverItems = await listShoppingItems(token, listId);
      // GET → merge/overlay (last local op wins) → cache — never raw overwrite.
      return DataSyncEngine.reconcileServerSnapshot(listId, serverItems);
    },
  });
}

export function useCreateShoppingItem(listId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      clientId: string;
      name: string;
      amount?: string;
      note?: string;
      category: ShoppingCategory;
    }) => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      return createShoppingItem(token, listId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });
}

export function useUpdateShoppingItem(listId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      itemId: string;
      status?: ItemStatus;
      name?: string;
      amount?: string | null;
      note?: string | null;
      category?: ShoppingCategory;
    }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing auth token");
      }
      return updateShoppingItem(token, input.itemId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });
}
