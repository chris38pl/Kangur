import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import { displayNameFromEmail } from "@/lib/displayName";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { prisma } from "@/lib/prisma";

/** Publish ShoppingListCreated once the list has a real title and at least one item. */
export async function maybePublishShoppingListCreated(input: {
  listId: string;
  actorUserId: string;
}): Promise<void> {
  const list = await prisma.shoppingList.findUnique({
    where: { id: input.listId },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      emoji: true,
      isUntitled: true,
    },
  });
  if (!list || list.isUntitled) return;

  const itemCount = await prisma.shoppingItem.count({
    where: {
      listId: list.id,
      status: { not: "removed" },
    },
  });
  if (itemCount === 0) return;

  const actor = await prisma.user.findUniqueOrThrow({
    where: { id: input.actorUserId },
  });

  ensureNotificationHandlersRegistered();
  await domainEventBus.publish({
    type: "ShoppingListCreated",
    workspaceId: list.workspaceId,
    listId: list.id,
    listName: list.name,
    listEmoji: list.emoji,
    itemCount,
    actorUserId: input.actorUserId,
    actorDisplayName: displayNameFromEmail(actor.email),
  });
}
