import { buildProposalFromText } from "@/features/ai/buildProposal";
import type { AiOutputLanguage } from "@/features/ai/outputLanguage";
import {
  IMPORT_PROPOSAL_TYPE,
  IMPORT_PROPOSAL_VERSION,
  OPENAI_TEXT_MODEL,
} from "@/lib/openai";

import { estimateCostUsd } from "../config";
import { sha256 } from "../lib/names";

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

const TEXT_INGEST_TEMPERATURE = 0.2;

function asLocale(locale: string): AiOutputLanguage {
  return (AI_LOCALES.has(locale) ? locale : "pl") as AiOutputLanguage;
}

function mapExistingItems(
  items: Array<{
    id?: string;
    name: string;
    amount?: string | null;
    note?: string | null;
    category?: string;
    status?: string;
  }>,
) {
  return items.map((item, index) => ({
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
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
      }
    | undefined;
  const model = typeof raw.model === "string" ? raw.model : undefined;
  return {
    promptTokens: usage?.prompt_tokens ?? usage?.input_tokens,
    completionTokens: usage?.completion_tokens ?? usage?.output_tokens,
    resolvedModel: model,
  };
}

/**
 * Text / clipboard ingest adapter — exercises ITEM IDENTIFICATION
 * via production `buildProposalFromText`.
 */
export const textIngestAdapter: EvalAdapter = {
  id: "text-ingest",
  proposalType: IMPORT_PROPOSAL_TYPE,

  async run(ctx): Promise<AdapterRunResult> {
    const locale = asLocale(ctx.scenario.input.locale);
    const rawInput = ctx.scenario.input.rawInput?.trim() ?? "";
    const sourceLabel = ctx.scenario.input.sourceLabel ?? "text";
    const existingItems = mapExistingItems(
      ctx.scenario.input.existingItems ?? [],
    );
    const mustInclude = ctx.scenario.expectations?.mustInclude ?? [];
    const corpus =
      mustInclude.length > 0
        ? mustInclude
        : (ctx.scenario.baseline?.items ?? []);

    const promptHash = sha256(
      ["text-ingest-v1", locale, sourceLabel, rawInput].join("\n"),
    );

    const baseTelemetry = {
      model: ctx.modelOverride?.trim() || OPENAI_TEXT_MODEL,
      resolvedModel: ctx.modelOverride?.trim() || OPENAI_TEXT_MODEL,
      provider: "openai",
      proposalType: IMPORT_PROPOSAL_TYPE,
      proposalVersion: IMPORT_PROPOSAL_VERSION,
      promptHash,
      temperature: TEXT_INGEST_TEMPERATURE,
      seed: ctx.seed,
      seedSupported: false,
      listsProvidedCount: 0,
      sourceListsCount: 0,
      latencyMs: 0,
    };

    if (!rawInput) {
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus: [],
        error: {
          code: "INVALID_INPUT",
          message: "rawInput required for text-ingest adapter.",
        },
        telemetry: baseTelemetry,
      };
    }

    const started = Date.now();
    try {
      const generated = await buildProposalFromText({
        sourceLabel,
        rawInput,
        existingItems,
        outputLanguage: locale,
      });

      const proposal = generated.proposal;
      const usage = extractUsage(generated.rawResponse);
      const normalizedOutput = {
        shoppingContext: proposal.shoppingContext,
        items: proposal.operations
          .filter((op) => op.op === "create" || op.op === "merge" || op.op === "update")
          .map((op) => ({
            name: op.name,
            amount: op.amount ?? null,
            note: op.note ?? null,
            category: op.category,
            reason: op.reason ?? null,
            op: op.op,
          })),
      };

      return {
        rawModelResponse: generated.rawResponse,
        normalizedOutput,
        corpus,
        telemetry: {
          ...baseTelemetry,
          latencyMs: Date.now() - started,
          model: generated.model,
          resolvedModel: usage.resolvedModel ?? generated.model,
          provider: generated.provider,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          estimatedCostUsd: estimateCostUsd({
            model: generated.model,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          }),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus,
        error: { code: "ADAPTER_ERROR", message },
        telemetry: {
          ...baseTelemetry,
          latencyMs: Date.now() - started,
        },
      };
    }
  },
};
