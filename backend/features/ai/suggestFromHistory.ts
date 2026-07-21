import type { Prisma } from "@prisma/client";

import { assertCanIngest } from "@/lib/aiCredits";
import { authorize } from "@/lib/authorize";
import { forbidden, notFound, validationError } from "@/lib/auth/errors";
import { isHistorySuggestionsEnabled } from "@/lib/featureGates";
import {
  HISTORY_PROPOSAL_TYPE,
  HISTORY_PROPOSAL_VERSION,
} from "@/lib/openai";
import { assertPremiumWorkspace } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

import { buildSuggestFromHistory } from "./buildSuggestFromHistory";
import { enrichSuggestFromHistory } from "./enrichSuggestFromHistory";
import {
  historyAiGenerateReviewed,
  historyAiGenerateStarted,
} from "./historyAiAnalytics";
import { resolveWorkspaceOutputLanguage } from "./outputLanguage";
import { SuggestFromHistoryProposalSchema } from "./schemas";
import { selectHistorySourceLists } from "./selectHistorySourceLists";

export async function suggestFromHistory(input: {
  workspaceId: string;
  userId: string;
}) {
  const { workspace } = await authorize(input.workspaceId, input.userId);

  if (!isHistorySuggestionsEnabled(workspace)) {
    throw forbidden("History suggestions are disabled.");
  }

  await assertPremiumWorkspace(input.workspaceId);
  await assertCanIngest(input.workspaceId, "history");

  historyAiGenerateStarted(input.workspaceId);

  const lists = await selectHistorySourceLists(input.workspaceId);

  if (lists.length === 0) {
    throw notFound("No shopping lists with products to suggest from.");
  }

  const startedAt = Date.now();
  const outputLanguage = await resolveWorkspaceOutputLanguage(
    input.workspaceId,
  );

  const generated = await buildSuggestFromHistory({
    lists,
    outputLanguage,
  });

  const enriched = enrichSuggestFromHistory({
    proposal: generated.proposal,
    lists,
  });

  if (enriched.items.length === 0) {
    throw validationError("AI produced no usable suggestions from history.");
  }

  const proposal = SuggestFromHistoryProposalSchema.parse(enriched);
  const durationMs = Date.now() - startedAt;

  const run = await prisma.aiProposalRun.create({
    data: {
      workspaceId: input.workspaceId,
      listId: null,
      userId: input.userId,
      source: "history",
      proposalType: HISTORY_PROPOSAL_TYPE,
      proposalVersion: HISTORY_PROPOSAL_VERSION,
      provider: generated.provider,
      model: generated.model,
      status: "proposed",
      durationMs,
      rawResponse: generated.rawResponse as Prisma.InputJsonValue,
      proposal: proposal as unknown as Prisma.InputJsonValue,
    },
  });

  historyAiGenerateReviewed({
    workspaceId: input.workspaceId,
    runId: run.id,
  });

  return {
    runId: run.id,
    model: generated.model,
    provider: generated.provider,
    proposalType: HISTORY_PROPOSAL_TYPE,
    proposalVersion: HISTORY_PROPOSAL_VERSION,
    durationMs,
    sourceListsCount: lists.length,
    proposal,
  };
}
