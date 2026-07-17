import { apiFetch } from "@/lib/api/client";

import {
  ShoppingItemListSchema,
  ShoppingItemSchema,
  type ItemStatus,
  type ShoppingCategory,
  type ShoppingItem,
} from "./schemas";

export async function listShoppingItems(
  token: string,
  listId: string,
): Promise<ShoppingItem[]> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}/items`, { token });
  return ShoppingItemListSchema.parse(data).items;
}

export async function createShoppingItem(
  token: string,
  listId: string,
  body: {
    clientId: string;
    name: string;
    amount?: string;
    note?: string;
    category: ShoppingCategory;
  },
): Promise<ShoppingItem> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}/items`, {
    token,
    method: "POST",
    body,
  });
  return ShoppingItemSchema.parse(data);
}

export async function updateShoppingItem(
  token: string,
  itemId: string,
  body: Partial<{
    name: string;
    amount: string | null;
    note: string | null;
    category: ShoppingCategory;
    status: ItemStatus;
  }>,
): Promise<ShoppingItem> {
  const data = await apiFetch<unknown>(`/api/v1/items/${itemId}`, {
    token,
    method: "PATCH",
    body,
  });
  return ShoppingItemSchema.parse(data);
}
