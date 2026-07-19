import { prisma } from "@/lib/prisma";
import { historyLimitExceeded } from "@/lib/auth/errors";

/** Free plan: only the N most recently updated archived lists are accessible. */
export const FREE_HISTORY_LIMIT = 20;

/** Safety cap for Premium history listing (not a product limit). */
export const PREMIUM_HISTORY_CAP = 200;

export async function isPremiumWorkspace(workspaceId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { id: true },
  });
  return Boolean(sub);
}

/**
 * Free workspaces may only restore/repeat archived lists within the top-N
 * by updatedAt. Throws HISTORY_LIMIT_EXCEEDED (403) — not 404 — when over limit.
 * Does not include totalArchived counts (paywall details later).
 */
export async function assertArchivedListWithinHistoryDepth(input: {
  workspaceId: string;
  listId: string;
}): Promise<void> {
  if (await isPremiumWorkspace(input.workspaceId)) {
    return;
  }

  const recent = await prisma.shoppingList.findMany({
    where: {
      workspaceId: input.workspaceId,
      status: "archived",
      items: {
        some: {
          status: { not: "removed" },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: FREE_HISTORY_LIMIT,
    select: { id: true },
  });

  if (!recent.some((row) => row.id === input.listId)) {
    throw historyLimitExceeded();
  }
}
