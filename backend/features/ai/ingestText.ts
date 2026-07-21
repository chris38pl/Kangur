import type { Prisma } from "@prisma/client";

import {
  AI_PROVIDER,
  IMPORT_PROPOSAL_TYPE,
  IMPORT_PROPOSAL_VERSION,
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";

import { applyUntitledListTitleFromProposal } from "./applyUntitledListTitle";
import { buildProposalFromText } from "./buildProposal";
import { resolveListOutputLanguage } from "./outputLanguage";

export async function ingestText(input: {
  listId: string;
  userId: string;
  source: "text" | "clipboard";
  text: string;
}) {
  const startedAt = Date.now();

  const list = await prisma.shoppingList.findUniqueOrThrow({
    where: { id: input.listId },
    select: { workspaceId: true },
  });

  const existingItems = await prisma.shoppingItem.findMany({
    where: {
      listId: input.listId,
      status: { not: "removed" },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      amount: true,
      note: true,
      category: true,
      status: true,
    },
  });

  const outputLanguage = await resolveListOutputLanguage(
    input.listId,
    input.text,
  );

  const proposalResult = await buildProposalFromText({
    sourceLabel: input.source,
    rawInput: input.text,
    existingItems,
    outputLanguage,
  });

  const durationMs = Date.now() - startedAt;
  const run = await prisma.aiProposalRun.create({
    data: {
      workspaceId: list.workspaceId,
      listId: input.listId,
      userId: input.userId,
      source: input.source,
      proposalType: IMPORT_PROPOSAL_TYPE,
      proposalVersion: IMPORT_PROPOSAL_VERSION,
      provider: AI_PROVIDER,
      status: "proposed",
      model: proposalResult.model,
      durationMs,
      rawResponse: proposalResult.rawResponse as Prisma.InputJsonValue,
      proposal: proposalResult.proposal as Prisma.InputJsonValue,
    },
  });

  await applyUntitledListTitleFromProposal({
    listId: input.listId,
    proposal: proposalResult.proposal,
  });

  return {
    runId: run.id,
    model: proposalResult.model,
    provider: AI_PROVIDER,
    proposalType: IMPORT_PROPOSAL_TYPE,
    proposalVersion: IMPORT_PROPOSAL_VERSION,
    durationMs,
    proposal: proposalResult.proposal,
    fastPath: proposalResult.proposal.operations.every(
      (operation) => operation.op === "merge" && operation.confidence >= 0.85,
    ),
  };
}
