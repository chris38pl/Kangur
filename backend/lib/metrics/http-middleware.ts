import { MetricNames } from "@shared/metrics/names";
import { statusClass } from "@shared/metrics/tags";

import { getMetrics } from "./index";

type Handler = (
  request: Request,
  context: unknown,
) => Promise<Response> | Response;

/**
 * Wrap an App Router handler to emit http.* metrics (fire-and-forget).
 */
export function withHttpMetrics(
  routeLabel: string,
  handler: Handler,
  options?: { trackPayload?: boolean },
): Handler {
  return async (request, context) => {
    const metrics = getMetrics();
    const started = Date.now();
    const method = request.method;

    try {
      const response = await handler(request, context);
      const duration = Date.now() - started;
      const status = response.status;
      const sc = statusClass(status);

      metrics.increment(MetricNames.httpRequests, 1, {
        route: routeLabel,
        method,
        status_class: sc,
      });
      metrics.timing(MetricNames.httpDurationMs, duration, {
        route: routeLabel,
        method,
        status_class: sc,
      });

      if (status >= 500) {
        metrics.increment(MetricNames.httpErrors, 1, {
          route: routeLabel,
          method,
        });
      }

      if (options?.trackPayload) {
        const len = response.headers.get("content-length");
        if (len) {
          const bytes = Number(len);
          if (!Number.isNaN(bytes)) {
            metrics.histogram(MetricNames.httpPayloadBytes, bytes, {
              route: routeLabel,
            });
          }
        }
      }

      return response;
    } catch (error) {
      const duration = Date.now() - started;
      metrics.increment(MetricNames.httpRequests, 1, {
        route: routeLabel,
        method,
        status_class: "5xx",
      });
      metrics.increment(MetricNames.httpErrors, 1, {
        route: routeLabel,
        method,
      });
      metrics.timing(MetricNames.httpDurationMs, duration, {
        route: routeLabel,
        method,
        status_class: "5xx",
      });
      throw error;
    }
  };
}
