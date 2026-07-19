import type { Metrics } from "./types";

/** Zero I/O — default for production and tests. */
export const NoopMetrics: Metrics = {
  increment() {},
  gauge() {},
  histogram() {},
  timing() {},
};
