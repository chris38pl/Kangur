import {
  clientSupports,
  normalizeClientVersion,
  type ClientFeature,
} from "@/lib/clientVersion";
import type { DomainEvent } from "@/lib/events/DomainEventBus";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { pushProvider } from "@/lib/notifications/PushProvider";
import { prisma } from "@/lib/prisma";

/** Notification types a device gets as a push only from this app version (PushDevice.appVersion). */
const PUSH_FEATURE_BY_TYPE: Partial<Record<string, ClientFeature>> = {
  WORKSPACE_MEMBER_JOINED: "memberJoinedNotifications",
};

export function deviceGetsPush(
  notificationType: string,
  appVersion: string | null,
): boolean {
  const feature = PUSH_FEATURE_BY_TYPE[notificationType];
  return !feature || clientSupports(normalizeClientVersion(appVersion), feature);
}

/**
 * Reacts to NotificationCreatedEvent only - never called from NotificationRepository.
 */
export async function handleNotificationCreated(
  event: Extract<DomainEvent, { type: "NotificationCreated" }>,
): Promise<void> {
  const devices = await prisma.pushDevice.findMany({
    where: {
      userId: event.recipientUserId,
      disabledAt: null,
    },
    select: { expoToken: true, appVersion: true },
  });

  const tokens = devices
    .filter((d) => deviceGetsPush(event.notificationType, d.appVersion))
    .map((d) => d.expoToken)
    .filter(Boolean);
  if (tokens.length === 0) return;

  const result = await pushProvider.send({
    tokens,
    title: event.title,
    body: event.body,
    data: {
      notificationId: event.notificationId,
      payloadType: event.payloadType,
      payloadSchemaVersion: event.payloadSchemaVersion,
      payload: event.payload,
    },
  });

  if (result.notRegisteredTokens.length > 0) {
    await prisma.pushDevice.updateMany({
      where: {
        expoToken: { in: result.notRegisteredTokens },
        disabledAt: null,
      },
      data: { disabledAt: new Date() },
    });
  }
}

export function registerPushHandler(): void {
  domainEventBus.subscribe("NotificationCreated", async (event) => {
    if (event.type !== "NotificationCreated") return;
    await handleNotificationCreated(event);
  });
}
