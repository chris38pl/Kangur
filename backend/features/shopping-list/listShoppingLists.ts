import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

import { PREVIEW_TAKE, toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

export async function listShoppingLists(
  workspaceId: string,
  userId: string,
): Promise<ShoppingListDTO[]> {
  await authorize(workspaceId, userId);

  const lists = await prisma.shoppingList.findMany({
    where: {
      workspaceId,
      status: "active",
    },
    include: {
      _count: {
        select: {
          items: {
            where: { status: { not: "removed" } },
          },
        },
      },
      // Slim DTO: only preview rows — do not ship every product name to Home.
      items: {
        where: { status: { not: "removed" } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: PREVIEW_TAKE,
        select: { name: true, category: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return lists.map((list) =>
    toShoppingListDto({
      ...list,
      itemCount: list._count.items,
      itemNames: list.items.map((item) => item.name),
      previewItems: list.items.map((item) => ({
        name: item.name,
        category: item.category,
      })),
    }),
  );
}
