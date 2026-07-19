import { createCompositeMetrics } from "./composite";
import { createConsoleMetrics } from "./console";
import { NoopMetrics } from "./noop";
import type { Metrics } from "./types";

let instance: Metrics | null = null;

/**
 * Mobile metrics singleton.
 * Prod / tests: Noop. DEV: Console (unless METRICS_DEBUG=0).
 */
export function getMetrics(): Metrics {
  if (instance) return instance;

  const debugOff =
    typeof process !== "undefined" &&
    process.env.EXPO_PUBLIC_METRICS_DEBUG === "0";

  if (typeof __DEV__ !== "undefined" && __DEV__ && !debugOff) {
    instance = createCompositeMetrics([
      NoopMetrics,
      createConsoleMetrics("[metrics:mobile]"),
    ]);
  } else {
    instance = NoopMetrics;
  }

  return instance;
}

/** Test / bootstrap override. */
export function setMetrics(metrics: Metrics): void {
  instance = metrics;
}

export type { Metrics } from "./types";
export { NoopMetrics } from "./noop";
export { createConsoleMetrics } from "./console";
export { createCompositeMetrics } from "./composite";
