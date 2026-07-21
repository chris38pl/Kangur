import type { RuleResult } from "../schema/report";
import type { Scenario } from "../schema/scenario";

export type EvalTelemetry = {
  latencyMs: number;
  judgeLatencyMs?: number;
  model: string;
  resolvedModel: string;
  providerApiVersion?: string;
  provider: string;
  proposalType: string;
  proposalVersion: number;
  promptHash: string;
  promptSnapshotPath?: string;
  temperature: number;
  topP?: number;
  seed: number | null;
  seedSupported: boolean;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCostUsd?: number;
  suiteVersion: number;
  scenarioVersion: number;
  listsProvidedCount: number;
  sourceListsCount: number;
  promptId: string;
};

export type AdapterRunResult = {
  rawModelResponse: unknown;
  normalizedOutput: unknown | null;
  corpus: string[];
  error?: { code: string; message: string };
  telemetry: Omit<
    EvalTelemetry,
    "judgeLatencyMs" | "suiteVersion" | "scenarioVersion" | "promptId"
  > & {
    listsProvidedCount: number;
    sourceListsCount: number;
  };
};

export type EvalAdapter = {
  id: string;
  proposalType: string;
  run(ctx: {
    scenario: Scenario;
    modelOverride?: string;
    seed: number;
    promptId: string;
  }): Promise<AdapterRunResult>;
};

export type ScenarioRunResult = {
  scenarioId: string;
  scenarioVersion: number;
  name: string;
  passed: boolean;
  score: number;
  ruleResults: RuleResult[];
  corpus: string[];
  rawModelResponse: unknown;
  normalizedOutput: unknown | null;
  error?: { code: string; message: string };
  telemetry: EvalTelemetry;
  golden?: {
    precision: number;
    recall: number;
    f1: number;
    baselineItems: string[];
  };
  outputItemAnnotations: Array<{
    name: string;
    mark: "ok" | "bad" | "extra";
    reason?: string;
  }>;
};

export type StabilityStats = {
  runs: number;
  pass: number;
  fail: number;
  stability: number;
  averageScore: number;
  stdDeviation: number;
};

export type ScenarioAggregate = {
  scenarioId: string;
  scenarioVersion: number;
  name: string;
  runs: ScenarioRunResult[];
  stability?: StabilityStats;
  /** Representative / last run for report detail */
  primary: ScenarioRunResult;
};
