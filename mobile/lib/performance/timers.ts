import { getMetrics } from "@/lib/metrics";

import {
  budgetFor,
  type PerfTimerName,
  type PerfVerdict,
  verdictFor,
} from "./budgets";

type ActiveMark = {
  name: PerfTimerName;
  startedAt: number;
  labels?: Record<string, string | number | boolean>;
};

const active = new Map<string, ActiveMark>();

function markKey(name: PerfTimerName, id?: string): string {
  return id ? `${name}:${id}` : name;
}

/**
 * Start a named performance timer. Safe to call twice — last start wins for that key.
 */
export function perfStart(
  name: PerfTimerName,
  opts?: { id?: string; labels?: Record<string, string | number | boolean> },
): void {
  active.set(markKey(name, opts?.id), {
    name,
    startedAt: Date.now(),
    labels: opts?.labels,
  });
}

/**
 * End a timer and log against budget. Returns duration or null if no matching start.
 * Pass `as` to report under a different name (e.g. start as boot.cold, end as boot.warm).
 */
export function perfEnd(
  name: PerfTimerName,
  opts?: {
    id?: string;
    as?: PerfTimerName;
    labels?: Record<string, string | number | boolean>;
    /** Override warm/cold for budget selection (list.open). */
    warm?: boolean;
  },
): { durationMs: number; verdict: PerfVerdict } | null {
  const key = markKey(name, opts?.id);
  const mark = active.get(key);
  if (!mark) return null;
  active.delete(key);

  const reportName = opts?.as ?? name;
  const durationMs = Date.now() - mark.startedAt;
  const budget = budgetFor(reportName, { warm: opts?.warm });
  const verdict = verdictFor(durationMs, budget);
  const labels = { ...mark.labels, ...opts?.labels, verdict };

  getMetrics().timing(`perf.${reportName}`, durationMs, labels);

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const budgetHint = budget
      ? ` target≤${budget.targetMs}ms warn≤${budget.warningMs}ms`
      : "";
    const tag =
      verdict === "ok" ? "OK" : verdict === "warning" ? "WARN" : "OVER";
    console.info(
      `[perf] ${tag} ${reportName} ${durationMs}ms${budgetHint}`,
      labels,
    );
  }

  return { durationMs, verdict };
}

/** Whether a boot paint used persisted query/cache data (heuristic for warm path). */
export function classifyBootWarm(opts: {
  listsFromCache: boolean;
  meFromCache: boolean;
}): "boot.warm" | "boot.cold" {
  return opts.listsFromCache || opts.meFromCache ? "boot.warm" : "boot.cold";
}
