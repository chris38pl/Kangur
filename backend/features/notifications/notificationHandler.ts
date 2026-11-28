import type { NotificationType, Prisma } from "@prisma/client";

import type { DomainEvent } from "@/lib/events/DomainEventBus";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";
import { resolveDisplayName } from "@/lib/names/displayName";
import { nameWords } from "@/lib/names/words";
import { prisma } from "@/lib/prisma";
import { memberLabels, type MemberRow } from "@/features/workspace/presentMembers";

import { notificationRepository } from "./notificationRepository";
import {
  invitationText,
  listCreatedText,
  listDeletedText,
  memberJoinedText,
  shoppingFinishedText,
  shoppingStartedText,
  type NotificationText,
} from "./notificationText";
import {
  getOrCreateNotificationPreferences,
  prefAllowsType,
} from "./preferences";

/**
 * NotificationHandler - logical steps:
 * 1. RecipientResolver
 * 2. PreferenceFilter
 * 3. NotificationFactory (title/body/payload, per recipient: language and the actor's name)
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
      await notifyWorkspaceMembers(event, {
        type: "SHOPPING_LIST_CREATED",
        sourceId: event.listId,
        payloadType: "LIST",
        payload: {
          listId: event.listId,
          listName: event.listName,
          listEmoji: event.listEmoji,
          itemCount: event.itemCount,
          workspaceId: event.workspaceId,
        },
        text: (locale, workspaceName, actor) =>
          listCreatedText(locale, { workspaceName, actor, listName: event.listName }),
      });
      break;
    case "ShoppingListDeleted":
      await notifyWorkspaceMembers(event, {
        type: "SHOPPING_LIST_DELETED",
        sourceId: event.listId,
        payloadType: "WORKSPACE",
        payload: {
          listId: event.listId,
          listName: event.listName,
          listEmoji: event.listEmoji,
          workspaceId: event.workspaceId,
        },
        text: (locale, workspaceName, actor) =>
          listDeletedText(locale, { workspaceName, actor, listName: event.listName }),
      });
      break;
    case "ShoppingStarted":
      await notifyWorkspaceMembers(event, {
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
        },
        text: (locale, workspaceName, actor) =>
          shoppingStartedText(locale, { workspaceName, actor, listName: event.listName }),
      });
      break;
    case "ShoppingFinished":
      await notifyWorkspaceMembers(event, {
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
        },
        text: (locale, workspaceName, actor) =>
          shoppingFinishedText(locale, {
            workspaceName,
            actor,
            boughtCount: event.boughtCount,
            itemCount: event.itemCount,
          }),
      });
      break;
    case "WorkspaceMemberJoined":
      await handleMemberJoined(event);
      break;
    default:
      break;
  }
}

const PERSON_SELECT = {
  id: true,
  email: true,
  displayName: true,
  lastNameInitial: true,
  locale: true,
} as const;

type Person = MemberRow & { user: MemberRow["user"] & { locale: string | null } };

async function loadPeople(workspaceId: string): Promise<Person[]> {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: PERSON_SELECT } },
  });
}

/** Labels of one workspace in the language of each recipient, computed once per language. */
function labelsByLocale(people: readonly Person[]) {
  const cache = new Map<AppLocale, { labels: Map<string, string>; fallback: string }>();
  return (locale: AppLocale) => {
    let entry = cache.get(locale);
    if (!entry) {
      const words = nameWords(locale);
      entry = { labels: memberLabels(people, words), fallback: words.fallback };
      cache.set(locale, entry);
    }
    return entry;
  };
}

/** The actor as the recipient sees them; null when they have no name and the text leaves it out. */
function nameFor(
  people: readonly Person[],
  userId: string,
  labels: Map<string, string>,
): string | null {
  const person = people.find((p) => p.userId === userId);
  if (!person || resolveDisplayName(person.user) === null) return null;
  return labels.get(userId) ?? null;
}

async function alreadyNotified(
  recipientUserId: string,
  type: NotificationType,
  sourceId: string,
): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: { recipientUserId, type, sourceId, archivedAt: null },
    select: { id: true },
  });
  return Boolean(existing);
}

