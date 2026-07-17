import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authorize";
import { validationError } from "@/lib/auth/errors";

import { normalizeShoppingListName } from "./normalizeName";
import { toShoppingListDto } from "./toShoppingListDto";
import type { ShoppingListDTO } from "./schemas";

const DEFAULT_EMOJI = "🛒";

export async function createShoppingList(input: {
  workspaceId: string;
  userId: string;
  name: string;
  emoji?: string;
}): Promise<ShoppingListDTO> {
  await authorize(input.workspaceId, input.userId);

  const name = normalizeShoppingListName(input.name);
  if (name.length < 1 || name.length > 64) {
    throw validationError("Name must be between 1 and 64 characters.");
  }

  const list = await prisma.$transaction(async (tx) => {
    const created = await tx.shoppingList.create({
      data: {
        workspaceId: input.workspaceId,
        name,
        emoji: input.emoji ?? DEFAULT_EMOJI,
        createdByUserId: input.userId,
      },
    });

    await tx.shoppingEvent.create({
      data: {
        listId: created.id,
        actorUserId: input.userId,
        type: "list_created",
      },
    });

    return created;
  });

  return toShoppingListDto(list);
}
