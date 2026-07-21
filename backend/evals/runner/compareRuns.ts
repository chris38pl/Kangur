import type { ScenarioRunResult } from "../adapters/types";
import { normalizeNameKey } from "../lib/names";

export type ItemFieldDiff = {
  name: string;
  field: string;
  from: unknown;
  to: unknown;
};

export type PromptCompareDiff = {
  scenarioId: string;
  a: { promptId: string; passed: boolean; score: number; f1?: number };
  b: { promptId: string; passed: boolean; score: number; f1?: number };
  added: string[];
  removed: string[];
  changed: ItemFieldDiff[];
};

type Item = {
  name: string;
  amount?: string | null;
  note?: string | null;
  category?: string;
  reason?: string | null;
};

function itemsOf(run: ScenarioRunResult): Item[] {
  return (
    (run.normalizedOutput as { items?: Item[] } | null)?.items ?? []
  );
}

function byKey(items: Item[]): Map<string, Item> {
  const map = new Map<string, Item>();
  for (const item of items) {
    map.set(normalizeNameKey(item.name), item);
  }
  return map;
}

export function diffScenarioRuns(
  a: ScenarioRunResult,
  b: ScenarioRunResult,
  promptA: string,
  promptB: string,
): PromptCompareDiff {
  const itemsA = itemsOf(a);
  const itemsB = itemsOf(b);
  const mapA = byKey(itemsA);
  const mapB = byKey(itemsB);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: ItemFieldDiff[] = [];

  for (const [key, item] of mapB) {
    if (!mapA.has(key)) added.push(item.name);
  }
  for (const [key, item] of mapA) {
    if (!mapB.has(key)) removed.push(item.name);
  }

  for (const [key, itemA] of mapA) {
    const itemB = mapB.get(key);
    if (!itemB) continue;
    for (const field of ["note", "amount", "category", "reason"] as const) {
      const from = itemA[field] ?? null;
      const to = itemB[field] ?? null;
      if (String(from) !== String(to)) {
        changed.push({ name: itemA.name, field, from, to });
      }
    }
  }

  return {
    scenarioId: a.scenarioId,
    a: {
      promptId: promptA,
      passed: a.passed,
      score: a.score,
      f1: a.golden?.f1,
    },
    b: {
      promptId: promptB,
      passed: b.passed,
      score: b.score,
      f1: b.golden?.f1,
    },
    added,
    removed,
    changed,
  };
}

export function formatCompareDiff(diff: PromptCompareDiff): string {
  const lines: string[] = [
    `Scenario: ${diff.scenarioId}`,
    `  Prompt ${diff.a.promptId}  ${diff.a.passed ? "PASS" : "FAIL"}  score ${diff.a.score}`,
    `  Prompt ${diff.b.promptId}  ${diff.b.passed ? "PASS" : "FAIL"}  score ${diff.b.score}`,
    "",
    "Added:",
    ...(diff.added.length
      ? diff.added.map((n) => `  + ${n}`)
      : ["  (none)"]),
    "",
    "Removed:",
    ...(diff.removed.length
      ? diff.removed.map((n) => `  - ${n}`)
      : ["  (none)"]),
    "",
    "Changed:",
  ];
  if (diff.changed.length === 0) {
    lines.push("  (none)");
  } else {
    for (const c of diff.changed) {
      lines.push(`  ${c.name}`);
      lines.push(`    ${c.field}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`);
    }
  }
  lines.push("");
  lines.push(
    `Score: ${diff.a.score} → ${diff.b.score} (${diff.b.score - diff.a.score >= 0 ? "+" : ""}${Math.round((diff.b.score - diff.a.score) * 10) / 10})`,
  );
  if (diff.a.f1 != null && diff.b.f1 != null) {
    lines.push(
      `Golden F1: ${diff.a.f1.toFixed(2)} → ${diff.b.f1.toFixed(2)}`,
    );
  }
  return lines.join("\n");
}
