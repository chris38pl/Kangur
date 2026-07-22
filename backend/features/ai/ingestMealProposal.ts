import type { Prisma } from "@prisma/client";

import {
  AI_PROVIDER,
  MEAL_PROPOSAL_TYPE,
  MEAL_PROPOSAL_VERSION,
} from "@/lib/openai";
import { Analytics } from "@/lib/analytics";
import {
  estimateOpenAiCostUsd,
  usageFromCompletion,
} from "@/lib/analytics/aiCost";
import { conflict, notFound } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";

import { applyUntitledListTitleFromProposal } from "./applyUntitledListTitle";
import { buildMealProposal } from "./buildMealProposal";
import { dedupeMealIngredients } from "./dedupeMealIngredients";
import { resolveListOutputLanguage } from "./outputLanguage";

const inflight = new Map<string, Promise<MealProposalIngestResult>>();

export type MealProposalIngestResult = {
  runId: string;
  model: string;
  provider: string;
  proposalType: string;
  proposalVersion: number;
  durationMs: number;
  proposal: ReturnType<typeof dedupeMealIngredients>;
};

async function ingestMealProposalOnce(input: {
  listId: string;
  userId: string;
  dishes: string[];
}): Promise<MealProposalIngestResult> {
  const startedAt = Date.now();
  const list = await prisma.shoppingList.findUniqueOrThrow({
    where: { id: input.listId },
    select: { workspaceId: true },
  });

  const existingItems = await prisma.shoppingItem.findMany({
    where: { listId: input.listId, status: { not: "removed" } },
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
    input.dishes.join(" "),
  );

  let built: Awaited<ReturnType<typeof buildMealProposal>>;
  try {
    built = await buildMealProposal({
      dishes: input.dishes,
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
      "meal_proposal_failed",
      {
        workspace_id: list.workspaceId,
        list_id: input.listId,
        code: "model_error",
      },
      input.userId,
    );
    throw error;
  }

  const durationMs = Date.now() - startedAt;
  const usage = usageFromCompletion(
    built.rawResponse as {
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
      model: built.model,
      latency_ms: durationMs,
      tokens: usage.tokens,
      estimated_cost_usd: estimateOpenAiCostUsd({
        model: built.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      }),
      ok: true,
    },
    input.userId,
  );

  const proposal = dedupeMealIngredients(built.ai, existingItems);
  const mealCount = (proposal.meals.length === 2 ? 2 : 1) as 1 | 2;

  const run = await prisma.aiProposalRun.create({
    data: {
      workspaceId: list.workspaceId,
      listId: input.listId,
      userId: input.userId,
      source: "meal",
      proposalType: MEAL_PROPOSAL_TYPE,
      proposalVersion: MEAL_PROPOSAL_VERSION,
      provider: AI_PROVIDER,
      status: "proposed",
      model: built.model,
      durationMs,
      rawResponse: built.rawResponse as Prisma.InputJsonValue,
      proposal: proposal as unknown as Prisma.InputJsonValue,
    },
  });

  await applyUntitledListTitleFromProposal({
    listId: input.listId,
    proposal,
  });

  Analytics.track(
    "meal_proposal_generated",
    {
      workspace_id: list.workspaceId,
      list_id: input.listId,
      meal_count: mealCount,
    },
    input.userId,
  );

  return {
    runId: run.id,
    model: built.model,
    provider: AI_PROVIDER,
    proposalType: MEAL_PROPOSAL_TYPE,
    proposalVersion: MEAL_PROPOSAL_VERSION,
    durationMs,
    proposal,
  };
}

export function ingestMealProposal(input: {
  listId: string;
  userId: string;
  dishes: string[];
}): Promise<MealProposalIngestResult> {
  const key = `${input.listId}:${input.userId}`;
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = ingestMealProposalOnce(input).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export async function abandonMealProposal(input: {
  listId: string;
  userId: string;
  runId: string;
}) {
  const list = await prisma.shoppingList.findUniqueOrThrow({
    where: { id: input.listId },
    select: { id: true },
  });
  const run = await prisma.aiProposalRun.findUnique({
    where: { id: input.runId },
  });
  if (
    !run ||
    run.listId !== list.id ||
    run.proposalType !== MEAL_PROPOSAL_TYPE
  ) {
    throw notFound("AI run not found.");
  }
  if (run.status === "abandoned") return { abandoned: true as const };
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
  return { abandoned: true as const };
}
