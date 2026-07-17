import type { ShoppingList } from "@prisma/client";

import type { ShoppingListDTO } from "./schemas";

export function toShoppingListDto(list: ShoppingList): ShoppingListDTO {
  return {
    id: list.id,
    workspaceId: list.workspaceId,
    name: list.name,
    emoji: list.emoji,
    status: list.status,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}
