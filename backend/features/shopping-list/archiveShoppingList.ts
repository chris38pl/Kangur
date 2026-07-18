import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";
import { displayNameFromEmail } from "@/lib/displayName";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";

export async function archiveShoppingList(
  listId: string,
  userId: string,
  options?: { notifyMembers?: boolean },
): Promise<void> {
  const { list } = await authorizeList(listId, userId);

  await prisma.shoppingList.update({
    where: { id: list.id },
    data: { status: "archived" },
  });

  if (!options?.notifyMembers) return;

  const actor = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  ensureNotificationHandlersRegistered();
  await domainEventBus.publish({
    type: "ShoppingListDeleted",
    workspaceId: list.workspaceId,
    listId: list.id,
    listName: list.name,
    listEmoji: list.emoji,
    actorUserId: userId,
    actorDisplayName: displayNameFromEmail(actor.email),
  });
}
