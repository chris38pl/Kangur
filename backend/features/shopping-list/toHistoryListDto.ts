import type { ShoppingList } from "@prisma/client";

import type { HistoryListDTO } from "./schemas";
import { toShoppingListDto } from "./toShoppingListDto";

export function toHistoryListDto(
  list: ShoppingList & {
    itemCount?: number;
    itemNames?: string[];
    previewItems: HistoryListDTO["previewItems"];
  },
): HistoryListDTO {
  return {
    ...toShoppingListDto(list),
    previewItems: list.previewItems,
  };
}
