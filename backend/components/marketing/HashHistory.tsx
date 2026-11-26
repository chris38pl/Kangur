"use client";

import { useEffect } from "react";

/**
 * A link to a place on the same page ("#do-kangura", "#tresc") makes a history entry with an
 * empty state. Next.js ignores such an entry, so Back from the next page changed the address
 * and left the wrong page on the screen. The entry gets the state of the page it is on.
 */
export function HashHistory() {
  useEffect(() => {
    let state: unknown = window.history.state;
    const remember = () => {
      state = window.history.state;
    };
    const adopt = () => {
      if (window.history.state === null && state) {
        window.history.replaceState(state, "", window.location.href);
      }
    };
    // Before the browser follows the link, while the old entry is still the current one.
    document.addEventListener("click", remember, true);
    window.addEventListener("hashchange", adopt);
    return () => {
      document.removeEventListener("click", remember, true);
      window.removeEventListener("hashchange", adopt);
    };
  }, []);
  return null;
}
