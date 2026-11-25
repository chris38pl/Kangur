/** Today in Poland, as "2026-12-24". Also for somebody who shops for Christmas from Chicago. */
export function warsawToday(): string {
  try {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** True from the day after `day`. On the server: at the time of the build. */
export const isOver = (day: string): boolean => warsawToday() > day;
