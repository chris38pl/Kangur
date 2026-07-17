import { Prisma } from "@prisma/client";
import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";

import { authorizeList } from "@/lib/authorize";
import { conflict, notFound, validationError } from "@/lib/auth/errors";
import { appendShoppingEvent } from "@/lib/events/appendShoppingEvent";
import { prisma } from "@/lib/prisma";

import { normalizeShoppingItemName } from "./normalizeName";
import { toShoppingItemDto } from "./toShoppingItemDto";

export async function updateShoppingItem(input: {
  itemId: string;
  userId: string;
  name?: string;
  amount?: string | null;
  note?: string | null;
  category?: (typeof SHOPPING_CATEGORIES)[number];
  status?: "pending" | "bought" | "unavailable" | "removed";
}) {
  const item = await prisma.shoppingItem.findUnique({
    where: { id: input.itemId },
  });

  if (!item) {
    throw notFound("Item not found.");
  }

  const { list } = await authorizeList(item.listId, input.userId);

  const normalizedName =
    input.name === undefined ? undefined : normalizeShoppingItemName(input.name);

  if (
    normalizedName !== undefined &&
    (normalizedName.length < 1 || normalizedName.length > 120)
  ) {
    throw validationError("Name must be between 1 and 120 characters.");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.shoppingItem.update({
        where: { id: item.id },
        data: {
          ...(normalizedName !== undefined
            ? {
                name: normalizedName,
                normalizedName: normalizedName.toLowerCase(),
              }
            : {}),
          ...(input.amount !== undefined
            ? { amount: input.amount?.trim() || null }
            : {}),
          ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedByUserId: input.userId,
        },
      });

      const eventType =
        input.status !== undefined && input.status !== item.status
          ? "item_status_changed"
          : "item_updated";

      await appendShoppingEvent(tx, {
        listId: list.id,
        actorUserId: input.userId,
        type: eventType,
        payload: {
          itemId: next.id,
          clientId: next.clientId,
          category: next.category,
          status: next.status,
        },
      });

      return next;
    });

    return toShoppingItemDto(updated);
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
