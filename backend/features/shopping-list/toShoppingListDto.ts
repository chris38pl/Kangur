import type { ShoppingList } from "@prisma/client";

import type { ShoppingListDTO } from "./schemas";

const PREVIEW_TAKE = 3;

export function toShoppingListDto(
  list: ShoppingList & {
    itemCount?: number;
    itemNames?: string[];
    previewItems?: ShoppingListDTO["previewItems"];
  },
): ShoppingListDTO {
  return {
    id: list.id,
    workspaceId: list.workspaceId,
    name: list.name,
    emoji: list.emoji,
    status: list.status,
    isUntitled: list.isUntitled,
    itemCount: list.itemCount ?? 0,
    itemNames: list.itemNames ?? [],
    previewItems: list.previewItems ?? [],
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}

export { PREVIEW_TAKE };
