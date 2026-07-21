/** Canonical metric names - shared between mobile and backend. */

export const MetricNames = {
  // Realtime (client)
  realtimeActivePollers: "realtime.active_pollers",
  realtimePollRequests: "realtime.poll.requests",
  realtimePollIntervalMs: "realtime.poll.interval_ms",
  realtimePollIntervalTierHot: "realtime.poll.interval_tier.hot",
  realtimePollIntervalTierWarm: "realtime.poll.interval_tier.warm",
  realtimePollIntervalTierCold: "realtime.poll.interval_tier.cold",
  realtimePollEmpty: "realtime.poll.empty",
  realtimePollWithEvents: "realtime.poll.with_events",
  realtimePollLatencyMs: "realtime.poll.latency_ms",
  realtimePollFailures: "realtime.poll.failures",
  realtimePollDrainCap: "realtime.poll.drain_cap",
  realtimeEventsDelivered: "realtime.events.delivered",
  realtimeEventsPerResponse: "realtime.events.per_response",
  realtimeRefreshRequests: "realtime.refresh.requests",
  realtimeRefreshDeferred: "realtime.refresh.deferred",
  realtimeRefreshCancelledOffline: "realtime.refresh.cancelled_offline",
  realtimePollNow: "realtime.pollnow",
  realtimeSeedingBatches: "realtime.seeding_batches",

  // Sync (client)
  syncQueueLength: "sync.queue_length",
  syncDurationMs: "sync.duration_ms",
  syncFailedOps: "sync.failed_ops",
  syncCompressionRatio: "sync.compression_ratio",
  syncRetryCount: "sync.retry_count",

  // Shopping / business (prefer server)
  shoppingSessionsActive: "shopping.sessions.active",
  shoppingSessionsStarted: "shopping.sessions.started",
  shoppingSessionsFinished: "shopping.sessions.finished",
  shoppingSessionDurationMs: "shopping.session.duration_ms",
  shoppingListsOpened: "shopping.lists.opened",
  aiImports: "ai.imports",
  aiApply: "ai.apply",
  shoppingItemsStatusBought: "shopping.items.status_bought",

  // Backend HTTP
  httpRequests: "http.requests",
  httpDurationMs: "http.duration_ms",
  httpErrors: "http.errors",
  httpPayloadBytes: "http.payload_bytes",
  dbQueryMs: "db.query_ms",
  eventsListDurationMs: "events.list.duration_ms",
  eventsListPageSize: "events.list.page_size",
  sessionStart: "session.start",
  sessionFinish: "session.finish",

  // Cost proxies
  costEventsRequests: "cost.events.requests",
  costEventsBandwidthBytes: "cost.events.bandwidth_bytes",
  costEventsDbReads: "cost.events.db_reads",
} as const;

export type MetricName = (typeof MetricNames)[keyof typeof MetricNames];

/** Provisional events-endpoint capacity until load-test playbook (Future). */
export const PROVISIONAL_EVENTS_CAPACITY_RPS = 2500;
export const CAPACITY_SOURCE = "provisional" as const;
