"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const never = () => () => {};

/**
 * Something for a few weeks of the year. It is in the static HTML, and hides itself in the
 * browser once its time has passed, so a forgotten deploy does not wish anyone a merry
 * Christmas in February.
 */
export function Season({ until, children }: { until: string; children: ReactNode }) {
  const over = useSyncExternalStore(
    never,
    () => new Date().toISOString().slice(0, 10) > until,
    () => false,
  );
  return over ? null : children;
}
