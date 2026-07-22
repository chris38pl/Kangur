import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resolveShoppingCategoryOrder } from "@shared/shopping-categories";

import {
  archiveShoppingList,
  createShoppingList,
  getShoppingList,
  listShoppingLists,
  updateShoppingList,
} from "./api";
import { markListProvisional } from "./provisional-list";
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
    onSuccess: async (list) => {
      // Must run before shopping-lists refetch - Home archives empty non-provisional lists.
      markListProvisional(list.id);
      if (workspaceId) {
        const { oncePerUser } = await import("@/lib/analytics/once");
        const { Analytics } = await import("@/lib/analytics");
        void oncePerUser("first_list_created", () => {
          Analytics.track("first_list_created", {
            workspace_id: workspaceId,
            list_id: list.id,
          });
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["shopping-lists", workspaceId],
      });
    },
  });
}

/** Soft-delete (archive) - removes list from active home. */
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists-history"],
        }),
      ]);
    },
  });
}

export function useUpdateShoppingList(listId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name?: string;
      emoji?: string;
      preferredForAi?: boolean;
      categoryOrder?: string[];
    }) => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      return updateShoppingList(token, listId, input);
    },
    onMutate: async (input) => {
      if (!listId || input.categoryOrder === undefined) return undefined;
      await queryClient.cancelQueries({ queryKey: ["shopping-list", listId] });
      const previous = queryClient.getQueryData<ShoppingList>([
        "shopping-list",
        listId,
      ]);
      if (previous) {
        queryClient.setQueryData<ShoppingList>(["shopping-list", listId], {
          ...previous,
          categoryOrder: resolveShoppingCategoryOrder(input.categoryOrder),
        });
      }
      // Never invalidate shopping-items on aisle reorder (SSoT inbound / no flicker).
      return { previous };
    },
    onError: (_error, input, context) => {
      if (listId && input.categoryOrder !== undefined && context?.previous) {
        queryClient.setQueryData(["shopping-list", listId], context.previous);
      }
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(["shopping-list", updated.id], updated);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists", updated.workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shopping-lists-history", updated.workspaceId],
        }),
      ]);
    },
  });
}
