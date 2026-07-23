import { authorizeList } from "@/lib/authorize";
import { assertArchivedListWithinHistoryDepth } from "@/features/shopping-list/historyAccess";

import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function getShoppingList(
  listId: string,
  userId: string,
  options?: { allowArchived?: boolean },
): Promise<ShoppingListDTO> {
  const { list } = await authorizeList(listId, userId, {
    allowArchived: options?.allowArchived === true,
  });
  if (list.status === "archived") {
    await assertArchivedListWithinHistoryDepth({
      workspaceId: list.workspaceId,
      listId: list.id,
    });
  }
  return toShoppingListDto(list);
}
