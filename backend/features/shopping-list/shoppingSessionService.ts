import { archiveShoppingList } from "@/features/shopping-list/archiveShoppingList";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import { notFound, validationError } from "@/lib/auth/errors";
import { authorizeList } from "@/lib/authorize";
import { displayNameFromEmail } from "@/lib/displayName";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { getMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { MetricNames } from "@shared/metrics/names";

export type StartSessionInput = {
  listId: string;
  actorUserId: string;
  clientInstanceId?: string | null;
  clientPlatform?: string | null;
};

export type FinishSessionInput = {
  listId: string;
  sessionId: string;
  actorUserId: string;
  unavailableCount: number;
};

export type FinishListInput = {
  listId: string;
  actorUserId: string;
  unavailableCount: number;
};

/**
 * ShoppingSessionService - domain lifecycle.
 * Start: publish ShoppingStarted only for the first active session on the list
 * (joining an in-progress trip does not notify again).
 * Notify finished: publish ShoppingFinished only (from actor "Finish shopping" CTA).
 * Finish: publish (deduped) → archive → close session.
 */
export async function startShoppingSession(input: StartSessionInput) {
  ensureNotificationHandlersRegistered();
  const { list, workspace } = await authorizeList(
    input.listId,
    input.actorUserId,
  );

  const open = await prisma.shoppingSession.findFirst({
    where: {
      listId: list.id,
      actorUserId: input.actorUserId,
      finishedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });

  if (open) {
    return {
      id: open.id,
      listId: open.listId,
      workspaceId: open.workspaceId,
      startedAt: open.startedAt.toISOString(),
      resumed: true,
    };
  }

  const peerActive = await prisma.shoppingSession.findFirst({
    where: {
      listId: list.id,
      finishedAt: null,
      actorUserId: { not: input.actorUserId },
    },
    select: { id: true },
  });

  const actor = await prisma.user.findUniqueOrThrow({
    where: { id: input.actorUserId },
  });

  const session = await prisma.shoppingSession.create({
    data: {
      listId: list.id,
      workspaceId: list.workspaceId,
      actorUserId: input.actorUserId,
      clientInstanceId: input.clientInstanceId ?? null,
      clientPlatform: input.clientPlatform ?? null,
    },
  });

  const metrics = getMetrics();
  metrics.increment(MetricNames.shoppingSessionsStarted);
  metrics.increment(MetricNames.sessionStart);
  const activeCount = await prisma.shoppingSession.count({
    where: { finishedAt: null },
  });
  metrics.gauge(MetricNames.shoppingSessionsActive, activeCount);

  // First shopper on this list notifies; joiners do not.
  if (!peerActive) {
    await domainEventBus.publish({
      type: "ShoppingStarted",
      workspaceId: list.workspaceId,
      workspaceName: workspace.name,
      workspaceIcon: workspace.icon,
      listId: list.id,
      listName: list.name,
      listEmoji: list.emoji,
      sessionId: session.id,
      actorUserId: input.actorUserId,
      actorDisplayName: displayNameFromEmail(actor.email),
    });
  }

  return {
    id: session.id,
    listId: session.listId,
    workspaceId: session.workspaceId,
    startedAt: session.startedAt.toISOString(),
    resumed: false,
  };
}

export async function notifyShoppingFinished(input: FinishSessionInput) {
  ensureNotificationHandlersRegistered();
  const { list, workspace } = await authorizeList(
    input.listId,
    input.actorUserId,
  );

  if (
    !Number.isFinite(input.unavailableCount) ||
    input.unavailableCount < 0
  ) {
    throw validationError("unavailableCount must be a non-negative number.");
  }

  const session = await prisma.shoppingSession.findFirst({
    where: {
      id: input.sessionId,
      listId: list.id,
      actorUserId: input.actorUserId,
    },
  });

  if (!session) {
    throw notFound("Shopping session not found.");
  }

  await publishShoppingFinished({
    list,
    workspace,
    sessionId: session.id,
    actorUserId: input.actorUserId,
    unavailableCount: Math.floor(input.unavailableCount),
  });

  return {
    id: session.id,
    listId: session.listId,
    notified: true,
  };
}

export async function finishShoppingSession(input: FinishSessionInput) {
  ensureNotificationHandlersRegistered();
  const { list, workspace } = await authorizeList(input.listId, input.actorUserId);

  if (
    !Number.isFinite(input.unavailableCount) ||
    input.unavailableCount < 0
  ) {
    throw validationError("unavailableCount must be a non-negative number.");
  }

  const session = await prisma.shoppingSession.findFirst({
    where: {
      id: input.sessionId,
      listId: list.id,
      actorUserId: input.actorUserId,
    },
  });

  if (!session) {
    throw notFound("Shopping session not found.");
  }

  if (session.finishedAt) {
    return {
      id: session.id,
      listId: session.listId,
      finishedAt: session.finishedAt.toISOString(),
      alreadyFinished: true,
    };
  }

  // Publish again is safe - notification handler dedups by sessionId.
  await publishShoppingFinished({
    list,
    workspace,
    sessionId: session.id,
    actorUserId: input.actorUserId,
    unavailableCount: Math.floor(input.unavailableCount),
  });

  await archiveShoppingList(list.id, input.actorUserId, {
    outcome: "archived",
  });

  const closed = await prisma.shoppingSession.update({
    where: { id: session.id },
    data: { finishedAt: new Date() },
  });

  const metrics = getMetrics();
  metrics.increment(MetricNames.shoppingSessionsFinished);
  metrics.increment(MetricNames.sessionFinish);
  const durationMs = closed.finishedAt!.getTime() - session.startedAt.getTime();
  metrics.timing(MetricNames.shoppingSessionDurationMs, durationMs);
  const activeCount = await prisma.shoppingSession.count({
    where: { finishedAt: null },
  });
  metrics.gauge(MetricNames.shoppingSessionsActive, activeCount);

  return {
    id: closed.id,
    listId: closed.listId,
    finishedAt: closed.finishedAt!.toISOString(),
    alreadyFinished: false,
  };
}

/**
 * Finish shopping when the client has no session id: the trip started
 * offline, or the finish was queued by app 1.0.8. Same result as a session
 * finish: the list moves to History (archived), it is never deleted.
 * Closes the actor's open session on the list when there is one.
 * Safe to repeat: an already archived list is a success.
 */
export async function finishShoppingList(input: FinishListInput) {
  if (
    !Number.isFinite(input.unavailableCount) ||
    input.unavailableCount < 0
  ) {
    throw validationError("unavailableCount must be a non-negative number.");
  }

  const { list } = await authorizeList(input.listId, input.actorUserId, {
    allowArchived: true,
  });

  if (list.status === "archived") {
    return { listId: list.id, sessionId: null, alreadyFinished: true };
  }

  const open = await prisma.shoppingSession.findFirst({
    where: {
      listId: list.id,
      actorUserId: input.actorUserId,
      finishedAt: null,
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (open) {
    const finished = await finishShoppingSession({
      listId: list.id,
      sessionId: open.id,
      actorUserId: input.actorUserId,
      unavailableCount: input.unavailableCount,
    });
    return {
      listId: list.id,
      sessionId: finished.id,
      alreadyFinished: finished.alreadyFinished,
    };
  }

  // No session: the household never got "started shopping" for this trip,
  // so no "finished" either. The list still moves to History.
  await archiveShoppingList(list.id, input.actorUserId, {
    outcome: "archived",
  });
  return { listId: list.id, sessionId: null, alreadyFinished: false };
}

async function publishShoppingFinished(input: {
  list: { id: string; workspaceId: string; name: string; emoji: string };
  workspace: { name: string; icon: string };
  sessionId: string;
  actorUserId: string;
  unavailableCount: number;
}) {
  const actor = await prisma.user.findUniqueOrThrow({
    where: { id: input.actorUserId },
  });

  const items = await prisma.shoppingItem.findMany({
    where: {
      listId: input.list.id,
      status: { not: "removed" },
    },
    select: { status: true },
  });
  const itemCount = items.length;
  const boughtCount = items.filter((i) => i.status === "bought").length;

  await domainEventBus.publish({
    type: "ShoppingFinished",
    workspaceId: input.list.workspaceId,
    workspaceName: input.workspace.name,
    workspaceIcon: input.workspace.icon,
    listId: input.list.id,
    listName: input.list.name,
    listEmoji: input.list.emoji,
    sessionId: input.sessionId,
    actorUserId: input.actorUserId,
    actorDisplayName: displayNameFromEmail(actor.email),
    unavailableCount: input.unavailableCount,
    boughtCount,
    itemCount,
  });
}
