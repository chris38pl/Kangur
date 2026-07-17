import { Prisma } from "@prisma/client";
import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";

import { authorizeList } from "@/lib/authorize";
import { conflict, validationError } from "@/lib/auth/errors";
import { appendShoppingEvent } from "@/lib/events/appendShoppingEvent";
import { prisma } from "@/lib/prisma";

import { normalizeShoppingItemName } from "./normalizeName";
import { toShoppingItemDto } from "./toShoppingItemDto";

export async function createShoppingItem(input: {
  listId: string;
  userId: string;
  clientId?: string;
  name: string;
  amount?: string;
  note?: string;
  category: (typeof SHOPPING_CATEGORIES)[number];
}) {
  const { list } = await authorizeList(input.listId, input.userId);
  const name = normalizeShoppingItemName(input.name);

  if (name.length < 1 || name.length > 120) {
    throw validationError("Name must be between 1 and 120 characters.");
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      const last = await tx.shoppingItem.findFirst({
        where: { listId: list.id },
        orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
        select: { sortOrder: true },
      });

      const created = await tx.shoppingItem.create({
        data: {
          listId: list.id,
          clientId: input.clientId,
          name,
          normalizedName: name.toLowerCase(),
          amount: input.amount?.trim() || null,
          note: input.note?.trim() || null,
          category: input.category,
          status: "pending",
          sortOrder: (last?.sortOrder ?? -1) + 1,
          addedByUserId: input.userId,
          updatedByUserId: input.userId,
        },
      });

      await appendShoppingEvent(tx, {
        listId: list.id,
        actorUserId: input.userId,
        type: "item_created",
        payload: {
          itemId: created.id,
          clientId: created.clientId,
          category: created.category,
          status: created.status,
        },
      });

      return created;
    });

    return toShoppingItemDto(item);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("Item clientId already exists.");
    }
    throw error;
  }
}
