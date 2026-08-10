/**
 * Eval adapter for deterministic history-merge (no LLM).
 */

import { applyCategoryCorrectionsToSuggestItems } from "@/features/ai/applyCategoryCorrections";
import { SuggestFromHistoryProposalSchema } from "@/features/ai/schemas";
import { selectHistorySourceListsFromFixtures } from "@/features/ai/selectHistorySourceLists";
import {
  mergeHistoryLists,
  type HistorySourceList,
} from "@/features/shopping-list/mergeHistoryLists";
import {
  HISTORY_PROPOSAL_TYPE,
  HISTORY_PROPOSAL_VERSION,
} from "@/lib/openai";

import { sha256 } from "../lib/names";
import type { Scenario } from "../schema/scenario";

import type { AdapterRunResult, EvalAdapter } from "./types";

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

export const historySuggestAdapter: EvalAdapter = {
  id: "shopping-history",
  proposalType: HISTORY_PROPOSAL_TYPE,

  async run(ctx): Promise<AdapterRunResult> {
    const listsProvidedCount =
      (ctx.scenario.input.lists?.length ?? 0) +
      (ctx.scenario.input.generate?.listCount ?? 0);
    const lists = expandLists(ctx.scenario);
    const corpus = extractCorpus(lists);
    const promptHash = sha256(
      ["history-merge-v1", String(lists.length), ctx.promptId].join("\n"),
    );

    const baseTelemetry = {
      model: "history-merge-v1",
      resolvedModel: "history-merge-v1",
      provider: "local",
      proposalType: HISTORY_PROPOSAL_TYPE,
      proposalVersion: HISTORY_PROPOSAL_VERSION,
      promptHash,
      temperature: 0,
      seed: ctx.seed,
      seedSupported: false,
      listsProvidedCount,
      sourceListsCount: lists.length,
      latencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
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
        telemetry: baseTelemetry,
      };
    }

    const started = Date.now();
    try {
      const merged = mergeHistoryLists(lists);
      const items = applyCategoryCorrectionsToSuggestItems(merged.items);
      const normalized = SuggestFromHistoryProposalSchema.parse({
        shoppingContext: merged.shoppingContext,
        items,
      });

      return {
        rawModelResponse: { kind: "history-merge", proposal: normalized },
        normalizedOutput: normalized,
        corpus,
        telemetry: {
          ...baseTelemetry,
          latencyMs: Date.now() - started,
          sourceListsCount: lists.length,
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
