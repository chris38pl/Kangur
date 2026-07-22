import { buildMealProposal } from "@/features/ai/buildMealProposal";
import { dedupeMealIngredients } from "@/features/ai/dedupeMealIngredients";
import type { AiOutputLanguage } from "@/features/ai/outputLanguage";
import {
  MealProposalAiResponseSchema,
  type MealProposalAiResponse,
} from "@/features/ai/schemas";
import {
  MEAL_PROPOSAL_TYPE,
  MEAL_PROPOSAL_VERSION,
  OPENAI_TEXT_MODEL,
} from "@/lib/openai";

import { estimateCostUsd } from "../config";
import { sha256 } from "../lib/names";
import type { Scenario } from "../schema/scenario";

import type { AdapterRunResult, EvalAdapter } from "./types";

const AI_LOCALES = new Set([
  "pl",
  "en",
  "de",
  "ru",
  "uk",
  "fr",
  "es",
  "it",
  "cs",
  "be",
]);

const MEAL_TEMPERATURE = 0.1;

function asLocale(locale: string): AiOutputLanguage {
  return (AI_LOCALES.has(locale) ? locale : "pl") as AiOutputLanguage;
}

function mapExistingItems(scenario: Scenario) {
  return (scenario.input.existingItems ?? []).map((item, index) => ({
    id: item.id ?? `existing-${index + 1}`,
    name: item.name,
    amount: item.amount ?? null,
    note: item.note ?? null,
    category: item.category ?? "other",
    status: item.status ?? "pending",
  }));
}

function extractUsage(raw: Record<string, unknown>): {
  promptTokens?: number;
  completionTokens?: number;
  resolvedModel?: string;
} {
  const usage = raw.usage as
    | { prompt_tokens?: number; completion_tokens?: number }
    | undefined;
  const model = typeof raw.model === "string" ? raw.model : undefined;
  return {
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    resolvedModel: model,
  };
}

function normalizeProposal(
  proposal: ReturnType<typeof dedupeMealIngredients>,
) {
  return {
    shoppingContext: proposal.shoppingContext,
    meals: proposal.meals,
    items: proposal.operations.map((op) => ({
      name: op.name,
      amount: op.amount ?? null,
      note: op.note ?? null,
      category: op.category,
      reason: op.reason ?? null,
      ownerMealId: op.ownerMealId,
      op: op.op,
    })),
  };
}

export const mealProposalAdapter: EvalAdapter = {
  id: "meal-proposal",
  proposalType: MEAL_PROPOSAL_TYPE,

  async run(ctx): Promise<AdapterRunResult> {
    const locale = asLocale(ctx.scenario.input.locale);
    const dishes = (ctx.scenario.input.dishes ?? [])
      .map((d) => d.trim())
      .filter(Boolean);
    const existingItems = mapExistingItems(ctx.scenario);
    const fixture = ctx.scenario.input.mealsFixture;

    const promptHash = sha256(
      [
        "meal-proposal-v1",
        locale,
        JSON.stringify(dishes),
        fixture ? "fixture" : "model",
      ].join("\n"),
    );

    const baseTelemetry = {
      model: ctx.modelOverride?.trim() || OPENAI_TEXT_MODEL,
      resolvedModel: ctx.modelOverride?.trim() || OPENAI_TEXT_MODEL,
      provider: "openai",
      proposalType: MEAL_PROPOSAL_TYPE,
      proposalVersion: MEAL_PROPOSAL_VERSION,
      promptHash,
      temperature: MEAL_TEMPERATURE,
      seed: ctx.seed,
      seedSupported: true,
      listsProvidedCount: 0,
      sourceListsCount: 0,
      latencyMs: 0,
    };

    if (!fixture && dishes.length === 0) {
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus: [],
        error: {
          code: "INVALID_INPUT",
          message: "Provide dishes (1–5) or mealsFixture for offline path.",
        },
        telemetry: baseTelemetry,
      };
    }

    const started = Date.now();

    try {
      let ai: MealProposalAiResponse;
      let rawModelResponse: unknown = null;
      let model = OPENAI_TEXT_MODEL;
      let usage: {
        promptTokens?: number;
        completionTokens?: number;
        resolvedModel?: string;
      } = {};
      let seed: number | null = ctx.seed;

      if (fixture) {
        ai = MealProposalAiResponseSchema.parse(fixture);
        model = "fixture";
        seed = null;
      } else {
        const generated = await buildMealProposal({
          dishes,
          existingItems,
          outputLanguage: locale,
          modelOverride: ctx.modelOverride,
          seed: ctx.seed,
        });
        ai = generated.ai;
        rawModelResponse = generated.rawResponse;
        model = generated.model;
        seed = generated.seed;
        usage = extractUsage(generated.rawResponse);
      }

      const proposal = dedupeMealIngredients(ai, existingItems);
      const normalizedOutput = normalizeProposal(proposal);
      const latencyMs = Date.now() - started;

      return {
        rawModelResponse,
        normalizedOutput,
        corpus: [],
        telemetry: {
          latencyMs,
          model,
          resolvedModel: usage.resolvedModel ?? model,
          provider: fixture ? "fixture" : "openai",
          proposalType: MEAL_PROPOSAL_TYPE,
          proposalVersion: MEAL_PROPOSAL_VERSION,
          promptHash,
          temperature: MEAL_TEMPERATURE,
          seed,
          seedSupported: !fixture,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          estimatedCostUsd: fixture
            ? 0
            : estimateCostUsd({
                model,
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
              }),
          listsProvidedCount: 0,
          sourceListsCount: 0,
        },
      };
    } catch (err) {
      const latencyMs = Date.now() - started;
      const message = err instanceof Error ? err.message : String(err);
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus: [],
        error: { code: "ADAPTER_ERROR", message },
        telemetry: {
          ...baseTelemetry,
          latencyMs,
        },
      };
    }
  },
};
