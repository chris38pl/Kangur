import type { NotificationType, Prisma } from "@prisma/client";

import { displayNameFromEmail } from "@/lib/displayName";
import type { DomainEvent } from "@/lib/events/DomainEventBus";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { prisma } from "@/lib/prisma";

import { notificationRepository } from "./notificationRepository";
import {
  getOrCreateNotificationPreferences,
  prefAllowsType,
} from "./preferences";

/**
 * NotificationHandler — logical steps (TODO extract later):
 * 1. RecipientResolver
 * 2. PreferenceFilter
 * 3. NotificationFactory (title/body/payload)
 * 4. Repository.save (pure)
 * 5. publish NotificationCreatedEvent
 */
export async function handleDomainEventForNotifications(
  event: DomainEvent,
): Promise<void> {
  if (event.type === "NotificationCreated") return;

  switch (event.type) {
    case "InvitationCreated":
      await handleInvitationCreated(event);
      break;
    case "ShoppingListCreated":
      await handleWorkspaceMembersEvent(event, {
        type: "SHOPPING_LIST_CREATED",
        sourceId: event.listId,
        payloadType: "LIST",
        payload: {
          listId: event.listId,
          listName: event.listName,
          listEmoji: event.listEmoji,
          itemCount: event.itemCount,
          actorDisplayName: event.actorDisplayName,
          workspaceId: event.workspaceId,
        },
        title: (locale) =>
          locale === "pl"
            ? `${event.actorDisplayName} utworzył(a) listę ${event.listName}`
            : `${event.actorDisplayName} created list ${event.listName}`,
        body: () => event.listName,
      });
      break;
    case "ShoppingListDeleted":
      await handleWorkspaceMembersEvent(event, {
        type: "SHOPPING_LIST_DELETED",
        sourceId: event.listId,
        payloadType: "WORKSPACE",
        payload: {
          listId: event.listId,
          listName: event.listName,
          listEmoji: event.listEmoji,
          actorDisplayName: event.actorDisplayName,
          workspaceId: event.workspaceId,
        },
        title: (locale) =>
          locale === "pl"
            ? `${event.actorDisplayName} usunął(a) listę ${event.listName}`
            : `${event.actorDisplayName} deleted list ${event.listName}`,
        body: () => event.listName,
      });
      break;
    case "ShoppingStarted":
      await handleWorkspaceMembersEvent(event, {
        type: "SHOPPING_STARTED",
        sourceId: event.sessionId,
        payloadType: "SHOPPING",
        payload: {
          listId: event.listId,
          listName: event.listName,
          listEmoji: event.listEmoji,
          sessionId: event.sessionId,
          screen: "shop",
          workspaceId: event.workspaceId,
          workspaceName: event.workspaceName,
          workspaceIcon: event.workspaceIcon,
          actorDisplayName: event.actorDisplayName,
        },
        title: (locale) =>
          locale === "pl"
            ? `${event.actorDisplayName} rozpoczął(a) zakupy`
            : `${event.actorDisplayName} started shopping`,
        body: () => event.listName,
      });
      break;
    case "ShoppingFinished":
      await handleWorkspaceMembersEvent(event, {
        type: "SHOPPING_FINISHED",
        sourceId: event.sessionId,
        payloadType: "SHOPPING",
        payload: {
          listId: event.listId,
          listName: event.listName,
          listEmoji: event.listEmoji,
          sessionId: event.sessionId,
          screen: "finish",
          unavailableCount: event.unavailableCount,
          boughtCount: event.boughtCount,
          itemCount: event.itemCount,
          workspaceId: event.workspaceId,
          workspaceName: event.workspaceName,
          workspaceIcon: event.workspaceIcon,
          actorDisplayName: event.actorDisplayName,
        },
        title: (locale) =>
          locale === "pl"
            ? `${event.actorDisplayName} zakończył(a) zakupy`
            : `${event.actorDisplayName} finished shopping`,
        body: (locale) => {
          if (event.unavailableCount <= 0) {
            return locale === "pl"
              ? "Wszystkie produkty kupione"
              : "All products purchased";
          }
          return locale === "pl"
            ? event.unavailableCount === 1
              ? "1 produkt był niedostępny"
              : `${event.unavailableCount} produkty były niedostępne`
            : event.unavailableCount === 1
              ? "1 product was unavailable"
              : `${event.unavailableCount} products were unavailable`;
        },
      });
      break;
    default:
      break;
  }
}

