import { t, tCount } from "@/lib/i18n";
import type { AppLocale } from "@/lib/locale";

/**
 * Notification texts that do not need the person's gender. The title is the workspace, the
 * body starts with the name ("Kasia: zakupy zakończone, 18 z 20 produktów"). Without a name
 * the body simply leaves it out. The texts are stored with each notification, so old ones
 * keep the wording they were sent with.
 */
export type NotificationText = { title: string; body: string };

type Actor = string | null;

export function listCreatedText(
  locale: AppLocale,
  input: { workspaceName: string; actor: Actor; listName: string },
): NotificationText {
  return {
    title: input.workspaceName,
    body: input.actor
      ? t(locale, "notifications.listCreated.body", { actor: input.actor, listName: input.listName })
      : t(locale, "notifications.listCreated.bodyNoName", { listName: input.listName }),
  };
}

export function listDeletedText(
  locale: AppLocale,
  input: { workspaceName: string; actor: Actor; listName: string },
): NotificationText {
  return {
    title: input.workspaceName,
    body: input.actor
      ? t(locale, "notifications.listDeleted.body", { actor: input.actor, listName: input.listName })
      : t(locale, "notifications.listDeleted.bodyNoName", { listName: input.listName }),
  };
}

export function shoppingStartedText(
  locale: AppLocale,
  input: { workspaceName: string; actor: Actor; listName: string },
): NotificationText {
  return {
    title: input.workspaceName,
    body: input.actor
      ? t(locale, "notifications.shoppingStarted.body", { actor: input.actor, listName: input.listName })
      : t(locale, "notifications.shoppingStarted.bodyNoName", { listName: input.listName }),
  };
}

export function shoppingFinishedText(
  locale: AppLocale,
  input: { workspaceName: string; actor: Actor; boughtCount: number; itemCount: number },
): NotificationText {
  const key = "notifications.shoppingFinished";
  let body: string;
  if (input.itemCount <= 0) {
    body = input.actor
      ? t(locale, `${key}.bodyEmpty`, { actor: input.actor })
      : t(locale, `${key}.bodyEmptyNoName`);
  } else {
    body = input.actor
      ? tCount(locale, `${key}.body`, input.itemCount, { actor: input.actor, bought: input.boughtCount })
      : tCount(locale, `${key}.bodyNoName`, input.itemCount, { bought: input.boughtCount });
  }
  return { title: input.workspaceName, body };
}

export function invitationText(
  locale: AppLocale,
  input: { workspaceName: string; actor: Actor },
): NotificationText {
  return {
    title: t(locale, "notifications.invite.title", { workspaceName: input.workspaceName }),
    body: input.actor
      ? t(locale, "notifications.invite.body", { actor: input.actor })
      : t(locale, "notifications.invite.bodyNoName"),
  };
}

export function memberJoinedText(
  locale: AppLocale,
  input: { workspaceName: string; member: Actor },
): NotificationText {
  return {
    title: input.workspaceName,
    body: input.member
      ? t(locale, "notifications.memberJoined.body", { name: input.member })
      : t(locale, "notifications.memberJoined.bodyNoName"),
  };
}
