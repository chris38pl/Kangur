import type { AiProposalSource, Prisma } from "@prisma/client";

import { ApiError } from "@/lib/auth/errors";
import { getWorkspaceEntitlement } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

export const AI_CREDIT_COSTS: Record<AiProposalSource, number> = {
  text: 1,
  clipboard: 1,
  screenshot: 2,
  history: 3,
  /** Flat cost per meal-proposal run (1 or 2 dishes). */
  meal: 2,
};

export function getFreeMonthlyLimit(): number {
  const raw = process.env.AI_FREE_MONTHLY_CREDITS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 30;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
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

export function insufficientCredits(message = "Insufficient AI Credits."): ApiError {
  return new ApiError("INSUFFICIENT_CREDITS", message, 402);
}

export async function getAiCreditsBalance(
  workspaceId: string,
): Promise<AiCreditsBalance> {
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
    throw insufficientCredits(
      `Not enough AI Credits. Need ${cost}, have ${balance.remaining ?? 0}.`,
    );
  }
}

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
