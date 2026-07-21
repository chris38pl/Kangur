import type { MetricTags } from "@shared/metrics/tags";

import type { Metrics } from "./types";
import { safeEmit } from "./types";

const HIST_CAP = 200;
const RPS_WINDOW_MS = 60_000;

type Store = {
  counters: Map<string, number>;
  gauges: Map<string, number>;
  histograms: Map<string, number[]>;
  /** Timestamps of recent increments for RPS estimation (per name). */
  ticks: Map<string, number[]>;
};

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? null;
}

/**
 * Process-local metrics for Platform Console / ops snapshots.
 * Zero network I/O - safe as a prod companion to Noop.
 */
export function createInMemoryMetrics(): Metrics & {
  snapshot: () => {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    p50: (name: string) => number | null;
    p95: (name: string) => number | null;
    mean: (name: string) => number | null;
    /** Fraction of histogram samples equal to 0 (e.g. empty event pages). */
    zeroRatio: (name: string) => number | null;
    rps: (name: string) => number;
  };
} {
  const store: Store = {
    counters: new Map(),
    gauges: new Map(),
    histograms: new Map(),
    ticks: new Map(),
  };

  const pushHist = (name: string, value: number) => {
    let arr = store.histograms.get(name);
    if (!arr) {
      arr = [];
      store.histograms.set(name, arr);
    }
    arr.push(value);
    if (arr.length > HIST_CAP) arr.splice(0, arr.length - HIST_CAP);
  };

  const tick = (name: string) => {
    const now = Date.now();
    let arr = store.ticks.get(name);
    if (!arr) {
      arr = [];
      store.ticks.set(name, arr);
    }
    arr.push(now);
    const cutoff = now - RPS_WINDOW_MS;
    while (arr.length > 0 && (arr[0] ?? 0) < cutoff) arr.shift();
  };

  const sortedHist = (name: string): number[] | null => {
    const arr = store.histograms.get(name);
    if (!arr || arr.length === 0) return null;
    return [...arr].sort((a, b) => a - b);
  };

  const metrics: Metrics & {
    snapshot: () => {
      counters: Record<string, number>;
      gauges: Record<string, number>;
      p50: (name: string) => number | null;
      p95: (name: string) => number | null;
      mean: (name: string) => number | null;
      zeroRatio: (name: string) => number | null;
      rps: (name: string) => number;
    };
  } = {
    increment(name, value = 1, _tags?: MetricTags) {
      safeEmit(() => {
        store.counters.set(name, (store.counters.get(name) ?? 0) + value);
        for (let i = 0; i < value; i += 1) tick(name);
      });
    },
    gauge(name, value, _tags?: MetricTags) {
      safeEmit(() => {
        store.gauges.set(name, value);
      });
    },
    histogram(name, value, _tags?: MetricTags) {
      safeEmit(() => {
        pushHist(name, value);
      });
    },
    timing(name, ms, tags?: MetricTags) {
      metrics.histogram(name, ms, tags);
    },
    snapshot() {
      const counters: Record<string, number> = {};
      for (const [k, v] of store.counters) counters[k] = v;
      const gauges: Record<string, number> = {};
      for (const [k, v] of store.gauges) gauges[k] = v;

      return {
        counters,
        gauges,
        p50(name: string) {
          const sorted = sortedHist(name);
          if (!sorted) return null;
          return percentile(sorted, 50);
        },
        p95(name: string) {
          const sorted = sortedHist(name);
          if (!sorted) return null;
          return percentile(sorted, 95);
        },
        mean(name: string) {
          const arr = store.histograms.get(name);
          if (!arr || arr.length === 0) return null;
          const sum = arr.reduce((a, b) => a + b, 0);
          return sum / arr.length;
        },
        zeroRatio(name: string) {
          const arr = store.histograms.get(name);
          if (!arr || arr.length === 0) return null;
          let zeros = 0;
          for (const v of arr) if (v === 0) zeros += 1;
          return zeros / arr.length;
        },
        rps(name: string) {
          const arr = store.ticks.get(name) ?? [];
          const now = Date.now();
          const cutoff = now - RPS_WINDOW_MS;
          const recent = arr.filter((t) => t >= cutoff);
          return recent.length / (RPS_WINDOW_MS / 1000);
        },
      };
    },
  };

  return metrics;
}

export type InMemoryMetrics = ReturnType<typeof createInMemoryMetrics>;
