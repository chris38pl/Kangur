"use client";

import { useEffect } from "react";

import { UTM_STORAGE_KEY, hasUtm, readUtm } from "@/lib/marketing/store-links";

/**
 * Remembers the campaign (utm_*) of the page a visitor entered on, so the store
 * buttons still carry it after they move to another landing page.
 */
export function UtmCapture() {
  useEffect(() => {
    const utm = readUtm(window.location.search);
    if (!hasUtm(utm)) return;
    try {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    } catch {
      // Private mode or storage disabled: the current page still has the URL.
    }
  }, []);

  return null;
}
