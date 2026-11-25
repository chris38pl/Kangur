"use client";

import { useEffect, useEffectEvent } from "react";

import { unpackList } from "@/lib/marketing/lists/handoff";

declare global {
  interface Window {
    /** A list from a code, taken out of the address before Next.js read it (layout.tsx). */
    __kangurList?: string;
  }
}

/** Runs when the page was opened with a list in its address, and leaves the address clean. */
export function useArrival(onArrive: (list: Record<string, unknown>) => void): void {
  const arrive = useEffectEvent(onArrive);

  useEffect(() => {
    const early = window.__kangurList;
    window.__kangurList = undefined;
    const first = early ? unpackList(early) : null;
    if (first) arrive(first);

    // The same tab, another code: the page is already running, so the address is cleaned here.
    const take = () => {
      const list = unpackList(window.location.hash);
      if (!list) return;
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
      arrive(list);
    };
    take();
    window.addEventListener("hashchange", take);
    return () => window.removeEventListener("hashchange", take);
  }, []);
}
