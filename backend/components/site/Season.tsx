"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const never = () => () => {};

/** Today in Poland, as "2026-12-24". Also for somebody who shops for Christmas from Chicago. */
function today(): string {
  try {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const useOver = (day: string) =>
  useSyncExternalStore(
    never,
    () => today() > day,
    () => false,
  );

/**
 * Something for a few weeks of the year. It is in the static HTML, and hides itself in the
 * browser once its time has passed, so a forgotten deploy does not wish anyone a merry
 * Christmas in February.
 */
export function Season({ until, children }: { until: string; children: ReactNode }) {
  return useOver(until) ? null : children;
}

/** The other way round: shown only once the day has passed. */
export function AfterSeason({ after, children }: { after: string; children: ReactNode }) {
  return useOver(after) ? children : null;
}
