/** Telemetry hooks — stub only; no product analytics yet. */
export const syncTelemetry = {
  queueLength(_n: number) {},
  syncDuration(_ms: number) {},
  failedOps(_n: number) {},
  compressionRatio(_ratio: number) {},
  retryCount(_n: number) {},
};
