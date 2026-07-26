import type { Feedback, User } from "@prisma/client";

import type { FeedbackDTO } from "./schemas";

type FeedbackWithUser = Feedback & {
  user?: Pick<User, "id" | "email">;
};

/** Maps Prisma row → DTO. hasAttachment is derived — never stored. */
export function toFeedbackDto(row: FeedbackWithUser): FeedbackDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    language: row.language as FeedbackDTO["language"],
    attachmentKey: row.attachmentKey,
    attachmentUrl: row.attachmentUrl,
    hasAttachment: row.attachmentKey != null,
    status: row.status,
    adminNote: row.adminNote,
    userId: row.userId,
    ...(row.user
      ? { user: { id: row.user.id, email: row.user.email } }
      : {}),
    metadataVersion: row.metadataVersion,
    appVersion: row.appVersion,
    buildNumber: row.buildNumber,
    platform: row.platform,
    deviceModel: row.deviceModel,
    osVersion: row.osVersion,
    environment: row.environment,
    apiBaseUrl: row.apiBaseUrl,
    workspaceId: row.workspaceId,
    listId: row.listId,
    shoppingSessionId: row.shoppingSessionId,
    route: row.route,
    resolvedInVersion: row.resolvedInVersion,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
