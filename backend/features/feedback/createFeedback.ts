import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { CreateFeedbackBody, FeedbackDTO } from "./schemas";
import { toFeedbackDto } from "./toFeedbackDto";

const METADATA_VERSION = 1;

/**
 * Creates immutable feedback. Content cannot be updated after insert.
 * metadataVersion is always set server-side.
 */
export async function createFeedback(
  user: User,
  input: CreateFeedbackBody,
): Promise<FeedbackDTO> {
  const row = await prisma.feedback.create({
    data: {
      type: input.type,
      title: input.title,
      description: input.description,
      language: input.language,
      attachmentKey: input.attachmentKey ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      userId: user.id,
      metadataVersion: METADATA_VERSION,
      appVersion: input.appVersion ?? null,
      buildNumber: input.buildNumber ?? null,
      platform: input.platform ?? null,
      deviceModel: input.deviceModel ?? null,
      osVersion: input.osVersion ?? null,
      environment: input.environment ?? null,
      apiBaseUrl: input.apiBaseUrl ?? null,
      workspaceId: input.workspaceId ?? null,
      listId: input.listId ?? null,
      shoppingSessionId: input.shoppingSessionId ?? null,
      route: input.route ?? null,
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  console.info("[feedback]", "Created", {
    id: row.id,
    type: row.type,
    userId: user.id,
  });

  return toFeedbackDto(row);
}
