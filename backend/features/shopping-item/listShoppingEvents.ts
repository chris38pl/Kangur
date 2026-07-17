import { authorizeList } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

import { toShoppingEventDto } from "./toShoppingItemDto";

const PAGE_SIZE = 50;

export async function listShoppingEvents(input: {
  listId: string;
  userId: string;
  after?: string | null;
}) {
  await authorizeList(input.listId, input.userId);

  const events = await prisma.shoppingEvent.findMany({
    where: {
      listId: input.listId,
      ...(input.after ? { id: { gt: input.after } } : {}),
    },
    orderBy: { id: "asc" },
    take: PAGE_SIZE + 1,
  });

  const page = events.slice(0, PAGE_SIZE);
  const nextCursor = events.length > PAGE_SIZE ? events[PAGE_SIZE]?.id ?? null : null;

  return {
    events: page.map(toShoppingEventDto),
    nextCursor,
  };
}
