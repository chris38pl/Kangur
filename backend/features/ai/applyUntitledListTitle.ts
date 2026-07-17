import { prisma } from "@/lib/prisma";

import { normalizeShoppingListName } from "../shopping-list/normalizeName";
import { ShoppingContextSchema } from "./schemas";

/** Rename untitled list from AI shoppingContext.title. Returns applied title or null. */
export async function applyUntitledListTitleFromProposal(input: {
  listId: string;
  proposal: unknown;
}): Promise<string | null> {
  const list = await prisma.shoppingList.findUnique({
    where: { id: input.listId },
    select: { id: true, isUntitled: true },
  });
  if (!list?.isUntitled) return null;

  const parsed = ShoppingContextSchema.safeParse(
    (input.proposal as { shoppingContext?: unknown } | null)?.shoppingContext,
  );
  if (!parsed.success) return null;

  const title = normalizeShoppingListName(parsed.data.title).slice(0, 32);
  if (!title) return null;

  await prisma.shoppingList.update({
    where: { id: list.id },
    data: { name: title, isUntitled: false },
  });

  return title;
}
