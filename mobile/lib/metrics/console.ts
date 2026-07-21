import { sanitizeTags, type MetricTags } from "@shared/metrics/tags";

import type { Metrics } from "./types";
import { safeEmit } from "./types";

/** DEV-only sink - never the production default. */
export function createConsoleMetrics(prefix = "[metrics]"): Metrics {
  const log = (
    kind: string,
    name: string,
    value: number,
    tags?: MetricTags,
  ) => {
    safeEmit(() => {
      const t = sanitizeTags(tags);
      const tagStr =
        Object.keys(t).length > 0 ? ` ${JSON.stringify(t)}` : "";
      console.info(prefix, kind, name, value, tagStr);
    });
  };

  return {
    increment(name, value = 1, tags) {
      log("inc", name, value, tags);
    },
    gauge(name, value, tags) {
      log("gauge", name, value, tags);
    },
    histogram(name, value, tags) {
      log("hist", name, value, tags);
    },
    timing(name, ms, tags) {
      log("timing", name, ms, tags);
    },
  };
}
