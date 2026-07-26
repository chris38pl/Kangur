import type { User } from "@prisma/client";

import { requirePlatformAdmin } from "@/lib/authorize";
import { notFound } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";

import type { FeedbackDTO, UpdateFeedbackBody } from "./schemas";
import { toFeedbackDto } from "./toFeedbackDto";

/**
 * Admin-only update. Strict allowlist: status + adminNote only.
 * Content (type/title/description/language/attachment*) is immutable.
 */
export async function updateFeedback(
  user: User,
  feedbackId: string,
  input: UpdateFeedbackBody,
): Promise<FeedbackDTO> {
  requirePlatformAdmin(user);

  const existing = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Feedback not found.");
  }

  const row = await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  console.info("[feedback]", "Updated", {
    id: row.id,
    status: row.status,
    by: user.id,
  });

  return toFeedbackDto(row);
}
