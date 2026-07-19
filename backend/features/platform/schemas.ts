import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const PlatformStatusSchema = z
  .enum(["healthy", "warning", "critical"])
  .openapi("PlatformStatus");

/** Shell overview — metrics filled by M13.5; status is the primary glance. */
export const PlatformOverviewResponseSchema = z
  .object({
    platformStatus: PlatformStatusSchema,
    activeAlertCount: z.number().int().nonnegative(),
    activeSessions: z.number().int().nonnegative().nullable(),
    rps: z.number().nonnegative().nullable(),
    p95Ms: z.number().nonnegative().nullable(),
    headroom: z.number().nonnegative().nullable(),
    pollingOk: z.boolean().nullable(),
  })
  .openapi("PlatformOverviewResponse");

export type PlatformOverviewResponse = z.infer<
  typeof PlatformOverviewResponseSchema
>;

const NullableNumber = z.number().nullable();

/**
 * Realtime diagnostics (M13.6).
 * Server-side proxies from in-process metrics + DB sessions.
 * Client-only KPIs (tiers, refresh, sync, drain…) stay null until ingest.
 */
export const PlatformRealtimeResponseSchema = z
  .object({
    systemStatus: z.enum(["healthy", "warning", "degraded"]),
    autoRefreshSec: z.number().int().positive(),
    polling: z.object({
      /** Proxy: open shopping sessions until client poller gauge is ingested. */
      activePollers: NullableNumber,
      pollRequestsPerSec: NullableNumber,
      p50Ms: NullableNumber,
      p95Ms: NullableNumber,
      emptyPollRatio: NullableNumber,
      failuresPerSec: NullableNumber,
      timeoutsPerSec: NullableNumber,
      lastErrorAgeSec: NullableNumber,
      lastErrorKind: z.string().nullable(),
      intervalDistribution: z.object({
        available: z.boolean(),
        hotShare: NullableNumber,
        warmShare: NullableNumber,
        coldShare: NullableNumber,
        hotCount: NullableNumber,
        warmCount: NullableNumber,
        coldCount: NullableNumber,
      }),
    }),
    events: z.object({
      eventsPerSec: NullableNumber,
      eventsPerResponse: NullableNumber,
      drainCapHits: NullableNumber,
      seedingBatches: NullableNumber,
      pollNowCount: NullableNumber,
    }),
    refresh: z.object({
      requests: NullableNumber,
      deferred: NullableNumber,
      offlineCancelled: NullableNumber,
      avgDelayMs: NullableNumber,
    }),
    sync: z.object({
      pendingQueue: NullableNumber,
      successRate: NullableNumber,
      retryCount: NullableNumber,
      failedOps: NullableNumber,
    }),
  })
  .openapi("PlatformRealtimeResponse");

export type PlatformRealtimeResponse = z.infer<
  typeof PlatformRealtimeResponseSchema
>;
