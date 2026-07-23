/**
 * Performance budgets from the 1.0.1 perf audit (Fala 0).
 * Target = success; Warning = investigate; above warning = regression risk.
 */

export type PerfBudget = {
  targetMs: number;
  warningMs: number;
};

export const PERF_BUDGETS = {
  bootWarmCache: { targetMs: 1_000, warningMs: 2_000 },
  bootColdNetwork: { targetMs: 3_000, warningMs: 5_000 },
  homeData: { targetMs: 500, warningMs: 1_000 },
  listOpenWarm: { targetMs: 300, warningMs: 800 },
  aiApply80Items: { targetMs: 2_000, warningMs: 5_000 },
} as const satisfies Record<string, PerfBudget>;

export type PerfTimerName =
  | "boot.warm"
  | "boot.cold"
  | "home.data"
  | "list.open"
  | "ai.ingest"
  | "ai.apply";

export function budgetFor(
  name: PerfTimerName,
  opts?: { warm?: boolean },
): PerfBudget | null {
  switch (name) {
    case "boot.warm":
      return PERF_BUDGETS.bootWarmCache;
    case "boot.cold":
      return PERF_BUDGETS.bootColdNetwork;
    case "home.data":
      return PERF_BUDGETS.homeData;
    case "list.open":
      return opts?.warm === false
        ? { targetMs: 1_000, warningMs: 2_500 }
        : PERF_BUDGETS.listOpenWarm;
    case "ai.apply":
      return PERF_BUDGETS.aiApply80Items;
    case "ai.ingest":
      return { targetMs: 15_000, warningMs: 30_000 };
    default:
      return null;
  }
}

export type PerfVerdict = "ok" | "warning" | "over";

export function verdictFor(
  durationMs: number,
  budget: PerfBudget | null,
): PerfVerdict {
  if (!budget) return "ok";
  if (durationMs <= budget.targetMs) return "ok";
  if (durationMs <= budget.warningMs) return "warning";
  return "over";
}