async function handleInvitationCreated(
  event: Extract<DomainEvent, { type: "InvitationCreated" }>,
): Promise<void> {
  const email = normalizeEmail(event.inviteeEmail);
  const invitee = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!invitee) return;

  // TODO PreferenceFilter / NotificationFactory extraction
  const prefs = await getOrCreateNotificationPreferences(invitee.id);
  if (!prefAllowsType(prefs, "WORKSPACE_INVITATION")) return;

  const locale = invitee.locale?.startsWith("pl") ? "pl" : "en";
  const title =
    locale === "pl"
      ? `${event.actorDisplayName} zaprosił Cię do przestrzeni ${event.workspaceName}`
      : `${event.actorDisplayName} invited you to ${event.workspaceName}`;
  const body =
    locale === "pl"
      ? "Dołącz, aby wspólnie tworzyć listy zakupów."
      : "Join to create shopping lists together.";

  await saveAndPublish({
    recipientUserId: invitee.id,
    actorUserId: event.actorUserId,
    workspaceId: event.workspaceId,
    type: "WORKSPACE_INVITATION",
    title,
    body,
    sourceId: event.invitationId,
    payloadType: "INVITE",
    payload: {
      invitationId: event.invitationId,
      workspaceId: event.workspaceId,
      workspaceName: event.workspaceName,
      workspaceIcon: event.workspaceIcon,
      actorDisplayName: event.actorDisplayName,
      token: event.rawToken,
    },
  });
}

async function handleWorkspaceMembersEvent(
  event: Extract<
    DomainEvent,
    | { type: "ShoppingListCreated" }
    | { type: "ShoppingListDeleted" }
    | { type: "ShoppingStarted" }
    | { type: "ShoppingFinished" }
  >,
  spec: {
    type: NotificationType;
    sourceId: string;
    payloadType: "LIST" | "SHOPPING" | "WORKSPACE";
    payload: Prisma.InputJsonValue;
    title: (locale: "pl" | "en") => string;
    body: (locale: "pl" | "en") => string;
  },
): Promise<void> {
  // TODO RecipientResolver extraction
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: event.workspaceId,
      userId: { not: event.actorUserId },
    },
    include: { user: true },
  });

  for (const member of members) {
    // TODO PreferenceFilter extraction
    const prefs = await getOrCreateNotificationPreferences(member.userId);
    if (!prefAllowsType(prefs, spec.type)) continue;

    // Dedup by type + sourceId for this recipient
    const existing = await prisma.notification.findFirst({
      where: {
        recipientUserId: member.userId,
        type: spec.type,
        sourceId: spec.sourceId,
        archivedAt: null,
      },
    });
    if (existing) continue;

    const locale = member.user.locale?.startsWith("pl") ? "pl" : "en";
    await saveAndPublish({
      recipientUserId: member.userId,
      actorUserId: event.actorUserId,
      workspaceId: event.workspaceId,
      type: spec.type,
      title: spec.title(locale),
      body: spec.body(locale),
      sourceId: spec.sourceId,
      payloadType: spec.payloadType,
      payload: spec.payload,
    });
  }
}

async function saveAndPublish(input: {
  recipientUserId: string;
  actorUserId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body: string;
  sourceId: string;
  payloadType: "INVITE" | "LIST" | "SHOPPING" | "WORKSPACE";
  payload: Prisma.InputJsonValue;
}): Promise<void> {
  const row = await notificationRepository.save(input);
  await domainEventBus.publish({
    type: "NotificationCreated",
    notificationId: row.id,
    recipientUserId: row.recipientUserId,
    title: row.title,
    body: row.body,
    payloadType: row.payloadType,
    payloadSchemaVersion: row.payloadSchemaVersion,
    payload: row.payload,
  });
}

export function registerNotificationHandler(): void {
  for (const type of [
    "InvitationCreated",
    "ShoppingListCreated",
    "ShoppingListDeleted",
    "ShoppingStarted",
    "ShoppingFinished",
  ] as const) {
    domainEventBus.subscribe(type, async (event) => {
      await handleDomainEventForNotifications(event);
    });
  }
}
