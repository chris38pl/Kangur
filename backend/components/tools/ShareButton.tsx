"use client";

import { useSyncExternalStore } from "react";

const never = () => () => {};
const canShare = () => typeof navigator.share === "function";

/** Closing the share sheet, or a second tap while it opens, is not an error. */
const HARMLESS: ReadonlySet<string> = new Set(["AbortError", "InvalidStateError"]);

/** The phone's share sheet. */
export function ShareButton({
  label,
  title,
  text,
  url,
  className,
  onRefused,
}: {
  label: string;
  title: string;
  text: string;
  /** Goes next to the text, so whoever gets the list can make their own. */
  url?: string;
  className?: string;
  /** The sheet did not open at all. */
  onRefused?: () => void;
}) {
  const share = useSyncExternalStore(never, canShare, () => false);
  if (!share) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        navigator.share({ title, text, ...(url ? { url } : {}) }).catch((error: unknown) => {
          if (!(error instanceof DOMException && HARMLESS.has(error.name))) onRefused?.();
        });
      }}
    >
      {label}
    </button>
  );
}
