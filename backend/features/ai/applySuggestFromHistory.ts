import { Prisma } from "@prisma/client";

import { authorize } from "@/lib/authorize";
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/lib/auth/errors";
import { appendShoppingEvent } from "@/lib/events/appendShoppingEvent";
import { isHistorySuggestionsEnabled } from "@/lib/featureGates";
import { HISTORY_PROPOSAL_TYPE } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

import { maybePublishShoppingListCreated } from "../shopping-list/maybePublishShoppingListCreated";
import { PREVIEW_TAKE, toShoppingListDto } from "../shopping-list/toShoppingListDto";
import {
  historyAiGenerateApplied,
  historyAiGenerateCancelled,
} from "./historyAiAnalytics";
import { SuggestFromHistoryProposalSchema } from "./schemas";

const DEFAULT_EMOJI = "🛒";

export async function applySuggestFromHistory(input: {
  workspaceId: string;
  userId: string;
  runId: string;
  acceptedProposalRowIds: string[];
}) {
  const { workspace } = await authorize(input.workspaceId, input.userId);

  if (!isHistorySuggestionsEnabled(workspace)) {
    throw forbidden("History suggestions are disabled.");
  }

  if (input.acceptedProposalRowIds.length === 0) {
    throw validationError("At least one accepted item is required.");
  }

  const run = await prisma.aiProposalRun.findUnique({
    where: { id: input.runId },
  });

  if (
    !run ||
    run.workspaceId !== input.workspaceId ||
    run.proposalType !== HISTORY_PROPOSAL_TYPE ||
    run.source !== "history"
  ) {
    throw notFound("AI run not found.");
  }

  if (run.status !== "proposed") {
    throw conflict("AI run is no longer proposed.");
  }

  const proposal = SuggestFromHistoryProposalSchema.parse(run.proposal);
  const byRowId = new Map(
    proposal.items.map((item) => [item.proposalRowId, item]),
  );

  const accepted = [];
  for (const rowId of input.acceptedProposalRowIds) {
    const item = byRowId.get(rowId);
    if (!item) {
      throw validationError("Invalid proposalRowId.", {
        proposalRowId: rowId,
      });
    }
    accepted.push(item);
  }

  // De-dupe client-sent ids while preserving order.
  const seen = new Set<string>();
  const uniqueAccepted = accepted.filter((item) => {
    if (seen.has(item.proposalRowId)) return false;
    seen.add(item.proposalRowId);
    return true;
  });

  if (uniqueAccepted.length === 0) {
    throw validationError("At least one accepted item is required.");
  }

  const title = proposal.shoppingContext.title.trim().slice(0, 64) || "Zakupy";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.aiProposalRun.updateMany({
        where: { id: run.id, status: "proposed" },
        data: {
          status: "applied",
          appliedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw conflict("AI run is no longer proposed.");
      }

      const list = await tx.shoppingList.create({
        data: {
          workspaceId: input.workspaceId,
          name: title,
          emoji: DEFAULT_EMOJI,
          isUntitled: false,
          status: "active",
          createdByUserId: input.userId,
        },
      });

      await tx.shoppingItem.createMany({
        data: uniqueAccepted.map((item, index) => ({
          listId: list.id,
          name: item.name,
          normalizedName: item.name.trim().toLowerCase(),
          amount: item.amount,
          note: item.note,
          category: item.category,
          status: "pending" as const,
          sortOrder: index,
          addedByUserId: input.userId,
          updatedByUserId: input.userId,
        })),
      });

      await tx.aiProposalRun.update({
        where: { id: run.id },
        data: { listId: list.id },
      });

      await appendShoppingEvent(tx, {
        listId: list.id,
        actorUserId: input.userId,
        type: "list_created",
      });

      await appendShoppingEvent(tx, {
        listId: list.id,
        actorUserId: input.userId,
        type: "ai_applied",
        payload: {
          runId: run.id,
          appliedOperations: uniqueAccepted.length,
          proposalType: HISTORY_PROPOSAL_TYPE,
        },
      });

      const items = await tx.shoppingItem.findMany({
        where: { listId: list.id, status: { not: "removed" } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { name: true, category: true },
      });

      return {
        list: toShoppingListDto({
          ...list,
          itemCount: items.length,
          itemNames: items.map((item) => item.name),
          previewItems: items.slice(0, PREVIEW_TAKE).map((item) => ({
            name: item.name,
            category: item.category,
          })),
        }),
        applied: uniqueAccepted.length,
      };
    });

    // Side-effect notifications after COMMIT
    await maybePublishShoppingListCreated({
      listId: result.list.id,
      actorUserId: input.userId,
    });

    historyAiGenerateApplied({
      workspaceId: input.workspaceId,
      runId: input.runId,
      listId: result.list.id,
    });

    return result;
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

export async function abandonSuggestFromHistory(input: {
  workspaceId: string;
  userId: string;
  runId: string;
}) {
  await authorize(input.workspaceId, input.userId);

  const run = await prisma.aiProposalRun.findUnique({
    where: { id: input.runId },
  });

  if (
    !run ||
    run.workspaceId !== input.workspaceId ||
    run.proposalType !== HISTORY_PROPOSAL_TYPE
  ) {
    throw notFound("AI run not found.");
  }

  if (run.status === "abandoned") {
    return { abandoned: true as const };
  }

  if (run.status !== "proposed") {
    throw conflict("AI run is no longer proposed.");
  }

  const updated = await prisma.aiProposalRun.updateMany({
    where: { id: run.id, status: "proposed" },
    data: { status: "abandoned" },
  });

  if (updated.count !== 1) {
    throw conflict("AI run is no longer proposed.");
  }

  historyAiGenerateCancelled({
    workspaceId: input.workspaceId,
    runId: input.runId,
  });

  return { abandoned: true as const };
}
