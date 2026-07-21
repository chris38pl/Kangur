import { apiFetch } from "@/lib/api/client";

import {
  ShoppingListListSchema,
  ShoppingListSchema,
  type ShoppingList,
} from "./schemas";

export async function listShoppingLists(
  token: string,
  workspaceId: string,
): Promise<ShoppingList[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/workspaces/${workspaceId}/lists`,
    { token },
  );
  return ShoppingListListSchema.parse(data).lists;
}

export async function getShoppingList(
  token: string,
  listId: string,
): Promise<ShoppingList> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}`, { token });
  return ShoppingListSchema.parse(data);
}

export async function archiveShoppingList(
  token: string,
  listId: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/lists/${listId}`, {
    token,
    method: "DELETE",
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
  body: { name?: string; emoji?: string; preferredForAi?: boolean },
): Promise<ShoppingList> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}`, {
    token,
    method: "PATCH",
    body,
  });
  return ShoppingListSchema.parse(data);
}
