import { authorizeList } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

import { toShoppingItemDto } from "./toShoppingItemDto";

export async function listShoppingItems(listId: string, userId: string) {
  await authorizeList(listId, userId);

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
