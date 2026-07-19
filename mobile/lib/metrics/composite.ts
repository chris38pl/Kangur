import type { MetricTags } from "@shared/metrics/tags";

import type { Metrics } from "./types";
import { safeEmit } from "./types";

export function createCompositeMetrics(sinks: Metrics[]): Metrics {
  return {
    increment(name, value = 1, tags?: MetricTags) {
      for (const s of sinks) {
        safeEmit(() => s.increment(name, value, tags));
      }
    },
    gauge(name, value, tags?: MetricTags) {
      for (const s of sinks) {
        safeEmit(() => s.gauge(name, value, tags));
      }
    },
    histogram(name, value, tags?: MetricTags) {
      for (const s of sinks) {
        safeEmit(() => s.histogram(name, value, tags));
      }
    },
    timing(name, ms, tags?: MetricTags) {
      for (const s of sinks) {
        safeEmit(() => s.timing(name, ms, tags));
      }
    },
  };
}
