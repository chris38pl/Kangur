import type { Prisma } from "@prisma/client";

import { PROMPT_VERSION } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

import { buildProposalFromScreenshot } from "./buildProposal";
import { resolveListOutputLanguage } from "./outputLanguage";

export async function ingestScreenshot(input: {
  listId: string;
  userId: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName?: string | null;
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

  const outputLanguage = await resolveListOutputLanguage(input.listId);

  const proposalResult = await buildProposalFromScreenshot({
    rawHint: input.fileName ?? "shopping-list-screenshot",
    mimeType: input.mimeType,
    base64: input.fileBuffer.toString("base64"),
    existingItems,
    outputLanguage,
  });

  const durationMs = Date.now() - startedAt;
  const run = await prisma.aiIngestRun.create({
    data: {
      listId: input.listId,
      userId: input.userId,
      source: "screenshot",
      status: "proposed",
      model: proposalResult.model,
      promptVersion: PROMPT_VERSION,
      durationMs,
      rawResponse: proposalResult.rawResponse as Prisma.InputJsonValue,
      proposal: proposalResult.proposal as Prisma.InputJsonValue,
    },
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
