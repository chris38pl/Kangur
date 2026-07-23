import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const PlatformStatusSchema = z
  .enum(["healthy", "warning", "critical"])
  .openapi("PlatformStatus");

/** Shell overview - metrics filled by M13.5; status is the primary glance. */
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

export const AttentionLevelSchema = z
  .enum(["low", "medium", "high"])
  .openapi("AttentionLevel");

export const PlatformAiInsightsWorkspaceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    isPremium: z.boolean(),
    creditsUsed: z.number().int().nonnegative(),
    /** null when Premium (unlimited). */
    creditLimit: z.number().int().positive().nullable(),
    requestsThisMonth: z.number().int().nonnegative(),
    listCount: z.number().int().nonnegative(),
  })
  .openapi("PlatformAiInsightsWorkspace");

export const PlatformAiInsightsRowSchema = z
  .object({
    userId: z.string(),
    email: z.string().email(),
    accountAgeDays: z.number().int().nonnegative(),
    lastSeenAt: z.string().datetime(),
    ownedWorkspaceCount: z.number().int().nonnegative(),
    workspacesCreatedLast30Days: z.number().int().nonnegative(),
    aiCreditsUsedThisMonth: z.number().int().nonnegative(),
    aiRequestsThisMonth: z.number().int().nonnegative(),
    aiRequestsLastMonth: z.number().int().nonnegative(),
    aiRequestsLifetime: z.number().int().nonnegative(),
    quickAiAfterCreateCount: z.number().int().nonnegative(),
    attentionLevel: AttentionLevelSchema,
    workspaces: z.array(PlatformAiInsightsWorkspaceSchema),
  })
  .openapi("PlatformAiInsightsRow");

/** Read-only ops view — attentionLevel is a review hint, not an abuse verdict. */
export const PlatformAiInsightsResponseSchema = z
  .object({
    periodStart: z.string().datetime(),
    freeCreditLimit: z.number().int().positive(),
    rows: z.array(PlatformAiInsightsRowSchema),
  })
  .openapi("PlatformAiInsightsResponse");

export type PlatformAiInsightsWorkspace = z.infer<
  typeof PlatformAiInsightsWorkspaceSchema
>;
export type PlatformAiInsightsRow = z.infer<typeof PlatformAiInsightsRowSchema>;
export type PlatformAiInsightsResponse = z.infer<
  typeof PlatformAiInsightsResponseSchema
>;

export const PlatformWorkspacePlanFilterSchema = z
  .enum(["all", "free", "premium"])
  .openapi("PlatformWorkspacePlanFilter");

export const PlatformWorkspaceListItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    plan: z.enum(["free", "premium"]),
    memberCount: z.number().int().nonnegative(),
    ownerEmail: z.string().email().nullable(),
    createdAt: z.string().datetime(),
    lastUsedAt: z.string().datetime(),
  })
  .openapi("PlatformWorkspaceListItem");

export const PlatformWorkspaceListResponseSchema = z
  .object({
    workspaces: z.array(PlatformWorkspaceListItemSchema),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative(),
  })
  .openapi("PlatformWorkspaceListResponse");

export type PlatformWorkspaceListItem = z.infer<
  typeof PlatformWorkspaceListItemSchema
>;
export type PlatformWorkspaceListResponse = z.infer<
  typeof PlatformWorkspaceListResponseSchema
>;

/** Same shape as WorkspaceDTO with synthetic owner role for admin enter overlay. */
export const PlatformWorkspaceDetailResponseSchema = z
  .object({
    workspace: z.object({
      id: z.string(),
      name: z.string(),
      icon: z.string(),
      role: z.literal("owner"),
      isOwner: z.literal(true),
      memberCount: z.number().int().nonnegative(),
      plan: z.enum(["free", "premium"]),
      billingStatus: z.enum([
        "none",
        "active",
        "trialing",
        "past_due",
        "cancelled",
        "expired",
      ]),
      currentPeriodEnd: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
  })
  .openapi("PlatformWorkspaceDetailResponse");

export type PlatformWorkspaceDetailResponse = z.infer<
  typeof PlatformWorkspaceDetailResponseSchema
>;
