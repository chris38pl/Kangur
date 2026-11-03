import type { Prisma } from "@prisma/client";

import { authorize } from "@/lib/authorize";
import { withReservedAiCredits } from "@/lib/aiCredits";
import {
  forbidden,
  historyAlreadyOnList,
  notFound,
  validationError,
} from "@/lib/auth/errors";
import { isHistorySuggestionsEnabled } from "@/lib/featureGates";
import {
  HISTORY_PROPOSAL_TYPE,
  HISTORY_PROPOSAL_VERSION,
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";

import {
  historyMergeReviewed,
  historyMergeStarted,
} from "./historyMergeAnalytics";
import { SuggestFromHistoryProposalSchema } from "./schemas";
import type { SuggestFromHistoryItem } from "./schemas";
import { selectHistorySourceLists } from "./selectHistorySourceLists";
import { mergeHistoryLists } from "../shopping-list/mergeHistoryLists";
import { applyCategoryCorrectionsToSuggestItems } from "./applyCategoryCorrections";
import { applyCatalogMatchToSuggestItems } from "./applyCatalogMatch";
import { excludeItemsAlreadyOnList } from "./excludeItemsAlreadyOnList";
import { resolveWorkspaceOutputLanguage } from "./outputLanguage";

type BuiltHistoryProposal = {
  lists: { id: string }[];
  items: SuggestFromHistoryItem[];
  shoppingContext: { title: string; theme: string };
  durationMs: number;
};

/**
 * Create-from-history: deterministic merge of recent lists (no LLM).
 * Still meters 1 AI credit when a proposal is stored (same as other suggest actions).
 * Optional listId appends onto that list and skips products already on it,
 * without reserving a credit when nothing new remains.
 * HTTP path remains /ai/suggest-from-history for API compatibility.
 */
export async function suggestFromHistory(input: {
  workspaceId: string;
  userId: string;
  listId?: string;
}) {
  const { workspace } = await authorize(input.workspaceId, input.userId);

  if (!isHistorySuggestionsEnabled(workspace)) {
    throw forbidden("History suggestions are disabled.");
  }

  if (input.listId) {
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: input.listId,
        workspaceId: input.workspaceId,
        status: "active",
      },
      select: { id: true },
    });
    if (!list) {
      throw notFound("List not found.");
    }

    const built = await buildHistoryProposal({
      workspaceId: input.workspaceId,
      userId: input.userId,
      excludeListId: input.listId,
    });
    const existing = await prisma.shoppingItem.findMany({
      where: { listId: input.listId, status: { not: "removed" } },
      select: { name: true },
    });
    const items = excludeItemsAlreadyOnList(
      built.items,
      existing.map((item) => item.name),
    );
    if (items.length === 0) {
      throw historyAlreadyOnList();
    }

    return withReservedAiCredits(input.workspaceId, "history", async () => {
      historyMergeStarted(input.workspaceId);
      return persistHistoryProposal(
        input,
        { ...built, items },
        input.listId ?? null,
      );
    });
  }

  return withReservedAiCredits(input.workspaceId, "history", async () => {
    historyMergeStarted(input.workspaceId);
    const built = await buildHistoryProposal({
      workspaceId: input.workspaceId,
      userId: input.userId,
    });
    return persistHistoryProposal(input, built, null);
  });
}

async function buildHistoryProposal(input: {
  workspaceId: string;
  userId: string;
  excludeListId?: string;
}): Promise<BuiltHistoryProposal> {
  const lists = await selectHistorySourceLists(input.workspaceId, {
    excludeListId: input.excludeListId,
  });

  if (lists.length === 0) {
    throw notFound("No shopping lists with products to suggest from.");
  }

  const startedAt = Date.now();
  const outputLanguage = await resolveWorkspaceOutputLanguage(
    input.workspaceId,
    input.userId,
  );
  const merged = mergeHistoryLists(lists, outputLanguage);
  const catalogMatched = applyCatalogMatchToSuggestItems(
    merged.items,
    outputLanguage,
  );
  const correctedItems = applyCategoryCorrectionsToSuggestItems(catalogMatched);

  if (correctedItems.length === 0) {
    throw validationError("No usable products found in history.");
  }

  return {
    lists,
    items: correctedItems,
    shoppingContext: merged.shoppingContext,
    durationMs: Date.now() - startedAt,
  };
}

async function persistHistoryProposal(
  input: { workspaceId: string; userId: string },
  built: BuiltHistoryProposal,
  listId: string | null,
) {
  const proposal = SuggestFromHistoryProposalSchema.parse({
    shoppingContext: built.shoppingContext,
    items: built.items,
  });

  const run = await prisma.aiProposalRun.create({
    data: {
      workspaceId: input.workspaceId,
      listId,
      userId: input.userId,
      source: "history",
      proposalType: HISTORY_PROPOSAL_TYPE,
      proposalVersion: HISTORY_PROPOSAL_VERSION,
      provider: "local",
      model: "history-merge-v1",
      status: "proposed",
      durationMs: built.durationMs,
      rawResponse: {
        kind: "history-merge",
        sourceListIds: built.lists.map((list) => list.id),
        ...(listId ? { targetListId: listId } : {}),
      } as Prisma.InputJsonValue,
      proposal: proposal as unknown as Prisma.InputJsonValue,
    },
  });

  historyMergeReviewed({
    workspaceId: input.workspaceId,
    runId: run.id,
  });

  return {
    runId: run.id,
    model: "history-merge-v1",
    provider: "local",
    proposalType: HISTORY_PROPOSAL_TYPE,
    proposalVersion: HISTORY_PROPOSAL_VERSION,
    durationMs: built.durationMs,
    sourceListsCount: built.lists.length,
    proposal,
  };
}
