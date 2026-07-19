import { apiFetch } from "@/lib/api/client";

import { ShoppingListSchema, type ShoppingList } from "@/features/shopping-list/schemas";

import {
  HistoryListResponseSchema,
  type HistoryList,
} from "./schemas";

export async function listHistoryLists(
  token: string,
  workspaceId: string,
): Promise<HistoryList[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/lists/history`,
    { token },
  );
  return HistoryListResponseSchema.parse(data).lists;
}

export async function restoreHistoryList(
  token: string,
  listId: string,
): Promise<ShoppingList> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}/restore`, {
    token,
    method: "POST",
  });
  return ShoppingListSchema.parse(data);
}

export async function repeatHistoryList(
  token: string,
  listId: string,
): Promise<ShoppingList> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}/repeat`, {
    token,
    method: "POST",
  });
  return ShoppingListSchema.parse(data);
}
