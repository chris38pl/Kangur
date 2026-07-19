import { NextResponse } from "next/server";

import { ShoppingEventListResponseSchema } from "@/features/shopping-item/schemas";
import { listShoppingEvents } from "@/features/shopping-item/listShoppingEvents";
import { ApiError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { getMetrics } from "@/lib/metrics";
import { withHttpMetrics } from "@/lib/metrics/http-middleware";
import { MetricNames } from "@shared/metrics/names";

type RouteContext = {
  params: Promise<{ listId: string }>;
};

async function handleGet(request: Request, context: RouteContext) {
  const metrics = getMetrics();
  const started = Date.now();
  try {
    const { listId } = await context.params;
    const { user } = await requireUser(request);
    const after = new URL(request.url).searchParams.get("after");

    const result = await listShoppingEvents({
      listId,
      userId: user.id,
      after,
    });

    const duration = Date.now() - started;
    const pageSize = result.events?.length ?? 0;

    metrics.timing(MetricNames.eventsListDurationMs, duration);
    metrics.histogram(MetricNames.eventsListPageSize, pageSize);
    metrics.increment(MetricNames.costEventsRequests);
    metrics.increment(MetricNames.costEventsDbReads);

    const body = ShoppingEventListResponseSchema.parse(result);
    const json = JSON.stringify(body);
    metrics.histogram(MetricNames.httpPayloadBytes, json.length, {
      route: "lists.events",
    });
    metrics.increment(MetricNames.costEventsBandwidthBytes, json.length);

    return new NextResponse(json, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    metrics.timing(MetricNames.eventsListDurationMs, Date.now() - started);
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    console.error("[shopping-event]", "ListFailed", error);
    return NextResponse.json(
      { code: "INVALID_TOKEN", message: "Unable to authenticate request." },
      { status: 401 },
    );
  }
}

export const GET = withHttpMetrics(
  "lists.events",
  handleGet as never,
  { trackPayload: false },
);
