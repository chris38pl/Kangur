import { getAdapter } from "../adapters/registry";
import type {
  ScenarioRunResult,
  StabilityStats,
} from "../adapters/types";
import { EVAL_DEFAULT_SEED } from "../config";
import { findName, mean, precisionRecallF1, stdev } from "../lib/names";
import { runJudges, scoreFromRules } from "../judges/runJudges";
import type { Scenario } from "../schema/scenario";

import { loadBaselineItems } from "./loadSuite";

function annotateOutput(
  output: unknown,
  mustExclude: string[],
  baseline: string[],
): ScenarioRunResult["outputItemAnnotations"] {
  const items =
    (output as { items?: Array<{ name: string }> } | null)?.items ?? [];
  return items.map((item) => {
    if (mustExclude.some((n) => findName([item.name], n))) {
      return {
        name: item.name,
        mark: "bad" as const,
        reason: "mustExclude",
      };
    }
    if (baseline.length && findName(baseline, item.name)) {
      return { name: item.name, mark: "ok" as const };
    }
    if (baseline.length) {
      return { name: item.name, mark: "extra" as const };
    }
    return { name: item.name, mark: "ok" as const };
  });
}

export async function evaluateScenario(input: {
  scenario: Scenario;
  suiteDir: string;
  suiteVersion: number;
  modelOverride?: string;
  seed?: number;
  promptId: string;
}): Promise<ScenarioRunResult> {
  const adapter = getAdapter(input.scenario.adapter);
  const seed = input.seed ?? EVAL_DEFAULT_SEED;
  const baselineItems = await loadBaselineItems(
    input.suiteDir,
    input.scenario,
  );

  const adapterResult = await adapter.run({
    scenario: input.scenario,
    modelOverride: input.modelOverride,
    seed,
    promptId: input.promptId,
  });

  const { ruleResults, judgeLatencyMs } = runJudges({
    scenario: input.scenario,
    output: adapterResult.normalizedOutput,
    corpus: adapterResult.corpus,
    error: adapterResult.error,
    sourceListsCount: adapterResult.telemetry.sourceListsCount,
    baselineItems,
  });

  const { passed, score } = scoreFromRules(ruleResults);
  const golden =
    baselineItems.length > 0
      ? {
          ...precisionRecallF1(
            (
              (adapterResult.normalizedOutput as {
                items?: Array<{ name: string }>;
              } | null)?.items ?? []
            ).map((i) => i.name),
            baselineItems,
          ),
          baselineItems,
        }
      : undefined;

  return {
    scenarioId: input.scenario.id,
    scenarioVersion: input.scenario.scenarioVersion,
    name: input.scenario.name,
    passed,
    score,
    ruleResults,
    corpus: adapterResult.corpus,
    rawModelResponse: adapterResult.rawModelResponse,
    normalizedOutput: adapterResult.normalizedOutput,
    error: adapterResult.error,
    golden,
    outputItemAnnotations: annotateOutput(
      adapterResult.normalizedOutput,
      input.scenario.expectations?.mustExclude ?? [],
      baselineItems,
    ),
    telemetry: {
      ...adapterResult.telemetry,
      judgeLatencyMs,
      suiteVersion: input.suiteVersion,
      scenarioVersion: input.scenario.scenarioVersion,
      promptId: input.promptId,
    },
  };
}

export function computeStability(
  runs: ScenarioRunResult[],
): StabilityStats {
  const pass = runs.filter((r) => r.passed).length;
  const fail = runs.length - pass;
  const scores = runs.map((r) => r.score);
  return {
    runs: runs.length,
    pass,
    fail,
    stability: runs.length === 0 ? 0 : (pass / runs.length) * 100,
    averageScore: Math.round(mean(scores) * 10) / 10,
    stdDeviation: Math.round(stdev(scores) * 10) / 10,
  };
}
