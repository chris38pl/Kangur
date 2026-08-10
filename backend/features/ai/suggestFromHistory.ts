import type { Prisma } from "@prisma/client";

import { authorize } from "@/lib/authorize";
import { forbidden, notFound, validationError } from "@/lib/auth/errors";
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
import { selectHistorySourceLists } from "./selectHistorySourceLists";
import { mergeHistoryLists } from "../shopping-list/mergeHistoryLists";
import { applyCategoryCorrectionsToSuggestItems } from "./applyCategoryCorrections";

/**
 * Create-from-history: deterministic merge of recent lists (no LLM, no Premium, no credits).
 * HTTP path remains /ai/suggest-from-history for API compatibility.
 */
export async function suggestFromHistory(input: {
  workspaceId: string;
  userId: string;
}) {
  const { workspace } = await authorize(input.workspaceId, input.userId);

  if (!isHistorySuggestionsEnabled(workspace)) {
    throw forbidden("History suggestions are disabled.");
  }

  historyMergeStarted(input.workspaceId);

  const lists = await selectHistorySourceLists(input.workspaceId);

  if (lists.length === 0) {
    throw notFound("No shopping lists with products to suggest from.");
  }

  const startedAt = Date.now();
  const merged = mergeHistoryLists(lists);
  const correctedItems = applyCategoryCorrectionsToSuggestItems(merged.items);

  if (correctedItems.length === 0) {
    throw validationError("No usable products found in history.");
  }

  const proposal = SuggestFromHistoryProposalSchema.parse({
    shoppingContext: merged.shoppingContext,
    items: correctedItems,
  });
  const durationMs = Date.now() - startedAt;

  const run = await prisma.aiProposalRun.create({
    data: {
      workspaceId: input.workspaceId,
      listId: null,
      userId: input.userId,
      source: "history",
      proposalType: HISTORY_PROPOSAL_TYPE,
      proposalVersion: HISTORY_PROPOSAL_VERSION,
      provider: "local",
      model: "history-merge-v1",
      status: "proposed",
      durationMs,
      rawResponse: {
        kind: "history-merge",
        sourceListIds: lists.map((l) => l.id),
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
    durationMs,
    sourceListsCount: lists.length,
    proposal,
  };
}