async function handleInvitationCreated(
  event: Extract<DomainEvent, { type: "InvitationCreated" }>,
): Promise<void> {
  if (!event.inviteeUserId) return;
  const [invitee, actor] = await Promise.all([
    prisma.user.findUnique({ where: { id: event.inviteeUserId } }),
    prisma.user.findUnique({ where: { id: event.actorUserId }, select: PERSON_SELECT }),
  ]);
  if (!invitee) return;

  const prefs = await getOrCreateNotificationPreferences(invitee.id);
  if (!prefAllowsType(prefs, "WORKSPACE_INVITATION")) return;

  const locale = resolveAppLocale(invitee.locale);
  // The invitee knows nobody in the workspace yet: the plain name, no telling apart.
  const actorName = actor ? resolveDisplayName(actor) : null;
  const text = invitationText(locale, {
    workspaceName: event.workspaceName,
    actor: actorName,
  });

  await saveAndPublish({
    recipientUserId: invitee.id,
    actorUserId: event.actorUserId,
    workspaceId: event.workspaceId,
    type: "WORKSPACE_INVITATION",
    ...text,
    sourceId: event.invitationId,
    payloadType: "INVITE",
    payload: {
      invitationId: event.invitationId,
      workspaceId: event.workspaceId,
      workspaceName: event.workspaceName,
      workspaceIcon: event.workspaceIcon,
      actorDisplayName: actorName ?? nameWords(locale).fallback,
      actorHasName: actorName !== null,
    },
  });
}

async function notifyWorkspaceMembers(
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
    payload: Record<string, Prisma.InputJsonValue>;
    text: (locale: AppLocale, workspaceName: string, actor: string | null) => NotificationText;
  },
): Promise<void> {
  const [people, workspace] = await Promise.all([
    loadPeople(event.workspaceId),
    prisma.workspace.findUnique({
      where: { id: event.workspaceId },
      select: { name: true },
    }),
  ]);
  const workspaceName = workspace?.name ?? "";
  const labelsFor = labelsByLocale(people);

  for (const member of people) {
    if (member.userId === event.actorUserId) continue;
    const prefs = await getOrCreateNotificationPreferences(member.userId);
    if (!prefAllowsType(prefs, spec.type)) continue;
    if (await alreadyNotified(member.userId, spec.type, spec.sourceId)) continue;

    const locale = resolveAppLocale(member.user.locale);
    const { labels, fallback } = labelsFor(locale);
    const actor = nameFor(people, event.actorUserId, labels);
    await saveAndPublish({
      recipientUserId: member.userId,
      actorUserId: event.actorUserId,
      workspaceId: event.workspaceId,
      type: spec.type,
      ...spec.text(locale, workspaceName, actor),
      sourceId: spec.sourceId,
      payloadType: spec.payloadType,
      // App 1.0.8 screens print actorDisplayName as it is.
      payload: { ...spec.payload, actorDisplayName: actor ?? fallback, actorHasName: actor !== null },
    });
  }
}

async function handleMemberJoined(
  event: Extract<DomainEvent, { type: "WorkspaceMemberJoined" }>,
): Promise<void> {
  if (event.inviterUserId === event.memberUserId) return;
  const people = await loadPeople(event.workspaceId);
  const inviter = people.find((p) => p.userId === event.inviterUserId);
  // An inviter who left or was removed hears nothing.
  if (!inviter) return;

  const prefs = await getOrCreateNotificationPreferences(inviter.userId);
  if (!prefAllowsType(prefs, "WORKSPACE_MEMBER_JOINED")) return;
  if (await alreadyNotified(inviter.userId, "WORKSPACE_MEMBER_JOINED", event.invitationId)) return;

  const locale = resolveAppLocale(inviter.user.locale);
  const { labels, fallback } = labelsByLocale(people)(locale);
  const member = nameFor(people, event.memberUserId, labels);

  await saveAndPublish({
    recipientUserId: inviter.userId,
    actorUserId: event.memberUserId,
    workspaceId: event.workspaceId,
    type: "WORKSPACE_MEMBER_JOINED",
    ...memberJoinedText(locale, { workspaceName: event.workspaceName, member }),
    sourceId: event.invitationId,
    payloadType: "WORKSPACE",
    payload: {
      workspaceId: event.workspaceId,
      workspaceName: event.workspaceName,
      workspaceIcon: event.workspaceIcon,
      invitationId: event.invitationId,
      memberUserId: event.memberUserId,
      memberDisplayName: member ?? fallback,
      memberHasName: member !== null,
    },
  });
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
    notificationType: row.type,
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
    "WorkspaceMemberJoined",
  ] as const) {
    domainEventBus.subscribe(type, async (event) => {
      await handleDomainEventForNotifications(event);
    });
  }
}
