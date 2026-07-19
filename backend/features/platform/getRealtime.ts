import type { User } from "@prisma/client";

import { MetricNames } from "@shared/metrics/names";
import { requirePlatformAdmin } from "@/lib/authorize";
import { getMemoryMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

import type { PlatformRealtimeResponse } from "./schemas";

const AUTO_REFRESH_SEC = 15;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Read-only Realtime diagnostics for Platform Console (M13.6).
 * Uses server in-memory metrics + open sessions as poller proxy.
 * Client-emitted KPIs remain null until a future metrics ingest path.
 */
export async function getPlatformRealtime(
  user: User,
): Promise<PlatformRealtimeResponse> {
  requirePlatformAdmin(user);

  const snap = getMemoryMetrics().snapshot();

  const activeSessions = await prisma.shoppingSession.count({
    where: { finishedAt: null },
  });

  const eventsRps = snap.rps(MetricNames.costEventsRequests);
  const httpRps = snap.rps(MetricNames.httpRequests);
  const pollRequestsPerSec = eventsRps > 0 ? eventsRps : httpRps > 0 ? httpRps : null;

  const durationName = MetricNames.eventsListDurationMs;
  const p50Ms =
    snap.p50(durationName) ?? snap.p50(MetricNames.httpDurationMs);
  const p95Ms =
    snap.p95(durationName) ?? snap.p95(MetricNames.httpDurationMs);

  const emptyPollRatio = snap.zeroRatio(MetricNames.eventsListPageSize);
  const eventsPerResponse = snap.mean(MetricNames.eventsListPageSize);
  const failuresPerSec = snap.rps(MetricNames.httpErrors);

  const errors = snap.counters[MetricNames.httpErrors] ?? 0;
  const requests = snap.counters[MetricNames.httpRequests] ?? 0;
  const errorRate = requests > 0 ? errors / requests : 0;

  let systemStatus: PlatformRealtimeResponse["systemStatus"] = "healthy";
  if (
    (p95Ms != null && p95Ms > 500) ||
    errorRate >= 0.05 ||
    (failuresPerSec != null && failuresPerSec > 1)
  ) {
    systemStatus = "degraded";
  } else if (
    (p95Ms != null && p95Ms > 250) ||
    errorRate >= 0.01 ||
    (emptyPollRatio != null && emptyPollRatio > 0.85)
  ) {
    systemStatus = "warning";
  }

  return {
    systemStatus,
    autoRefreshSec: AUTO_REFRESH_SEC,
    polling: {
      activePollers: activeSessions,
      pollRequestsPerSec:
        pollRequestsPerSec != null ? round1(pollRequestsPerSec) : null,
      p50Ms: p50Ms != null ? Math.round(p50Ms) : null,
      p95Ms: p95Ms != null ? Math.round(p95Ms) : null,
      emptyPollRatio:
        emptyPollRatio != null ? Math.round(emptyPollRatio * 1000) / 1000 : null,
      failuresPerSec: round1(failuresPerSec),
      timeoutsPerSec: null,
      lastErrorAgeSec: null,
      lastErrorKind: null,
      intervalDistribution: {
        available: false,
        hotShare: null,
        warmShare: null,
        coldShare: null,
        hotCount: null,
        warmCount: null,
        coldCount: null,
      },
    },
    events: {
      eventsPerSec:
        pollRequestsPerSec != null ? round1(pollRequestsPerSec) : null,
      eventsPerResponse:
        eventsPerResponse != null ? round1(eventsPerResponse) : null,
      drainCapHits: null,
      seedingBatches: null,
      pollNowCount: null,
    },
    refresh: {
      requests: null,
      deferred: null,
      offlineCancelled: null,
      avgDelayMs: null,
    },
    sync: {
      pendingQueue: null,
      successRate: null,
      retryCount: null,
      failedOps: null,
    },
  };
}
