import type { MetricTags } from "@shared/metrics/tags";

export type { MetricTags };

export interface Metrics {
  increment(name: string, value?: number, tags?: MetricTags): void;
  gauge(name: string, value: number, tags?: MetricTags): void;
  histogram(name: string, value: number, tags?: MetricTags): void;
  timing(name: string, ms: number, tags?: MetricTags): void;
}

export function safeEmit(fn: () => void): void {
  try {
    fn();
  } catch {
    // never throw
  }
}
