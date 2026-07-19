import type { MetricTags } from "@shared/metrics/tags";

export type { MetricTags };

/**
 * Application metrics contract.
 * Emit is always fire-and-forget — never await on hot paths; never gate business logic.
 */
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
    // Metrics must never break the app.
  }
}
