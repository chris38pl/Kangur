import type { AiProposalSource, Prisma } from "@prisma/client";

import { ApiError } from "@/lib/auth/errors";
import { getWorkspaceEntitlement } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

export const AI_CREDIT_COSTS: Record<AiProposalSource, number> = {
  text: 1,
  clipboard: 1,
  screenshot: 2,
  history: 3,
  /** Flat cost per meal-proposal run (1–5 dishes). */
  meal: 2,
};

/** Orphaned reserves (crash mid-request) auto-refund after this TTL. */
export const AI_CREDIT_HOLD_TTL_MS = 15 * 60 * 1000;

export function getFreeMonthlyLimit(): number {
  const raw = process.env.AI_FREE_MONTHLY_CREDITS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 15;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

/** First day of current UTC calendar month. */
export function getPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type AiCreditsBalance = {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  periodStart: string;
};

export function insufficientCredits(
  message = "Insufficient AI Credits.",
  details?: { needed: number; remaining: number },
): ApiError {
  return new ApiError("INSUFFICIENT_CREDITS", message, 402, details);
}

export async function getAiCreditsBalance(
  workspaceId: string,
): Promise<AiCreditsBalance> {
  await releaseExpiredAiCreditHolds(workspaceId);

  const periodStart = getPeriodStart();
  const { isPremium: unlimited } = await getWorkspaceEntitlement(workspaceId);

  if (unlimited) {
    return {
      used: 0,
      limit: null,
      remaining: null,
      unlimited: true,
      periodStart: periodStart.toISOString(),
    };
  }

  const usage = await prisma.aIUsage.findUnique({
    where: {
      workspaceId_periodStart: { workspaceId, periodStart },
    },
  });

  const used = usage?.aiCreditsUsed ?? 0;
  const limit = getFreeMonthlyLimit();

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    unlimited: false,
    periodStart: periodStart.toISOString(),
  };
}

export async function assertCanIngest(
  workspaceId: string,
  source: AiProposalSource,
): Promise<void> {
  const cost = AI_CREDIT_COSTS[source];
  const balance = await getAiCreditsBalance(workspaceId);
  if (balance.unlimited) return;
  if ((balance.remaining ?? 0) < cost) {
    const remaining = balance.remaining ?? 0;
    throw insufficientCredits(
      `Not enough AI Credits. Need ${cost}, have ${remaining}.`,
      { needed: cost, remaining },
    );
  }
}

async function releaseHold(
  holdId: string,
  options: { refund: boolean },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const hold = await tx.aiCreditHold.findUnique({ where: { id: holdId } });
    if (!hold || hold.releasedAt) return;

    await tx.aiCreditHold.update({
      where: { id: holdId },
      data: { releasedAt: new Date() },
    });

    if (options.refund && hold.amount > 0) {
      const periodStart = getPeriodStart(hold.createdAt);
      await tx.aIUsage.updateMany({
        where: {
          workspaceId: hold.workspaceId,
          periodStart,
          aiCreditsUsed: { gte: hold.amount },
        },
        data: { aiCreditsUsed: { decrement: hold.amount } },
      });
    }
  });
}

export async function releaseExpiredAiCreditHolds(
  workspaceId?: string,
): Promise<void> {
  const now = new Date();
  const expired = await prisma.aiCreditHold.findMany({
    where: {
      releasedAt: null,
      expiresAt: { lt: now },
      ...(workspaceId ? { workspaceId } : {}),
    },
    select: { id: true },
    take: 50,
  });
  for (const hold of expired) {
    await releaseHold(hold.id, { refund: true });
  }
}

/**
 * Atomically charge credits for an in-flight OpenAI call.
 * Caller must commit (no refund) or refund on failure / timeout.
 */
export async function reserveAiCredits(
  workspaceId: string,
  source: AiProposalSource,
): Promise<{ holdId: string | null }> {
  await releaseExpiredAiCreditHolds(workspaceId);

  const cost = AI_CREDIT_COSTS[source];
  if (cost <= 0) return { holdId: null };

  const { isPremium: unlimited } = await getWorkspaceEntitlement(workspaceId);
  if (unlimited) return { holdId: null };

  const periodStart = getPeriodStart();
  const limit = getFreeMonthlyLimit();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AI_CREDIT_HOLD_TTL_MS);

  return prisma.$transaction(async (tx) => {
    await tx.aIUsage.upsert({
      where: { workspaceId_periodStart: { workspaceId, periodStart } },
      create: {
        workspaceId,
        periodStart,
        aiCreditsUsed: 0,
      },
      update: {},
    });

    const updated = await tx.aIUsage.updateMany({
      where: {
        workspaceId,
        periodStart,
        aiCreditsUsed: { lte: limit - cost },
      },
      data: { aiCreditsUsed: { increment: cost } },
    });

    if (updated.count !== 1) {
      const usage = await tx.aIUsage.findUnique({
        where: { workspaceId_periodStart: { workspaceId, periodStart } },
      });
      const remaining = Math.max(0, limit - (usage?.aiCreditsUsed ?? 0));
      throw insufficientCredits(
        `Not enough AI Credits. Need ${cost}, have ${remaining}.`,
        { needed: cost, remaining },
      );
    }

    const hold = await tx.aiCreditHold.create({
      data: {
        workspaceId,
        amount: cost,
        source,
        expiresAt,
      },
    });

    return { holdId: hold.id };
  });
}

export async function commitAiCreditHold(holdId: string | null): Promise<void> {
  if (!holdId) return;
  await releaseHold(holdId, { refund: false });
}

export async function refundAiCreditHold(holdId: string | null): Promise<void> {
  if (!holdId) return;
  await releaseHold(holdId, { refund: true });
}

/**
 * Reserve → run → commit on success / refund on failure (OpenAI timeout, 5xx, etc.).
 */
export async function withReservedAiCredits<T>(
  workspaceId: string,
  source: AiProposalSource,
  fn: () => Promise<T>,
): Promise<T> {
  const { holdId } = await reserveAiCredits(workspaceId, source);
  try {
    const result = await fn();
    await commitAiCreditHold(holdId);
    return result;
  } catch (error) {
    await refundAiCreditHold(holdId);
    throw error;
  }
}

/** @deprecated Prefer withReservedAiCredits at ingest; kept for rare direct debit. */
export async function debitAiCredits(
  workspaceId: string,
  source: AiProposalSource,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const db = tx ?? prisma;
  const cost = AI_CREDIT_COSTS[source];
  if (cost <= 0) return;

  const { isPremium: unlimited } = await getWorkspaceEntitlement(workspaceId);
  if (unlimited) return;

  const periodStart = getPeriodStart();

  await db.aIUsage.upsert({
    where: {
      workspaceId_periodStart: { workspaceId, periodStart },
    },
    create: {
      workspaceId,
      periodStart,
      aiCreditsUsed: cost,
    },
    update: {
      aiCreditsUsed: { increment: cost },
    },
  });
}
