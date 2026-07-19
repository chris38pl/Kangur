import { authorizeList } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { assertArchivedListWithinHistoryDepth } from "@/features/shopping-list/historyAccess";

import { toShoppingItemDto } from "./toShoppingItemDto";

export async function listShoppingItems(
  listId: string,
  userId: string,
  options?: { allowArchived?: boolean },
) {
  const { list } = await authorizeList(listId, userId, {
    allowArchived: options?.allowArchived === true,
  });

  if (list.status === "archived") {
    await assertArchivedListWithinHistoryDepth({
      workspaceId: list.workspaceId,
      listId: list.id,
    });
  }

  const items = await prisma.shoppingItem.findMany({
    where: {
      listId,
      status: {
        not: "removed",
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return items.map(toShoppingItemDto);
}
