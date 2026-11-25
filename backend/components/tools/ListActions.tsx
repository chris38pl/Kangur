"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { copyText } from "@/lib/marketing/copy-text";

import styles from "./ListActions.module.css";

const never = () => () => {};
const canShare = () => typeof navigator.share === "function";

/** Take the list with you: clipboard, the phone's share sheet, or paper. */
export function ListActions({ text, title }: { text: string; title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "refused">("idle");
  const share = useSyncExternalStore(never, canShare, () => false);

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div data-noprint>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            void copyText(text).then((ok) => setState(ok ? "copied" : "refused"));
          }}
        >
          <span aria-live="polite">{state === "copied" ? "Skopiowane" : "Kopiuj listę"}</span>
        </button>
        {share ? (
          <button
            type="button"
            onClick={() => {
              // Closing the sheet rejects the promise, which is not an error.
              navigator.share({ title, text }).catch(() => {});
            }}
          >
            Wyślij
          </button>
        ) : null}
        <button type="button" onClick={() => window.print()}>
          Drukuj
        </button>
      </div>
      {state === "refused" ? (
        <label className={styles.manual}>
          Ta przeglądarka nie pozwala kopiować przyciskiem. Przytrzymaj tekst i wybierz „Kopiuj”.
          <textarea readOnly value={text} rows={8} onFocus={(event) => event.target.select()} />
        </label>
      ) : null}
    </div>
  );
}
