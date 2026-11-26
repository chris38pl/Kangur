import { apiFetch } from "@/lib/api/client";

import {
  ShoppingListListSchema,
  ShoppingListSchema,
  type ShoppingList,
} from "./schemas";

export async function listShoppingLists(
  token: string,
  workspaceId: string,
  options?: { timeoutMs?: number },
): Promise<ShoppingList[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/lists`,
    { token, timeoutMs: options?.timeoutMs },
  );
  return ShoppingListListSchema.parse(data).lists;
}

export async function getShoppingList(
  token: string,
  listId: string,
  options?: { allowArchived?: boolean },
): Promise<ShoppingList> {
  const q = options?.allowArchived ? "?allowArchived=1" : "";
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}${q}`, {
    token,
  });
  return ShoppingListSchema.parse(data);
}

/** User "Delete list": hides the list from Home and History. */
export async function archiveShoppingList(
  token: string,
  listId: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/lists/${listId}`, {
    token,
    method: "DELETE",
  });
}

/**
 * Finish shopping without a server session id (the trip started offline):
 * the list moves to History. With a session id use finishShoppingSession.
 */
export async function finishShoppingList(
  token: string,
  listId: string,
  unavailableCount: number,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/lists/${listId}/finish`, {
    token,
    method: "POST",
    body: { unavailableCount },
  });
}

export async function createShoppingList(
  token: string,
  workspaceId: string,
  body: { name: string; emoji?: string },
): Promise<ShoppingList> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/lists`,
    {
      token,
      method: "POST",
      body,
    },
  );
  return ShoppingListSchema.parse(data);
}

export async function updateShoppingList(
  token: string,
  listId: string,
  body: {
    name?: string;
    emoji?: string;
    preferredForAi?: boolean;
    categoryOrder?: string[];
  },
): Promise<ShoppingList> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}`, {
    token,
    method: "PATCH",
    body,
  });
  return ShoppingListSchema.parse(data);
}
