import { EVAL_DEFAULT_SEED } from "../config";
import type { ScenarioAggregate } from "../adapters/types";
import { diffScenarioRuns } from "./compareRuns";
import {
  computeStability,
  evaluateScenario,
} from "./evaluator";
import { loadSuite } from "./loadSuite";
import {
  buildReproCommand,
  pruneReports,
  writeReport,
  type SuiteReport,
} from "./writeReport";
import { writeGolden } from "./writeGolden";

export type CliOptions = {
  suite: string;
  model?: string;
  only?: string[];
  prompt?: string;
  comparePrompt?: string;
  compareModel?: string;
  repeat?: number;
  seed?: number;
  writeGolden?: string;
  force?: boolean;
  skipPrune?: boolean;
};

export async function runSuite(opts: CliOptions): Promise<{
  report: SuiteReport;
  exitCode: number;
  txtPath: string;
  jsonPath: string;
}> {
  const loaded = await loadSuite(opts.suite);
  const promptId = opts.prompt ?? loaded.meta.defaultPrompt ?? "production";
  const seed = opts.seed ?? EVAL_DEFAULT_SEED;
  const repeat = Math.max(1, opts.repeat ?? 1);
  const model = opts.model ?? loaded.meta.defaultModel;

  let scenarios = loaded.scenarios;
  if (opts.only?.length) {
    const set = new Set(opts.only);
    scenarios = scenarios.filter((s) => set.has(s.id));
    if (scenarios.length === 0) {
      throw new Error(`No scenarios matched --only ${opts.only.join(",")}`);
    }
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const aggregates: ScenarioAggregate[] = [];

  for (const scenario of scenarios) {
    process.stderr.write(`→ ${scenario.id} (×${repeat})…\n`);
    const runs = [];
    for (let i = 0; i < repeat; i++) {
      runs.push(
        await evaluateScenario({
          scenario,
          suiteDir: loaded.suiteDir,
          suiteVersion: loaded.meta.suiteVersion,
          modelOverride: model,
          seed,
          promptId,
        }),
      );
    }
    const stability = repeat > 1 ? computeStability(runs) : undefined;
    // Prefer a failing run as primary if any hard-failed
    const primary =
      runs.find((r) => !r.passed) ?? runs[runs.length - 1]!;
    aggregates.push({
      scenarioId: scenario.id,
      scenarioVersion: scenario.scenarioVersion,
      name: scenario.name,
      runs,
      stability,
      primary,
    });
  }

  // write-golden for a single scenario id
  if (opts.writeGolden) {
    const agg = aggregates.find((a) => a.scenarioId === opts.writeGolden);
    if (!agg) {
      throw new Error(`--write-golden scenario not in run: ${opts.writeGolden}`);
    }
    const file = await writeGolden({
      suiteDir: loaded.suiteDir,
      scenarioId: opts.writeGolden,
      result: agg.primary,
      force: Boolean(opts.force),
    });
    process.stderr.write(`Golden written: ${file}\n`);
  }

  let compareDiffs = undefined as SuiteReport["compareDiffs"];
  let compareLabel = undefined as string | undefined;

  if (opts.comparePrompt) {
    compareLabel = `prompt ${promptId} vs ${opts.comparePrompt}`;
    compareDiffs = [];
    for (const scenario of scenarios) {
      const b = await evaluateScenario({
        scenario,
        suiteDir: loaded.suiteDir,
        suiteVersion: loaded.meta.suiteVersion,
        modelOverride: model,
        seed,
        promptId: opts.comparePrompt,
      });
      const a = aggregates.find((x) => x.scenarioId === scenario.id)!.primary;
      compareDiffs.push(
        diffScenarioRuns(a, b, promptId, opts.comparePrompt),
      );
    }
  }

  if (opts.compareModel) {
    compareLabel = `model ${model ?? "default"} vs ${opts.compareModel}`;
    compareDiffs = compareDiffs ?? [];
    for (const scenario of scenarios) {
      const b = await evaluateScenario({
        scenario,
        suiteDir: loaded.suiteDir,
        suiteVersion: loaded.meta.suiteVersion,
        modelOverride: opts.compareModel,
        seed,
        promptId,
      });
      const a = aggregates.find((x) => x.scenarioId === scenario.id)!.primary;
      compareDiffs.push(
        diffScenarioRuns(
          a,
          b,
          `model:${model ?? "default"}`,
          `model:${opts.compareModel}`,
        ),
      );
    }
  }

  const failedIds = aggregates
    .filter((a) => a.runs.some((r) => !r.passed))
    .map((a) => a.scenarioId);
  const passed = aggregates.length - failedIds.length;
  const failed = failedIds.length;

  const sample = aggregates[0]?.primary.telemetry;
  const report: SuiteReport = {
    suiteName: loaded.meta.name,
    suiteVersion: loaded.meta.suiteVersion,
    promptId,
    model: sample?.model ?? model ?? "unknown",
    resolvedModel: sample?.resolvedModel ?? sample?.model ?? "unknown",
    providerApiVersion: sample?.providerApiVersion,
    temperature: sample?.temperature ?? 0.2,
    seed,
    startedAt,
    durationMs: Date.now() - t0,
    passed,
    failed,
    scenarios: aggregates,
    compareDiffs,
    compareLabel,
    reproCommand: buildReproCommand({
      suite: opts.suite,
      scenarioIds: failedIds.length ? failedIds.slice(0, 5) : undefined,
      promptId,
      seed,
      model,
    }),
  };

  const { txtPath, jsonPath } = await writeReport(report);
  if (!opts.skipPrune) {
    await pruneReports();
  }

  return {
    report,
    exitCode: failed > 0 ? 1 : 0,
    txtPath,
    jsonPath,
  };
}
