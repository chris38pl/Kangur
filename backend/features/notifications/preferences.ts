import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getOrCreateNotificationPreferences(userId: string) {
  return prisma.userNotificationPreferences.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export function prefAllowsType(
  prefs: {
    silentMode: boolean;
    workspaceInvitations: boolean;
    shoppingStarted: boolean;
    shoppingFinished: boolean;
    shoppingListCreated: boolean;
    shoppingListDeleted: boolean;
  },
  type: NotificationType,
): boolean {
  if (prefs.silentMode) return false;

  switch (type) {
    case "WORKSPACE_INVITATION":
      return prefs.workspaceInvitations;
    case "SHOPPING_STARTED":
      return prefs.shoppingStarted;
    case "SHOPPING_FINISHED":
      return prefs.shoppingFinished;
    case "SHOPPING_LIST_CREATED":
      return prefs.shoppingListCreated;
    case "SHOPPING_LIST_DELETED":
      return prefs.shoppingListDeleted;
    default:
      return false;
  }
}
