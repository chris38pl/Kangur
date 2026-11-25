"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import styles from "./ListActions.module.css";

const never = () => () => {};
const canShare = () => typeof navigator.share === "function";

/** Take the list with you: clipboard, the phone's share sheet, or paper. */
export function ListActions({
  text,
  title,
  copyLabel = "Kopiuj listę",
  disabled,
  className,
}: {
  text: string;
  title: string;
  copyLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const share = useSyncExternalStore(never, canShare, () => false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div
      className={[styles.actions, className ?? ""].filter(Boolean).join(" ")}
      data-noprint
    >
      <button
        type="button"
        className={styles.primary}
        disabled={disabled}
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => setCopied(true));
        }}
      >
        <span aria-live="polite">{copied ? "Skopiowane" : copyLabel}</span>
      </button>
      {share ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            // Closing the sheet rejects the promise, which is not an error.
            navigator.share({ title, text }).catch(() => {});
          }}
        >
          Wyślij
        </button>
      ) : null}
      <button type="button" disabled={disabled} onClick={() => window.print()}>
        Drukuj
      </button>
    </div>
  );
}
