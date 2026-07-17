import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
      return listShoppingItems(token, listId);
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
