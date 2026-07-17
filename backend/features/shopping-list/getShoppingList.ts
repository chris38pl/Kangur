import { authorizeList } from "@/lib/authorize";

import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function getShoppingList(
  listId: string,
  userId: string,
): Promise<ShoppingListDTO> {
  const { list } = await authorizeList(listId, userId);
  return toShoppingListDto(list);
}
