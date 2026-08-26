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
import { persistShoppingListsCache } from "@/lib/query/persist-bootstrap";

type ListQueryOptions = {
  /** Lists tab: avoid focus/mount refetch spinner — pull-to-refresh only. */
  refetchOnMount?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
};

export function useShoppingLists(
  workspaceId: string | null,
  enabled = true,
  options?: ListQueryOptions,
) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["shopping-lists", workspaceId],
    enabled: enabled && Boolean(isSignedIn) && Boolean(workspaceId),
    refetchOnMount: options?.refetchOnMount,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) {
        throw new Error("Missing auth token or workspace id");
      }
      const data = await listShoppingLists(token, workspaceId);
      void persistShoppingListsCache(workspaceId, data);
      return data;
    },
  });
}

export function useShoppingList(
  listId: string | null,
  enabled = true,
  options?: { allowArchived?: boolean },
) {
  const { getToken, isSignedIn } = useAuth();
  const allowArchived = options?.allowArchived === true;

  return useQuery({
    queryKey: ["shopping-list", listId, allowArchived ? "archived" : "active"],
    enabled: enabled && Boolean(isSignedIn) && Boolean(listId),
    queryFn: async (): Promise<ShoppingList> => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      return getShoppingList(token, listId, { allowArchived });
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

export function useUpdateShoppingList(listId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const shoppingListKeys = (id: string) =>
    [
      ["shopping-list", id] as const,
      ["shopping-list", id, "allow-archived"] as const,
      ["shopping-list", id, "active"] as const,
    ] as const;

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
      if (!listId) return undefined;
      const patching =
        input.name !== undefined ||
        input.emoji !== undefined ||
        input.preferredForAi !== undefined ||
        input.categoryOrder !== undefined;
      if (!patching) return undefined;

      await queryClient.cancelQueries({ queryKey: ["shopping-list", listId] });
      const keys = shoppingListKeys(listId);
      const previousByKey = keys.map(
        (key) =>
          [key, queryClient.getQueryData<ShoppingList>([...key])] as const,
      );

      for (const key of keys) {
        const previous = queryClient.getQueryData<ShoppingList>([...key]);
        if (!previous) continue;
        queryClient.setQueryData<ShoppingList>([...key], {
          ...previous,
          ...(input.name !== undefined
            ? { name: input.name.trim(), isUntitled: false }
            : {}),
          ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
          ...(input.preferredForAi !== undefined
            ? { preferredForAi: input.preferredForAi }
            : {}),
          ...(input.categoryOrder !== undefined
            ? {
                categoryOrder: resolveShoppingCategoryOrder(input.categoryOrder),
              }
            : {}),
        });
      }
      // Never invalidate shopping-items on aisle reorder (SSoT inbound / no flicker).
      return { previousByKey };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousByKey) return;
      for (const [key, previous] of context.previousByKey) {
        if (previous) {
          queryClient.setQueryData([...key], previous);
        }
      }
    },
    onSuccess: async (updated) => {
      for (const key of shoppingListKeys(updated.id)) {
        queryClient.setQueryData([...key], updated);
      }
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
