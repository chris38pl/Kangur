import type { User } from "@prisma/client";

import { requirePlatformAdmin } from "@/lib/authorize";
import { notFound } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";

import type { FeedbackDTO } from "./schemas";
import { toFeedbackDto } from "./toFeedbackDto";

export async function getFeedback(
  user: User,
  feedbackId: string,
): Promise<FeedbackDTO> {
  requirePlatformAdmin(user);

  const row = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  if (!row) {
    throw notFound("Feedback not found.");
  }

  return toFeedbackDto(row);
}
