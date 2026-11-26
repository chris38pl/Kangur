"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { isOver } from "@/lib/marketing/season";

const never = () => () => {};

const useOver = (day: string) =>
  useSyncExternalStore(
    never,
    () => isOver(day),
    () => false,
  );

/**
 * Something for a few weeks of the year. It is in the static HTML, and hides itself in the
 * browser once its time has passed, so a forgotten deploy does not wish anyone a merry
 * Christmas in February. The page itself leaves it out when it is built after that day.
 */
export function Season({ until, children }: { until: string; children: ReactNode }) {
  return useOver(until) ? null : children;
}

/** The other way round: shown only once the day has passed. */
export function AfterSeason({ after, children }: { after: string; children: ReactNode }) {
  return useOver(after) ? children : null;
}
