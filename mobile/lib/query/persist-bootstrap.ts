import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryClient } from "@tanstack/react-query";

const ME_KEY = "kangur.perf.cache.me";
const WORKSPACES_KEY = "kangur.perf.cache.workspaces";
const LISTS_PREFIX = "kangur.perf.cache.shopping-lists:";

/**
 * Lightweight RQ bootstrap without @tanstack/query-persist.
 * Hydrates me / workspaces / shopping-lists for warm boot paint.
 */
export async function hydrateQueryCacheFromStorage(
  queryClient: QueryClient,
): Promise<{ me: boolean; workspaces: boolean; listsWorkspaceId: string | null }> {
  let me = false;
  let workspaces = false;
  let listsWorkspaceId: string | null = null;

  try {
    const [meRaw, wsRaw, activeId] = await Promise.all([
      AsyncStorage.getItem(ME_KEY),
      AsyncStorage.getItem(WORKSPACES_KEY),
      AsyncStorage.getItem("kangur.activeWorkspaceId"),
    ]);

    if (meRaw) {
      queryClient.setQueryData(["me"], JSON.parse(meRaw));
      me = true;
    }
    if (wsRaw) {
      queryClient.setQueryData(["workspaces"], JSON.parse(wsRaw));
      workspaces = true;
    }
    if (activeId) {
      queryClient.setQueryData(["active-workspace-id"], activeId);
      const listsRaw = await AsyncStorage.getItem(LISTS_PREFIX + activeId);
      if (listsRaw) {
        queryClient.setQueryData(["shopping-lists", activeId], JSON.parse(listsRaw));
        listsWorkspaceId = activeId;
      }
    }
  } catch {
    // Corrupt cache — ignore and fetch fresh.
  }

  return { me, workspaces, listsWorkspaceId };
}

export async function persistMeCache(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(ME_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export async function persistWorkspacesCache(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKSPACES_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export async function persistShoppingListsCache(
  workspaceId: string,
  data: unknown,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LISTS_PREFIX + workspaceId,
      JSON.stringify(data),
    );
  } catch {
    /* ignore */
  }
}
