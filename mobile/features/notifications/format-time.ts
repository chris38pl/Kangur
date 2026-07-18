/**
 * Native-feeling relative time for notification rows.
 * 2 min temu · 1 godz. temu · Wczoraj, 18:42 · 2 dni temu
 */
export function formatNotificationTime(
  iso: string,
  locale: string,
  now = new Date(),
): string {
  const date = new Date(iso);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60_000);
  const pl = locale.startsWith("pl");

  if (diffMin < 1) return pl ? "Teraz" : "Just now";
  if (diffMin < 60) {
    return pl ? `${diffMin} min temu` : `${diffMin} min ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24 && isSameDay(date, now)) {
    return pl
      ? `${diffHours} godz. temu`
      : `${diffHours}h ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    const time = date.toLocaleTimeString(pl ? "pl-PL" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return pl ? `Wczoraj, ${time}` : `Yesterday, ${time}`;
  }

  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 7) {
    return pl ? `${diffDays} dni temu` : `${diffDays}d ago`;
  }

  return date.toLocaleDateString(pl ? "pl-PL" : "en-US", {
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
