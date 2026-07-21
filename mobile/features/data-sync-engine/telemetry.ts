import { MetricNames } from "@shared/metrics/names";

import { getMetrics } from "@/lib/metrics";

/**
 * Telemetry hooks for DataSyncEngine - routes through Metrics facade.
 * Call sites unchanged; Noop in prod unless DEV Console is enabled.
 */
export const syncTelemetry = {
  queueLength(n: number) {
    getMetrics().gauge(MetricNames.syncQueueLength, n);
  },
  syncDuration(ms: number) {
    getMetrics().timing(MetricNames.syncDurationMs, ms);
  },
  failedOps(n: number) {
    getMetrics().gauge(MetricNames.syncFailedOps, n);
  },
  compressionRatio(ratio: number) {
    getMetrics().histogram(MetricNames.syncCompressionRatio, ratio);
  },
  retryCount(n: number) {
    getMetrics().increment(MetricNames.syncRetryCount, n);
  },
};
