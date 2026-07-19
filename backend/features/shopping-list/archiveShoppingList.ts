import { prisma } from "@/lib/prisma";
import { authorizeList } from "@/lib/authorize";
import { displayNameFromEmail } from "@/lib/displayName";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";

export type SoftRemoveOutcome = "archived" | "deleted";

/**
 * Soft-remove a list from Home.
 * - `archived` — finished shopping → appears in History (Repeat).
 * - `deleted` — user "Delete list" → hidden from Home and History.
 */
export async function archiveShoppingList(
  listId: string,
  userId: string,
  options?: { notifyMembers?: boolean; outcome?: SoftRemoveOutcome },
): Promise<void> {
  const outcome = options?.outcome ?? "deleted";
  // User delete from History needs access to archived lists.
  const { list } = await authorizeList(listId, userId, {
    allowArchived: outcome === "deleted",
  });

  await prisma.shoppingList.update({
    where: { id: list.id },
    data: { status: outcome },
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
