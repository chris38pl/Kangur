import { createCompositeMetrics } from "./composite";
import { createConsoleMetrics } from "./console";
import { createInMemoryMetrics, type InMemoryMetrics } from "./memory";
import { NoopMetrics } from "./noop";
import type { Metrics } from "./types";

let instance: Metrics | null = null;
let memory: InMemoryMetrics | null = null;

function build(): Metrics {
  memory = createInMemoryMetrics();
  const sinks: Metrics[] = [memory, NoopMetrics];

  if (process.env.METRICS_DEBUG === "1") {
    sinks.push(createConsoleMetrics("[metrics:backend]"));
  }

  return createCompositeMetrics(sinks);
}

/**
 * Backend metrics singleton.
 * Always includes in-memory aggregator (Platform Console).
 * Console logging only when METRICS_DEBUG=1.
 */
export function getMetrics(): Metrics {
  if (!instance) instance = build();
  return instance;
}

export function getMemoryMetrics(): InMemoryMetrics {
  getMetrics();
  if (!memory) {
    memory = createInMemoryMetrics();
  }
  return memory;
}

export function setMetrics(metrics: Metrics): void {
  instance = metrics;
}

export type { Metrics } from "./types";
export { NoopMetrics } from "./noop";
export { createConsoleMetrics } from "./console";
export { createCompositeMetrics } from "./composite";
export { createInMemoryMetrics } from "./memory";
