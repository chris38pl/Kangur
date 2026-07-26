import type { FeedbackStatus, FeedbackType, User } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { requirePlatformAdmin } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

import type { FeedbackListResponse } from "./schemas";
import { toFeedbackDto } from "./toFeedbackDto";

const PAGE_SIZE = 40;

const UNRESOLVED_STATUSES: FeedbackStatus[] = [
  "NEW",
  "TRIAGED",
  "IN_PROGRESS",
];

export type ListFeedbackInput = {
  status?: FeedbackStatus;
  type?: FeedbackType;
  unresolvedOnly?: boolean;
  cursor?: string;
};

export async function listFeedback(
  user: User,
  input: ListFeedbackInput = {},
): Promise<FeedbackListResponse> {
  requirePlatformAdmin(user);

  const where: Prisma.FeedbackWhereInput = {};

  if (input.unresolvedOnly) {
    where.status = { in: UNRESOLVED_STATUSES };
  } else if (input.status) {
    where.status = input.status;
  }

  if (input.type) {
    where.type = input.type;
  }

  const rows = await prisma.feedback.findMany({
    where,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: PAGE_SIZE + 1,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return {
    items: page.map(toFeedbackDto),
    nextCursor,
  };
}
