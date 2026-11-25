"use client";

import { useEffect, useEffectEvent } from "react";

import { unpackList } from "@/lib/marketing/lists/handoff";

/** Runs when the page was opened with a list in its address, and leaves the address clean. */
export function useArrival(onArrive: (list: Record<string, unknown>) => void): void {
  const arrive = useEffectEvent(onArrive);

  useEffect(() => {
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
    // The same tab, another code.
    window.addEventListener("hashchange", take);
    return () => window.removeEventListener("hashchange", take);
  }, []);
}
