"use client";

import { useSyncExternalStore } from "react";

import { warsawToday } from "@/lib/marketing/season";

const never = () => () => {};

/** Today in Poland once the page runs. Null in the static HTML, so nothing has to match. */
export const useToday = (): string | null => useSyncExternalStore(never, warsawToday, () => null);
