/** Low-cardinality tag helpers for metrics. */

export type MetricTags = Record<string, string | number | boolean | undefined>;

export type IntervalTier = "hot" | "warm" | "cold";

export function statusClass(status: number): "2xx" | "4xx" | "5xx" | "other" {
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 400 && status < 500) return "4xx";
  if (status >= 500) return "5xx";
  return "other";
}

export function intervalTierFromMs(ms: number): IntervalTier {
  if (ms <= 3500) return "hot";
  if (ms <= 6000) return "warm";
  return "cold";
}

/** Strip undefined tags; keep only string/number/boolean values. */
export function sanitizeTags(tags?: MetricTags): Record<string, string> {
  if (!tags) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tags)) {
    if (v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}
