/** Compact relative time for home list meta (device locale via caller). */
export function formatRelativeUpdatedAt(
  iso: string,
  labels: {
    justNow: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  },
): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Math.max(0, Date.now() - then);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return labels.justNow;
  if (mins < 60) return labels.minutes(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return labels.hours(hours);
  const days = Math.floor(hours / 24);
  return labels.days(Math.max(1, days));
}
