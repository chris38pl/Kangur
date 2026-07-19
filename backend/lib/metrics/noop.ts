import type { Metrics } from "./types";

export const NoopMetrics: Metrics = {
  increment() {},
  gauge() {},
  histogram() {},
  timing() {},
};
