import {
  buildHistorySuggestSystemPrompt,
  buildSuggestFromHistory,
  buildUserPrompt,
  HISTORY_SUGGEST_JSON_SCHEMA_NAME,
  HISTORY_SUGGEST_TEMPERATURE,
  type HistorySourceList,
} from "@/features/ai/buildSuggestFromHistory";
import { enrichSuggestFromHistory } from "@/features/ai/enrichSuggestFromHistory";
import type { AiOutputLanguage } from "@/features/ai/outputLanguage";
import { SuggestFromHistoryProposalSchema } from "@/features/ai/schemas";
import { selectHistorySourceListsFromFixtures } from "@/features/ai/selectHistorySourceLists";
import {
  HISTORY_PROPOSAL_TYPE,
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

function asLocale(locale: string): AiOutputLanguage {
  return (AI_LOCALES.has(locale) ? locale : "pl") as AiOutputLanguage;
}

function expandLists(scenario: Scenario): HistorySourceList[] {
  const { input } = scenario;
  const raw: Array<{
    id?: string;
    name: string;
    updatedAt: string;
    preferredForAi?: boolean;
    items: Array<{
      name: string;
      amount?: string | null;
      note?: string | null;
      category?: string;
    }>;
  }> = [];

  if (input.lists?.length) {
    raw.push(...input.lists);
  }

  if (input.generate) {
    const g = input.generate;
    const base = new Date(g.baseDate).getTime();
    for (let i = 0; i < g.listCount; i++) {
      const updatedAt = new Date(base + i * 86_400_000).toISOString();
      const items = Array.from({ length: g.itemsPerList }, (_, j) => ({
        name: `${g.namePrefix} ${i + 1}-${j + 1}`,
        amount: null as string | null,
        note: null as string | null,
        category: g.category,
      }));
      raw.push({
        id: `gen-list-${i + 1}`,
        name: `${g.listNamePrefix} ${i + 1}`,
        updatedAt,
        preferredForAi: false,
        items,
      });
    }
  }

  const all: HistorySourceList[] = raw.map((list, index) => ({
    id: list.id ?? `list-${index + 1}`,
    name: list.name,
    updatedAt: list.updatedAt,
    preferredForAi: Boolean(list.preferredForAi),
    recencyWeight: 1,
    items: list.items.map((item) => ({
      name: item.name,
      amount: item.amount ?? null,
      note: item.note ?? null,
      category: item.category ?? "other",
      normalizedName: item.name.trim().toLowerCase(),
    })),
  }));

  return selectHistorySourceListsFromFixtures(all);
}

function extractCorpus(lists: HistorySourceList[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const list of lists) {
    for (const item of list.items) {
      const key = item.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      names.push(item.name);
    }
  }
  return names;
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

export const historySuggestAdapter: EvalAdapter = {
  id: "shopping-history",
  proposalType: HISTORY_PROPOSAL_TYPE,

  async run(ctx): Promise<AdapterRunResult> {
    const locale = asLocale(ctx.scenario.input.locale);
    const listsProvidedCount =
      (ctx.scenario.input.lists?.length ?? 0) +
      (ctx.scenario.input.generate?.listCount ?? 0);
    // Preferred-first select (same as production) - already capped to HISTORY_LIST_TAKE
    const lists = expandLists(ctx.scenario);
    const corpus = extractCorpus(lists);

    const promptHash = sha256(
      [
        buildHistorySuggestSystemPrompt(locale),
        // Template identity without fixture payload size blow-up for generate fixtures
        "USER_PROMPT_TEMPLATE_v1",
        HISTORY_SUGGEST_JSON_SCHEMA_NAME,
        String(lists.length),
      ].join("\n"),
    );

    const baseTelemetry = {
      model: ctx.modelOverride?.trim() || OPENAI_TEXT_MODEL,
      resolvedModel: ctx.modelOverride?.trim() || OPENAI_TEXT_MODEL,
      provider: "openai",
      proposalType: HISTORY_PROPOSAL_TYPE,
      proposalVersion: 0,
      promptHash,
      temperature: HISTORY_SUGGEST_TEMPERATURE,
      seed: ctx.seed,
      seedSupported: true,
      listsProvidedCount,
      sourceListsCount: lists.length,
      latencyMs: 0,
    };

    if (lists.length === 0) {
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus: [],
        error: {
          code: "EMPTY_HISTORY",
          message: "No shopping lists with products to suggest from.",
        },
        telemetry: {
          ...baseTelemetry,
          proposalVersion: 3,
          latencyMs: 0,
        },
      };
    }

    const started = Date.now();
    try {
      // Hash includes real user prompt for non-generate runs (debuggability)
      const userPrompt = buildUserPrompt(lists, locale);
      const fullPromptHash = sha256(
        [
          buildHistorySuggestSystemPrompt(locale),
          userPrompt,
          HISTORY_SUGGEST_JSON_SCHEMA_NAME,
        ].join("\n"),
      );

      const generated = await buildSuggestFromHistory({
        lists,
        outputLanguage: locale,
        modelOverride: ctx.modelOverride,
        seed: ctx.seed,
      });

      const enriched = enrichSuggestFromHistory({
        proposal: generated.proposal,
        lists,
      });

      const normalized = SuggestFromHistoryProposalSchema.parse(enriched);
      const usage = extractUsage(generated.rawResponse);
      const latencyMs = Date.now() - started;

      return {
        rawModelResponse: generated.rawResponse,
        normalizedOutput: normalized,
        corpus,
        telemetry: {
          latencyMs,
          model: generated.model,
          resolvedModel: usage.resolvedModel ?? generated.model,
          provider: generated.provider,
          proposalType: HISTORY_PROPOSAL_TYPE,
          proposalVersion: generated.proposalVersion,
          promptHash: fullPromptHash,
          temperature: generated.temperature,
          seed: generated.seed,
          seedSupported: true,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          estimatedCostUsd: estimateCostUsd({
            model: generated.model,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          }),
          listsProvidedCount,
          sourceListsCount: lists.length,
        },
      };
    } catch (err) {
      const latencyMs = Date.now() - started;
      const message = err instanceof Error ? err.message : String(err);
      return {
        rawModelResponse: null,
        normalizedOutput: null,
        corpus,
        error: { code: "ADAPTER_ERROR", message },
        telemetry: {
          ...baseTelemetry,
          proposalVersion: 3,
          latencyMs,
        },
      };
    }
  },
};
