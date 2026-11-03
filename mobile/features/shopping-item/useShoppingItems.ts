import { useAuth } from "@clerk/clerk-expo";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { DataSyncEngine } from "@/features/data-sync-engine";
import {
  patchShoppingListItemCount,
  resolveWorkspaceIdForList,
  scheduleRefreshWorkspaceListIndex,
} from "@/features/shopping-list/refresh-workspace-list-index";

import {
  createShoppingItem,
  listShoppingItems,
  updateShoppingItem,
} from "./api";
import {
  shoppingItemsQueryKey,
  shoppingItemsQueryPrefix,
} from "./query-keys";
import type { ItemStatus, ShoppingCategory, ShoppingItem } from "./schemas";

function cachedItemStatus(
  queryClient: QueryClient,
  listId: string,
  itemId: string,
): ItemStatus | undefined {
  for (const scope of ["active", "archived"] as const) {
    const items = queryClient.getQueryData<ShoppingItem[]>(
      shoppingItemsQueryKey(listId, scope),
    );
    const found = items?.find((item) => item.id === itemId);
    if (found) return found.status;
  }
  return undefined;
}

export function useShoppingItems(
  listId: string | null,
  enabled = true,
  options?: { allowArchived?: boolean },
) {
  const { getToken, isSignedIn } = useAuth();
  const allowArchived = options?.allowArchived === true;
  const scope = allowArchived ? "archived" : "active";

  return useQuery({
    queryKey: listId
      ? shoppingItemsQueryKey(listId, scope)
      : ["shopping-items", null, scope],
    enabled: enabled && Boolean(isSignedIn) && Boolean(listId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !listId) {
        throw new Error("Missing auth token or list id");
      }
      const serverItems = await listShoppingItems(token, listId, {
        allowArchived,
      });
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
    onMutate: () => {
      if (!listId) return undefined;
      const workspaceId = resolveWorkspaceIdForList(queryClient, listId);
      if (workspaceId) {
        patchShoppingListItemCount(queryClient, workspaceId, listId, 1);
      }
      return { workspaceId, bumped: Boolean(workspaceId) };
    },
    onError: (_error, _input, context) => {
      if (!listId || !context?.bumped || !context.workspaceId) return;
      patchShoppingListItemCount(queryClient, context.workspaceId, listId, -1);
    },
    onSuccess: async (_item, _input, context) => {
      if (!listId) return;
      await queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryPrefix(listId),
      });
      scheduleRefreshWorkspaceListIndex(
        queryClient,
        context?.workspaceId ?? resolveWorkspaceIdForList(queryClient, listId),
      );
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
    onMutate: (input) => {
      if (!listId || input.status !== "removed") return undefined;
      const alreadyRemoved =
        cachedItemStatus(queryClient, listId, input.itemId) === "removed";
      const workspaceId = resolveWorkspaceIdForList(queryClient, listId);
      const bumped = !alreadyRemoved && Boolean(workspaceId);
      if (bumped && workspaceId) {
        patchShoppingListItemCount(queryClient, workspaceId, listId, -1);
      }
      return { workspaceId, bumped };
    },
    onError: (_error, input, context) => {
      if (
        !listId ||
        input.status !== "removed" ||
        !context?.bumped ||
        !context.workspaceId
      ) {
        return;
      }
      patchShoppingListItemCount(queryClient, context.workspaceId, listId, 1);
    },
    onSuccess: async (_item, input, context) => {
      if (!listId) return;
      await queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryPrefix(listId),
      });
      if (input.status !== "removed") return;
      scheduleRefreshWorkspaceListIndex(
        queryClient,
        context?.workspaceId ?? resolveWorkspaceIdForList(queryClient, listId),
      );
    },
  });
}
