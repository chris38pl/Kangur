const DEFAULT_CAP = 30;

/**
 * In-memory rolling buffers for Platform Console KPI sparklines.
 * Client-only presentation history - not persisted, not fabricated.
 */
export type MetricHistoryKey =
  | "activeSessions"
  | "rps"
  | "p95Ms"
  | "headroom"
  | "rt.activePollers"
  | "rt.pollRps"
  | "rt.p50Ms"
  | "rt.p95Ms"
  | "rt.emptyRatio"
  | "rt.failures"
  | "rt.timeouts"
  | "rt.eventsPerSec"
  | "rt.eventsPerResponse";

type HistoryStore = Record<MetricHistoryKey, number[]>;

const store: HistoryStore = {
  activeSessions: [],
  rps: [],
  p95Ms: [],
  headroom: [],
  "rt.activePollers": [],
  "rt.pollRps": [],
  "rt.p50Ms": [],
  "rt.p95Ms": [],
  "rt.emptyRatio": [],
  "rt.failures": [],
  "rt.timeouts": [],
  "rt.eventsPerSec": [],
  "rt.eventsPerResponse": [],
};

function push(key: MetricHistoryKey, value: number, cap = DEFAULT_CAP) {
  if (!Number.isFinite(value)) return;
  const arr = store[key];
  arr.push(value);
  while (arr.length > cap) arr.shift();
}

export function recordOverviewSample(sample: {
  activeSessions: number | null;
  rps: number | null;
  p95Ms: number | null;
  headroom: number | null;
}): void {
  if (sample.activeSessions != null) {
    push("activeSessions", sample.activeSessions);
  }
  if (sample.rps != null) push("rps", sample.rps);
  if (sample.p95Ms != null) push("p95Ms", sample.p95Ms);
  if (sample.headroom != null) push("headroom", sample.headroom);
}

export function recordRealtimeSample(
  sample: Partial<Record<MetricHistoryKey, number | null>>,
): void {
  for (const [key, value] of Object.entries(sample) as [
    MetricHistoryKey,
    number | null,
  ][]) {
    if (value != null) push(key, value);
  }
}

export function getMetricHistory(key: MetricHistoryKey): number[] {
  return [...store[key]];
}

/** Test helper */
export function clearMetricHistory(): void {
  for (const key of Object.keys(store) as MetricHistoryKey[]) {
    store[key] = [];
  }
}
