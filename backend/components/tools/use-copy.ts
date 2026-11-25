"use client";

import { useCallback, useEffect, useState } from "react";

import { copyText } from "@/lib/marketing/copy-text";

export type CopyState = "idle" | "copied" | "refused";

/** "Skopiowane" goes away by itself. A refusal stays, so there is time to copy by hand. */
export function useCopy(): [CopyState, (text: string) => Promise<boolean>] {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = useCallback(async (text: string) => {
    const ok = await copyText(text);
    setState(ok ? "copied" : "refused");
    return ok;
  }, []);

  return [state, copy];
}
