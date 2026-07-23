import type { AiProposalSource, User } from "@prisma/client";

import { requirePlatformAdmin } from "@/lib/authorize";
import {
  AI_CREDIT_COSTS,
  getFreeMonthlyLimit,
  getPeriodStart,
} from "@/lib/aiCredits";
import { entitlementFromSubscription } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

import type {
  PlatformAiInsightsResponse,
  PlatformAiInsightsRow,
  PlatformAiInsightsWorkspace,
} from "./schemas";

const QUICK_AI_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const LEVEL_RANK = { high: 0, medium: 1, low: 2 } as const;

function previousPeriodStart(periodStart: Date): Date {
  return new Date(
    Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() - 1, 1),
  );
}

function accountAgeDays(createdAt: Date, now: Date): number {
  const ms = Math.max(0, now.getTime() - createdAt.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function rawAttentionScore(input: {
  ownedWorkspaceCount: number;
  aiCreditsUsedThisMonth: number;
  workspacesCreatedLast30Days: number;
  quickAiAfterCreateCount: number;
}): number {
  return (
    input.ownedWorkspaceCount * 5 +
    input.aiCreditsUsedThisMonth +
    input.workspacesCreatedLast30Days * 10 +
    input.quickAiAfterCreateCount * 25
  );
}

function toAttentionLevel(raw: number): PlatformAiInsightsRow["attentionLevel"] {
  if (raw >= 40) return "high";
  if (raw >= 15) return "medium";
  return "low";
}

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function parseQuery(raw: string | null | undefined): string {
  return raw?.trim().toLowerCase() ?? "";
}

function rowMatchesQuery(
  row: Pick<PlatformAiInsightsRow, "email" | "workspaces">,
  q: string,
): boolean {
  if (!q) return true;
  if (row.email.toLowerCase().includes(q)) return true;
  return row.workspaces.some((ws) => ws.name.toLowerCase().includes(q));
}

/** Credit-equivalent of applied AI runs (works for Free and Premium). */
function accumulateAppliedCredits(
  rows: Array<{
    workspaceId: string;
    source: AiProposalSource;
    _count: { _all: number };
  }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const cost = AI_CREDIT_COSTS[row.source] * row._count._all;
    map.set(row.workspaceId, (map.get(row.workspaceId) ?? 0) + cost);
  }
  return map;
}

/**
 * Read-only AI Insights for Platform Console.
 * Attention level is a review hint (sort key), not an abuse verdict.
 */
export async function getAiInsights(
  user: User,
  options?: { limit?: string | null; q?: string | null },
): Promise<PlatformAiInsightsResponse> {
  requirePlatformAdmin(user);

  const now = new Date();
  const limit = parseLimit(options?.limit ?? null);
  const q = parseQuery(options?.q);
  const periodStart = getPeriodStart(now);
  const lastPeriodStart = previousPeriodStart(periodStart);
  const createdSince30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const freeLimit = getFreeMonthlyLimit();

  const ownedMemberships = await prisma.workspaceMember.findMany({
    where: { role: "owner" },
    select: {
      userId: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          createdByUserId: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              stripeCustomerId: true,
              stripeSubscriptionId: true,
            },
          },
          _count: {
            select: {
              lists: { where: { status: { not: "deleted" } } },
            },
          },
        },
      },
    },
  });

  if (ownedMemberships.length === 0) {
    return {
      periodStart: periodStart.toISOString(),
      freeCreditLimit: freeLimit,
      rows: [],
    };
  }

  const workspaceIds = [...new Set(ownedMemberships.map((m) => m.workspaceId))];
  const userIds = [...new Set(ownedMemberships.map((m) => m.userId))];

  const [
    users,
    pushDevices,
    usageRows,
    runGroups,
    firstRuns,
    createdLast30d,
    appliedCreditsThisMonth,
    runsThisMonth,
    runsLastMonth,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.pushDevice.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, lastSeenAt: true },
    }),
    prisma.aIUsage.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        periodStart,
      },
      select: { workspaceId: true, aiCreditsUsed: true },
    }),
    prisma.aiProposalRun.groupBy({
      by: ["workspaceId"],
      where: { workspaceId: { in: workspaceIds } },
      _count: { _all: true },
    }),
    prisma.aiProposalRun.groupBy({
      by: ["workspaceId"],
      where: { workspaceId: { in: workspaceIds } },
      _min: { createdAt: true },
    }),
    prisma.workspace.groupBy({
      by: ["createdByUserId"],
      where: {
        createdByUserId: { in: userIds },
        createdAt: { gte: createdSince30d },
      },
      _count: { _all: true },
    }),
    prisma.aiProposalRun.groupBy({
      by: ["workspaceId", "source"],
      where: {
        workspaceId: { in: workspaceIds },
        createdAt: { gte: periodStart },
        status: "applied",
      },
      _count: { _all: true },
    }),
    prisma.aiProposalRun.groupBy({
      by: ["workspaceId"],
      where: {
        workspaceId: { in: workspaceIds },
        createdAt: { gte: periodStart },
      },
      _count: { _all: true },
    }),
    prisma.aiProposalRun.groupBy({
      by: ["workspaceId"],
      where: {
        workspaceId: { in: workspaceIds },
        createdAt: { gte: lastPeriodStart, lt: periodStart },
      },
      _count: { _all: true },
    }),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const lastSeenByUser = new Map<string, Date>();
  for (const u of users) {
    lastSeenByUser.set(u.id, u.updatedAt);
  }
  for (const d of pushDevices) {
    const prev = lastSeenByUser.get(d.userId);
    if (!prev || d.lastSeenAt.getTime() > prev.getTime()) {
      lastSeenByUser.set(d.userId, d.lastSeenAt);
    }
  }

  /** Free-plan meter (progress bars). Premium workspaces do not increment this. */
  const freeMeterByWs = new Map(
    usageRows.map((r) => [r.workspaceId, r.aiCreditsUsed]),
  );
  /** Credit-equivalent of applied runs — Insights KPI (Free + Premium). */
  const appliedCreditsByWs = accumulateAppliedCredits(appliedCreditsThisMonth);
  const lifetimeByWs = new Map(
    runGroups.map((r) => [r.workspaceId, r._count._all]),
  );
  const thisMonthByWs = new Map(
    runsThisMonth.map((r) => [r.workspaceId, r._count._all]),
  );
  const lastMonthByWs = new Map(
    runsLastMonth.map((r) => [r.workspaceId, r._count._all]),
  );
  const firstRunByWs = new Map(
    firstRuns.map((r) => [r.workspaceId, r._min.createdAt]),
  );
  const created30dByUser = new Map(
    createdLast30d.map((r) => [r.createdByUserId, r._count._all]),
  );

  type OwnedWs = (typeof ownedMemberships)[number]["workspace"];
  const ownedByUser = new Map<string, OwnedWs[]>();
  for (const m of ownedMemberships) {
    const list = ownedByUser.get(m.userId) ?? [];
    list.push(m.workspace);
    ownedByUser.set(m.userId, list);
  }

  const scored: Array<PlatformAiInsightsRow & { raw: number }> = [];

  for (const [userId, workspaces] of ownedByUser) {
    const dbUser = userById.get(userId);
    if (!dbUser) continue;

    const workspaceRows: PlatformAiInsightsWorkspace[] = [];
    let aiCreditsUsedThisMonth = 0;
    let aiRequestsThisMonth = 0;
    let aiRequestsLastMonth = 0;
    let aiRequestsLifetime = 0;
    let quickAiAfterCreateCount = 0;

    for (const ws of workspaces) {
      const isPremium = entitlementFromSubscription(
        ws.subscription,
        now,
      ).isPremium;
      const meterUsed = freeMeterByWs.get(ws.id) ?? 0;
      const appliedCredits = appliedCreditsByWs.get(ws.id) ?? 0;
      const requestsThisMonth = thisMonthByWs.get(ws.id) ?? 0;
      const requestsLastMonth = lastMonthByWs.get(ws.id) ?? 0;
      const requestsLifetime = lifetimeByWs.get(ws.id) ?? 0;
      const firstAiAt = firstRunByWs.get(ws.id) ?? null;

      // KPI: real consumption (applied × costs), including Premium.
      aiCreditsUsedThisMonth += appliedCredits;
      aiRequestsThisMonth += requestsThisMonth;
      aiRequestsLastMonth += requestsLastMonth;
      aiRequestsLifetime += requestsLifetime;

      if (
        firstAiAt &&
        firstAiAt.getTime() - ws.createdAt.getTime() >= 0 &&
        firstAiAt.getTime() - ws.createdAt.getTime() <= QUICK_AI_MS
      ) {
        quickAiAfterCreateCount += 1;
      }

      workspaceRows.push({
        id: ws.id,
        name: ws.name,
        isPremium,
        // Progress bar: free meter from AIUsage; Premium → unlimited UI.
        creditsUsed: isPremium ? 0 : meterUsed,
        creditLimit: isPremium ? null : freeLimit,
        requestsThisMonth,
        listCount: ws._count.lists,
      });
    }

    workspaceRows.sort((a, b) => a.name.localeCompare(b.name));

    const ownedWorkspaceCount = workspaces.length;
    const workspacesCreatedLast30Days = created30dByUser.get(userId) ?? 0;
    const raw = rawAttentionScore({
      ownedWorkspaceCount,
      aiCreditsUsedThisMonth,
      workspacesCreatedLast30Days,
      quickAiAfterCreateCount,
    });

    const lastSeen = lastSeenByUser.get(userId) ?? dbUser.updatedAt;

    scored.push({
      userId,
      email: dbUser.email,
      accountAgeDays: accountAgeDays(dbUser.createdAt, now),
      lastSeenAt: lastSeen.toISOString(),
      ownedWorkspaceCount,
      workspacesCreatedLast30Days,
      aiCreditsUsedThisMonth,
      aiRequestsThisMonth,
      aiRequestsLastMonth,
      aiRequestsLifetime,
      quickAiAfterCreateCount,
      attentionLevel: toAttentionLevel(raw),
      workspaces: workspaceRows,
      raw,
    });
  }

  scored.sort((a, b) => {
    const rankDiff =
      LEVEL_RANK[a.attentionLevel] - LEVEL_RANK[b.attentionLevel];
    if (rankDiff !== 0) return rankDiff;
    if (b.raw !== a.raw) return b.raw - a.raw;
    return a.email.localeCompare(b.email);
  });

  const filtered = q ? scored.filter((row) => rowMatchesQuery(row, q)) : scored;

  const rows: PlatformAiInsightsRow[] = filtered
    .slice(0, limit)
    .map(({ raw: _raw, ...row }) => row);

  return {
    periodStart: periodStart.toISOString(),
    freeCreditLimit: freeLimit,
    rows,
  };
}
