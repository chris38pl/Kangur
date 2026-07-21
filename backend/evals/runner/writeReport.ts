import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ScenarioAggregate } from "../adapters/types";
import { EVAL_RETENTION } from "../config";
import type { PromptCompareDiff } from "./compareRuns";
import { formatCompareDiff } from "./compareRuns";
import { evalsRoot } from "./loadSuite";

export type SuiteReport = {
  suiteName: string;
  suiteVersion: number;
  promptId: string;
  model: string;
  resolvedModel: string;
  providerApiVersion?: string;
  temperature: number;
  seed: number | null;
  startedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  scenarios: ScenarioAggregate[];
  compareDiffs?: PromptCompareDiff[];
  compareLabel?: string;
  reproCommand: string;
};

function costOf(agg: ScenarioAggregate): number {
  return (
    agg.primary.telemetry.estimatedCostUsd ??
    meanCost(agg) ??
    0
  );
}

function meanCost(agg: ScenarioAggregate): number | undefined {
  const costs = agg.runs
    .map((r) => r.telemetry.estimatedCostUsd)
    .filter((c): c is number => c != null);
  if (!costs.length) return undefined;
  return costs.reduce((a, b) => a + b, 0) / costs.length;
}

export function buildReproCommand(opts: {
  suite: string;
  scenarioIds?: string[];
  promptId?: string;
  seed?: number | null;
  model?: string;
}): string {
  const parts = [`pnpm eval:ai --suite ${opts.suite}`];
  if (opts.scenarioIds?.length) {
    parts.push(`--only ${opts.scenarioIds.join(",")}`);
  }
  if (opts.promptId && opts.promptId !== "production") {
    parts.push(`--prompt ${opts.promptId}`);
  }
  if (opts.seed != null) {
    parts.push(`--seed ${opts.seed}`);
  }
  if (opts.model) {
    parts.push(`--model ${opts.model}`);
  }
  return parts.join(" ");
}

