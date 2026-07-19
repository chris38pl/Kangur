import type { User } from "@prisma/client";

import {
  CAPACITY_SOURCE,
  MetricNames,
  PROVISIONAL_EVENTS_CAPACITY_RPS,
} from "@shared/metrics/names";
import { requirePlatformAdmin } from "@/lib/authorize";
import { getMemoryMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

import type { PlatformOverviewResponse } from "./schemas";

/**
 * Read-only platform snapshot for Platform Console Overview.
 * Sessions from DB; latency/RPS/headroom from in-process metrics (M13.5).
 */
export async function getPlatformOverview(
  user: User,
): Promise<PlatformOverviewResponse> {
  requirePlatformAdmin(user);

  const memory = getMemoryMetrics();
  const snap = memory.snapshot();

  const activeSessions = await prisma.shoppingSession.count({
    where: { finishedAt: null },
  });

  const eventsRps = snap.rps(MetricNames.costEventsRequests);
  const httpRps = snap.rps(MetricNames.httpRequests);
  const rps = eventsRps > 0 ? eventsRps : httpRps;

  const p95Ms =
    snap.p95(MetricNames.eventsListDurationMs) ??
    snap.p95(MetricNames.httpDurationMs);

  const estimatedRps =
    rps > 0
      ? rps
      : activeSessions > 0
        ? activeSessions / 5 // blended ~5s interval provisional estimate
        : 0;

  const capacity = PROVISIONAL_EVENTS_CAPACITY_RPS;
  const headroom =
    estimatedRps > 0 ? capacity / estimatedRps : activeSessions === 0 ? null : capacity;

  const errors = snap.counters[MetricNames.httpErrors] ?? 0;
  const requests = snap.counters[MetricNames.httpRequests] ?? 0;
  const errorRate = requests > 0 ? errors / requests : 0;
  const pollingOk =
    (p95Ms == null || p95Ms < 250) && errorRate < 0.01;

  let platformStatus: PlatformOverviewResponse["platformStatus"] = "healthy";
  let activeAlertCount = 0;

  if (p95Ms != null && p95Ms > 500) {
    platformStatus = "critical";
    activeAlertCount += 1;
  } else if (p95Ms != null && p95Ms > 250) {
    platformStatus = "warning";
    activeAlertCount += 1;
  }

  if (headroom != null && headroom < 2) {
    platformStatus = "critical";
    activeAlertCount += 1;
  } else if (headroom != null && headroom < 5) {
    if (platformStatus === "healthy") platformStatus = "warning";
    activeAlertCount += 1;
  }

  if (!pollingOk && platformStatus === "healthy") {
    platformStatus = "warning";
    activeAlertCount += 1;
  }

  // capacity_source documented for ops; not part of response schema yet
  void CAPACITY_SOURCE;

  return {
    platformStatus,
    activeAlertCount,
    activeSessions,
    rps: Math.round(estimatedRps * 10) / 10,
    p95Ms: p95Ms != null ? Math.round(p95Ms) : null,
    headroom: headroom != null ? Math.round(headroom * 10) / 10 : null,
    pollingOk,
  };
}
