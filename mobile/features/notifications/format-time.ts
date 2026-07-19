/**
 * Relative time for notification rows via Intl (no per-locale string branches).
 */
import { intlLocaleTag } from "@/lib/i18n/locales";

export function formatNotificationTime(
  iso: string,
  locale: string,
  now = new Date(),
): string {
  const date = new Date(iso);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const tag = intlLocaleTag(locale);

  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });

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
    // RelativeTimeFormat "yesterday" + clock for scanability
    const dayLabel = rtf.format(-1, "day");
    return `${dayLabel}, ${time}`;
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
