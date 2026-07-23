import type { Prisma } from "@prisma/client";

import {
  AI_PROVIDER,
  IMPORT_PROPOSAL_TYPE,
  IMPORT_PROPOSAL_VERSION,
} from "@/lib/openai";
import { Analytics } from "@/lib/analytics";
import {
  estimateOpenAiCostUsd,
  usageFromCompletion,
} from "@/lib/analytics/aiCost";
import { withReservedAiCredits } from "@/lib/aiCredits";
import { prisma } from "@/lib/prisma";

import { applyUntitledListTitleFromProposal } from "./applyUntitledListTitle";
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

  const outputLanguage = await resolveListOutputLanguage(input.listId);

  return withReservedAiCredits(list.workspaceId, "screenshot", async () => {
    let proposalResult: Awaited<ReturnType<typeof buildProposalFromScreenshot>>;
    try {
      proposalResult = await buildProposalFromScreenshot({
        rawHint: input.fileName ?? "shopping-list-screenshot",
        mimeType: input.mimeType,
        base64: input.fileBuffer.toString("base64"),
        existingItems,
        outputLanguage,
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      Analytics.track(
        "ai_model_completed",
        {
          workspace_id: list.workspaceId,
          provider: AI_PROVIDER,
          model: "unknown",
          latency_ms: durationMs,
          ok: false,
        },
        input.userId,
      );
      Analytics.track(
        "ai_import_failed",
        {
          workspace_id: list.workspaceId,
          list_id: input.listId,
          source: "screenshot",
          code: "model_error",
        },
        input.userId,
      );
      throw error;
    }

    const durationMs = Date.now() - startedAt;
    const usage = usageFromCompletion(
      proposalResult.rawResponse as {
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      },
    );
    Analytics.track(
      "ai_model_completed",
      {
        workspace_id: list.workspaceId,
        provider: AI_PROVIDER,
        model: proposalResult.model,
        latency_ms: durationMs,
        tokens: usage.tokens,
        estimated_cost_usd: estimateOpenAiCostUsd({
          model: proposalResult.model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        }),
        ok: true,
      },
      input.userId,
    );

    const run = await prisma.aiProposalRun.create({
      data: {
        workspaceId: list.workspaceId,
        listId: input.listId,
        userId: input.userId,
        source: "screenshot",
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
  });
}
