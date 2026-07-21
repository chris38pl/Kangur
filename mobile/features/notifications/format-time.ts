/**
 * Relative / calendar time for notification rows.
 * Intl.RelativeTimeFormat is missing on some Android Hermes builds
 * ("undefined cannot be used as a constructor") - guard + fallback.
 */
import { intlLocaleTag } from "@/lib/i18n/locales";

export function formatNotificationTime(
  iso: string,
  locale: string,
  now = new Date(),
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const tag = intlLocaleTag(locale);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);

  const rtf =
    typeof Intl !== "undefined" &&
    typeof Intl.RelativeTimeFormat === "function"
      ? new Intl.RelativeTimeFormat(tag, { numeric: "auto" })
      : null;

  if (rtf) {
    if (diffSec < 60) {
      return rtf.format(-Math.max(diffSec, 0), "second");
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return rtf.format(-diffMin, "minute");
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24 && isSameDay(date, now)) {
      return rtf.format(-diffHours, "hour");
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) {
      const time = date.toLocaleTimeString(tag, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${rtf.format(-1, "day")}, ${time}`;
    }

    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays < 7) {
      return rtf.format(-diffDays, "day");
    }

    return date.toLocaleDateString(tag, {
      day: "numeric",
      month: "short",
    });
  }

  // Fallback without RelativeTimeFormat (Android Hermes without ICU RTF)
  const clock = date.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isSameDay(date, now)) {
    return clock;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return clock;
  }

  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 7) {
    return date.toLocaleDateString(tag, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleDateString(tag, {
    day: "numeric",
    month: "short",
  });
}

export type NotificationSectionKey = "today" | "earlier";

export function notificationSectionKey(
  iso: string,
  now = new Date(),
): NotificationSectionKey {
  return isSameDay(new Date(iso), now) ? "today" : "earlier";
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
