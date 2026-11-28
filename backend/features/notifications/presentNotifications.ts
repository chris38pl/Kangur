import type {
  NotificationPayloadType,
  NotificationStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { clientSupports, type ClientVersion } from "@/lib/clientVersion";

import type { NotificationDTO } from "./schemas";

/**
 * App 1.0.8 accepts only the five types it was built with: one more breaks its whole
 * notification list. Newer types reach only apps that know them.
 */
export function hiddenNotificationTypes(client: ClientVersion): NotificationType[] {
  return clientSupports(client, "memberJoinedNotifications") ? [] : ["WORKSPACE_MEMBER_JOINED"];
}

export type NotificationRow = {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  body: string;
  actorUserId: string | null;
  workspaceId: string | null;
  sourceId: string | null;
  payloadType: NotificationPayloadType;
  payloadSchemaVersion: number;
  payload: Prisma.JsonValue;
  createdAt: Date;
  readAt: Date | null;
};

export function presentNotifications(
  rows: readonly NotificationRow[],
  client: ClientVersion,
): NotificationDTO[] {
  const hidden = new Set<NotificationType>(hiddenNotificationTypes(client));
  return rows
    .filter((row) => !hidden.has(row.type))
    .map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      title: row.title,
      body: row.body,
      actorUserId: row.actorUserId,
      workspaceId: row.workspaceId,
      sourceId: row.sourceId,
      payloadType: row.payloadType,
      payloadSchemaVersion: row.payloadSchemaVersion,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt?.toISOString() ?? null,
    }));
}
