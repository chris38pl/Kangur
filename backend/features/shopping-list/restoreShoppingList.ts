import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";
import { conflict } from "@/lib/auth/errors";

import { assertArchivedListWithinHistoryDepth } from "./historyAccess";
import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function restoreShoppingList(input: {
  listId: string;
  userId: string;
}): Promise<ShoppingListDTO> {
  const { list } = await authorizeList(input.listId, input.userId, {
    allowArchived: true,
  });

  if (list.status !== "archived") {
    throw conflict("Only archived lists can be restored.");
  }

  await assertArchivedListWithinHistoryDepth({
    workspaceId: list.workspaceId,
    listId: list.id,
  });

  const updated = await prisma.shoppingList.update({
    where: { id: list.id },
    data: { status: "active" },
  });

  const itemCount = await prisma.shoppingItem.count({
    where: {
      listId: updated.id,
      status: { not: "removed" },
    },
  });

  return toShoppingListDto({ ...updated, itemCount });
}
