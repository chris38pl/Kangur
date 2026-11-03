import type { QueryClient } from "@tanstack/react-query";

import { persistShoppingListsCache } from "@/lib/query/persist-bootstrap";

import type { ShoppingList } from "./schemas";

/** Skip a focus refetch when the index was written moments ago. */
export const WORKSPACE_LIST_INDEX_STALE_MS = 5_000;

/** Collapse a burst of item adds/removes into one index GET. */
export const WORKSPACE_LIST_INDEX_DEBOUNCE_MS = 1_000;

/** Shared-workspace poll while the app is in the foreground. */
export const SHARED_WORKSPACE_LIST_POLL_MS = 12_000;

export const RESUMABLE_SESSIONS_QUERY_KEY = [
  "shopping-sessions",
  "resumable",
] as const;

const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function shoppingListsQueryKey(workspaceId: string) {
  return ["shopping-lists", workspaceId] as const;
}

export function shoppingListsHistoryQueryKey(workspaceId: string) {
  return ["shopping-lists-history", workspaceId] as const;
}

/**
 * Workspace that owns `listId`, from detail cache, the home index, or the
 * active workspace id. Create flows seed the index before detail queries land.
 */
export function resolveWorkspaceIdForList(
  queryClient: QueryClient,
  listId: string,
  explicit?: string | null,
): string | null {
  if (explicit) return explicit;

  const detailKeys = [
    ["shopping-list", listId, "allow-archived"],
    ["shopping-list", listId, "active"],
    ["shopping-list", listId, "archived"],
    ["shopping-list", listId],
  ] as const;

  for (const key of detailKeys) {
    const list = queryClient.getQueryData<ShoppingList>(key);
    if (list?.workspaceId) return list.workspaceId;
  }

  const indexes = queryClient.getQueriesData<ShoppingList[]>({
    queryKey: ["shopping-lists"],
  });
  for (const [key, lists] of indexes) {
    if (!lists?.some((list) => list.id === listId)) continue;
    const workspaceId = key[1];
    if (typeof workspaceId === "string" && workspaceId.length > 0) {
      return workspaceId;
    }
  }

  const activeId = queryClient.getQueryData<string | null>([
    "active-workspace-id",
  ]);
  return typeof activeId === "string" && activeId.length > 0 ? activeId : null;
}

/**
 * Home hides lists with itemCount 0. Bump the cached count so a list the user
 * just filled in shows up before the index GET returns.
 */
export function patchShoppingListItemCount(
  queryClient: QueryClient,
  workspaceId: string | null | undefined,
  listId: string,
  delta: number,
): void {
  if (!workspaceId || delta === 0) return;

  const key = shoppingListsQueryKey(workspaceId);
  const prev = queryClient.getQueryData<ShoppingList[]>(key);
  if (!prev) return;

  let changed = false;
  const next = prev.map((list) => {
    if (list.id !== listId) return list;
    const itemCount = Math.max(0, (list.itemCount ?? 0) + delta);
    if (itemCount === (list.itemCount ?? 0)) return list;
    changed = true;
    return {
      ...list,
      itemCount,
      updatedAt: new Date().toISOString(),
    };
  });
  if (!changed) return;

  queryClient.setQueryData(key, next);
  void persistShoppingListsCache(workspaceId, next);
}

/**
 * Drop an in-flight GET before starting another. listShoppingLists ignores
 * AbortSignal, so a slower older response could otherwise overwrite a newer one.
 * cancelQueries rejects that fetch before the late body is committed.
 */
async function refetchQueryKey(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<void> {
  await queryClient.cancelQueries({ queryKey });
  await queryClient.refetchQueries({ queryKey });
}

/** Quiet index refetch. Does not toggle pull-to-refresh. Failures stay silent. */
export function refreshWorkspaceListIndex(
  queryClient: QueryClient,
  workspaceId: string | null | undefined,
): Promise<void> {
  if (!workspaceId) return Promise.resolve();

  return Promise.all([
    refetchQueryKey(queryClient, shoppingListsQueryKey(workspaceId)),
    refetchQueryKey(queryClient, shoppingListsHistoryQueryKey(workspaceId)),
  ])
    .then(() => undefined)
    .catch(() => undefined);
}

export function refreshResumableSessions(
  queryClient: QueryClient,
): Promise<void> {
  return refetchQueryKey(queryClient, RESUMABLE_SESSIONS_QUERY_KEY).catch(
    () => undefined,
  );
}

export function scheduleRefreshWorkspaceListIndex(
  queryClient: QueryClient,
  workspaceId: string | null | undefined,
  delayMs = WORKSPACE_LIST_INDEX_DEBOUNCE_MS,
): void {
  if (!workspaceId) return;
  const existing = refreshTimers.get(workspaceId);
  if (existing) clearTimeout(existing);
  refreshTimers.set(
    workspaceId,
    setTimeout(() => {
      refreshTimers.delete(workspaceId);
      void refreshWorkspaceListIndex(queryClient, workspaceId);
    }, delayMs),
  );
}

/**
 * Refetch indexes that already have data and are older than `maxAgeMs`.
 * Queries that have never fetched are left to their own mount fetch.
 */
export function refreshWorkspaceListIndexIfStale(
  queryClient: QueryClient,
  workspaceId: string | null | undefined,
  maxAgeMs = WORKSPACE_LIST_INDEX_STALE_MS,
): void {
  if (!workspaceId) return;

  const now = Date.now();
  const listsState = queryClient.getQueryState(
    shoppingListsQueryKey(workspaceId),
  );
  const historyState = queryClient.getQueryState(
    shoppingListsHistoryQueryKey(workspaceId),
  );
  const listsStale =
    listsState?.dataUpdatedAt != null &&
    listsState.dataUpdatedAt > 0 &&
    now - listsState.dataUpdatedAt >= maxAgeMs;
  const historyStale =
    historyState?.dataUpdatedAt != null &&
    historyState.dataUpdatedAt > 0 &&
    now - historyState.dataUpdatedAt >= maxAgeMs;

  if (listsStale) {
    void refetchQueryKey(
      queryClient,
      shoppingListsQueryKey(workspaceId),
    ).catch(() => undefined);
  }
  if (historyStale) {
    void refetchQueryKey(
      queryClient,
      shoppingListsHistoryQueryKey(workspaceId),
    ).catch(() => undefined);
  }
}
