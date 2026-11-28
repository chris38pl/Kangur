import type {
  Notification,
  NotificationPayloadType,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SaveNotificationInput = {
  recipientUserId: string;
  actorUserId: string | null;
  workspaceId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  sourceId: string | null;
  payloadType: NotificationPayloadType;
  payloadSchemaVersion?: number;
  payload: Prisma.InputJsonValue;
};

function typeFilter(hiddenTypes: NotificationType[] | undefined) {
  return hiddenTypes && hiddenTypes.length > 0 ? { type: { notIn: hiddenTypes } } : {};
}

/** Pure persistence - no event side-effects. */
export const notificationRepository = {
  async save(input: SaveNotificationInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        recipientUserId: input.recipientUserId,
        actorUserId: input.actorUserId,
        workspaceId: input.workspaceId,
        type: input.type,
        title: input.title,
        body: input.body,
        sourceId: input.sourceId,
        payloadType: input.payloadType,
        payloadSchemaVersion: input.payloadSchemaVersion ?? 1,
        payload: input.payload,
        status: "UNREAD",
      },
    });
  },

  /** `hiddenTypes`: types the asking app does not know (lib/clientVersion.ts). */
  async listForUser(
    userId: string,
    options: { limit?: number; hiddenTypes?: NotificationType[] } = {},
  ) {
    return prisma.notification.findMany({
      where: {
        recipientUserId: userId,
        archivedAt: null,
        ...typeFilter(options.hiddenTypes),
      },
      orderBy: { createdAt: "desc" },
      take: options.limit ?? 50,
    });
  },

  /** Counts only what the app can show, or its badge would promise rows it hides. */
  async unreadCount(userId: string, options: { hiddenTypes?: NotificationType[] } = {}) {
    return prisma.notification.count({
      where: {
        recipientUserId: userId,
        archivedAt: null,
        status: "UNREAD",
        ...typeFilter(options.hiddenTypes),
      },
    });
  },

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientUserId: userId,
        archivedAt: null,
      },
      data: { status: "READ", readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        archivedAt: null,
        status: "UNREAD",
      },
      data: { status: "READ", readAt: new Date() },
    });
  },
};
