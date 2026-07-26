import { applyCategoryCorrection } from "@shared/category-corrections";
import { isShoppingCategory } from "@shared/shopping-categories";

import { sha256 } from "../lib/names";

import type { AdapterRunResult, EvalAdapter } from "./types";

/**
 * Offline Shopping Categories Eval adapter.
 * Runs CategoryCorrections on fixture cases — no OpenAI.
 */
export const shoppingCategoriesAdapter: EvalAdapter = {
  id: "shopping-categories",
  proposalType: "shopping-categories-corrections",

  async run(ctx): Promise<AdapterRunResult> {
    const started = Date.now();
    const cases = ctx.scenario.input.categoryCases ?? [];
    const promptHash = sha256(
      ["shopping-categories-v1", JSON.stringify(cases)].join("\n"),
    );

    const baseTelemetry = {
      model: "category-corrections",
      resolvedModel: "category-corrections",
      provider: "fixture",
      proposalType: "shopping-categories-corrections",
      proposalVersion: 1,
      promptHash,
      temperature: 0,
      seed: ctx.seed,
      seedSupported: false,
      listsProvidedCount: 0,
      sourceListsCount: 0,
      latencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    };

    if (cases.length === 0) {
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus: [],
        error: {
          code: "INVALID_INPUT",
          message: "categoryCases required for shopping-categories adapter",
        },
        telemetry: { ...baseTelemetry, latencyMs: Date.now() - started },
      };
    }

    for (const c of cases) {
      if (!isShoppingCategory(c.aiCategory)) {
        return {
          rawModelResponse: { cases },
          normalizedOutput: null,
          corpus: [],
          error: {
            code: "INVALID_INPUT",
            message: `aiCategory not in enum: ${c.aiCategory} (${c.name})`,
          },
          telemetry: { ...baseTelemetry, latencyMs: Date.now() - started },
        };
      }
      if (!isShoppingCategory(c.expectedCategory)) {
        return {
          rawModelResponse: { cases },
          normalizedOutput: null,
          corpus: [],
          error: {
            code: "INVALID_INPUT",
            message: `expectedCategory not in enum: ${c.expectedCategory} (${c.name})`,
          },
          telemetry: { ...baseTelemetry, latencyMs: Date.now() - started },
        };
      }
    }

    const items = cases.map((c) => {
      const result = applyCategoryCorrection(c.name, c.aiCategory);
      return {
        name: c.name,
        amount: null,
        note: null,
        category: result.category,
        reason: result.correctionRule,
        corrected: result.corrected,
        aiCategory: c.aiCategory,
        expectedCategory: c.expectedCategory,
      };
    });

    return {
      rawModelResponse: { cases, results: items },
      normalizedOutput: {
        shoppingContext: { title: "Categories", theme: "generic" },
        items,
      },
      corpus: cases.map((c) => c.name),
      telemetry: {
        ...baseTelemetry,
        latencyMs: Date.now() - started,
      },
    };
  },
};