export function formatTextReport(report: SuiteReport): string {
  const lines: string[] = [];
  const costs = report.scenarios.map((s) => ({
    id: s.scenarioId,
    cost: costOf(s),
  }));
  const suiteCost = costs.reduce((a, c) => a + c.cost, 0);
  const avgCost =
    costs.length === 0 ? 0 : suiteCost / costs.length;
  const sorted = [...costs].sort((a, b) => a.cost - b.cost);
  const cheapest = sorted[0];
  const expensive = sorted[sorted.length - 1];

  const sample = report.scenarios[0]?.primary.telemetry;

  lines.push("=".repeat(60));
  lines.push(
    `${report.suiteName} Suite v${report.suiteVersion}`,
  );
  lines.push(
    `Prompt ${report.promptId} (hash ${sample?.promptHash ?? "-"}) proposalVersion ${sample?.proposalVersion ?? "-"}`,
  );
  lines.push(
    `Model: ${report.model} → ${report.resolvedModel}`,
  );
  if (report.providerApiVersion) {
    lines.push(`providerApiVersion: ${report.providerApiVersion}`);
  }
  lines.push(
    `temp=${report.temperature} seed=${report.seed ?? "n/a"}`,
  );
  lines.push(
    `Scenarios: ${report.scenarios.length} | Passed ${report.passed} | Failed ${report.failed}`,
  );
  lines.push(`Duration: ${(report.durationMs / 1000).toFixed(1)}s`);
  lines.push(
    `Suite cost: $${suiteCost.toFixed(4)} | Avg: $${avgCost.toFixed(4)}` +
      (cheapest
        ? ` | Cheapest: ${cheapest.id} $${cheapest.cost.toFixed(4)}`
        : "") +
      (expensive
        ? ` | Most expensive: ${expensive.id} $${expensive.cost.toFixed(4)}`
        : ""),
  );
  lines.push("=".repeat(60));

  const flaky = report.scenarios.filter(
    (s) => s.stability && s.stability.stability < 100,
  );
  if (flaky.length) {
    lines.push("");
    lines.push("Flaky scenarios:");
    for (const s of flaky) {
      lines.push(
        `  - ${s.scenarioId}: stability ${s.stability!.stability.toFixed(0)}% (${s.stability!.pass}/${s.stability!.runs})`,
      );
    }
  }

  const judgeTimes = report.scenarios
    .flatMap((s) => s.primary.ruleResults)
    .map((r) => ({ id: r.id, type: r.type, ms: r.latencyMs }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 8);
  if (judgeTimes.length) {
    lines.push("");
    lines.push("Judge timing (top):");
    for (const j of judgeTimes) {
      lines.push(`  ${j.type} (${j.id}): ${j.ms} ms`);
    }
  }

  for (const agg of report.scenarios) {
    const r = agg.primary;
    lines.push("");
    lines.push("-".repeat(42));
    lines.push(`Scenario: ${agg.scenarioId} (v${agg.scenarioVersion})`);
    lines.push(r.passed ? "PASS" : "FAIL");
    if (agg.stability && agg.stability.runs > 1) {
      lines.push("");
      lines.push(`Runs: ${agg.stability.runs}`);
      lines.push(`Pass: ${agg.stability.pass}`);
      lines.push(`Fail: ${agg.stability.fail}`);
      lines.push(`Stability: ${agg.stability.stability.toFixed(0)}%`);
      lines.push(`Average score: ${agg.stability.averageScore}`);
      lines.push(`Std deviation: ${agg.stability.stdDeviation}`);
    }
    lines.push("");
    lines.push("Output:");
    if (r.outputItemAnnotations.length === 0) {
      lines.push("  (empty)");
    } else {
      for (const item of r.outputItemAnnotations) {
        const mark =
          item.mark === "ok" ? "✓" : item.mark === "bad" ? "✗" : "·";
        lines.push(
          `  ${mark} ${item.name}${item.reason ? `  # ${item.reason}` : ""}`,
        );
      }
    }
    lines.push("");
    lines.push("Rules:");
    for (const rule of r.ruleResults) {
      if (rule.tier === "info") continue;
      const label = rule.status.toUpperCase();
      lines.push(`  ${label} ${rule.id} ${rule.type} [${rule.severity}]`);
      lines.push(`    ${rule.message}`);
      if (rule.evidence.offendingItems?.length) {
        lines.push(
          `    Offending: ${rule.evidence.offendingItems.join(", ")}`,
        );
      }
      if (rule.evidence.expected?.length && rule.status !== "pass") {
        lines.push(`    Expected: ${rule.evidence.expected.join(", ")}`);
      }
    }
    if (r.golden) {
      lines.push("");
      lines.push(
        `Golden: P=${r.golden.precision.toFixed(2)} R=${r.golden.recall.toFixed(2)} F1=${r.golden.f1.toFixed(2)}`,
      );
    }
    lines.push("");
    lines.push(
      `Telemetry: ${r.telemetry.latencyMs}ms model | judges ${r.telemetry.judgeLatencyMs ?? 0}ms | tokens ${(r.telemetry.promptTokens ?? 0)}+${(r.telemetry.completionTokens ?? 0)} | $${(r.telemetry.estimatedCostUsd ?? 0).toFixed(4)}`,
    );
    lines.push(
      `Corpus (${r.corpus.length}): ${r.corpus.slice(0, 12).join(", ")}${r.corpus.length > 12 ? "…" : ""}`,
    );
  }

  if (report.compareDiffs?.length) {
    lines.push("");
    lines.push("=".repeat(60));
    lines.push(`Compare: ${report.compareLabel ?? ""}`);
    for (const d of report.compareDiffs) {
      lines.push("");
      lines.push(formatCompareDiff(d));
    }
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("Repro:");
  lines.push(report.reproCommand);
  lines.push("");
  return lines.join("\n");
}

export async function writeReport(report: SuiteReport): Promise<{
  txtPath: string;
  jsonPath: string;
}> {
  const day = report.startedAt.slice(0, 10);
  const dir = path.join(evalsRoot(), "reports", day);
  await mkdir(dir, { recursive: true });
  const stamp = report.startedAt.replace(/[:.]/g, "-");
  const base = `${report.suiteName}-v${report.suiteVersion}-p${report.promptId}-${stamp}`;
  const txtPath = path.join(dir, `${base}.txt`);
  const jsonPath = path.join(dir, `${base}.json`);
  await writeFile(txtPath, formatTextReport(report), "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  return { txtPath, jsonPath };
}

/** Retention: drop dated folders older than maxAgeDays, then cap at maxRuns. */
export async function pruneReports(
  opts: {
    maxAgeDays?: number;
    maxRuns?: number;
  } = {},
): Promise<{ removed: string[] }> {
  const maxAgeDays = opts.maxAgeDays ?? EVAL_RETENTION.maxAgeDays;
  const maxRuns = opts.maxRuns ?? EVAL_RETENTION.maxRuns;
  const reportsRoot = path.join(evalsRoot(), "reports");
  const removed: string[] = [];

  let dayDirs: string[] = [];
  try {
    dayDirs = (await readdir(reportsRoot)).filter((d) =>
      /^\d{4}-\d{2}-\d{2}$/.test(d),
    );
  } catch {
    return { removed };
  }

  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  for (const day of dayDirs) {
    const dayPath = path.join(reportsRoot, day);
    const dayTime = new Date(day).getTime();
    if (!Number.isNaN(dayTime) && dayTime < cutoff) {
      await rm(dayPath, { recursive: true, force: true });
      removed.push(dayPath);
    }
  }

  dayDirs = (await readdir(reportsRoot)).filter((d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d),
  );

  type RunFile = { path: string; mtime: number };
  const runs: RunFile[] = [];
  for (const day of dayDirs) {
    const dayPath = path.join(reportsRoot, day);
    const files = await readdir(dayPath);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const fp = path.join(dayPath, f);
      const st = await stat(fp);
      runs.push({ path: fp, mtime: st.mtimeMs });
    }
  }
  runs.sort((a, b) => b.mtime - a.mtime);
  if (runs.length > maxRuns) {
    for (const old of runs.slice(maxRuns)) {
      await rm(old.path, { force: true });
      const txt = old.path.replace(/\.json$/, ".txt");
      await rm(txt, { force: true });
      removed.push(old.path);
    }
  }

  return { removed };
}
