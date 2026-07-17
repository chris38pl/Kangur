import type { Prisma } from "@prisma/client";

import { PROMPT_VERSION } from "@/lib/openai";
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
  const run = await prisma.aiIngestRun.create({
    data: {
      listId: input.listId,
      userId: input.userId,
      source: input.source,
      status: "proposed",
      model: proposalResult.model,
      promptVersion: PROMPT_VERSION,
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
    promptVersion: PROMPT_VERSION,
    durationMs,
    proposal: proposalResult.proposal,
    fastPath: proposalResult.proposal.operations.every(
      (operation) => operation.op === "merge" && operation.confidence >= 0.85,
    ),
  };
}
