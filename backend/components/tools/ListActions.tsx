"use client";

import { useState, useSyncExternalStore } from "react";

import { useCopy } from "@/components/tools/use-copy";

import styles from "./ListActions.module.css";

const never = () => () => {};
const canShare = () => typeof navigator.share === "function";
const canPrint = () => typeof window.print === "function";

/** Closing the share sheet, or a second tap while it opens, is not an error. */
const HARMLESS: ReadonlySet<string> = new Set(["AbortError", "InvalidStateError"]);

/** The phone's share sheet. */
export function ShareButton({
  label,
  title,
  text,
  url,
  onRefused,
}: {
  label: string;
  title: string;
  text: string;
  /** Goes next to the text, so whoever gets the list can make their own. */
  url?: string;
  /** The sheet did not open at all. */
  onRefused?: () => void;
}) {
  const share = useSyncExternalStore(never, canShare, () => false);
  if (!share) return null;
  return (
    <button
      type="button"
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

/** Take the list with you: clipboard, the phone's share sheet, or paper. */
export function ListActions({
  text,
  title,
  url,
  copied = "Skopiowane",
}: {
  text: string;
  title: string;
  url?: string;
  /** "Skopiowane: 45 z 47", when ticked products stay behind. */
  copied?: string;
}) {
  const [state, copy] = useCopy();
  const print = useSyncExternalStore(never, canPrint, () => true);
  const [noPrint, setNoPrint] = useState(false);

  // Windows inside other apps have a print button that does nothing.
  const tryPrint = () => {
    let opened = false;
    const mark = () => {
      opened = true;
    };
    window.addEventListener("beforeprint", mark);
    window.print();
    setTimeout(() => {
      window.removeEventListener("beforeprint", mark);
      setNoPrint(!opened);
    }, 1200);
  };

  return (
    <div data-noprint>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void copy(text)}>
          <span aria-live="polite">{state === "copied" ? copied : "Kopiuj listę"}</span>
        </button>
        <ShareButton
          label="Wyślij"
          title={title}
          text={text}
          url={url}
          onRefused={() => void copy(text)}
        />
        {print ? (
          <button type="button" onClick={tryPrint}>
            Drukuj
          </button>
        ) : null}
      </div>
      <div role="status">
        {noPrint ? (
          <p className={styles.note}>
            Nie otworzyło się drukowanie? Otwórz tę stronę w zwykłej przeglądarce, na przykład z
            menu „Otwórz w przeglądarce”.
          </p>
        ) : null}
        {state === "refused" ? (
          <p className={styles.note}>
            Ta przeglądarka nie pozwala kopiować przyciskiem. Przytrzymaj tekst poniżej i wybierz
            „Kopiuj”.
          </p>
        ) : null}
      </div>
      {state === "refused" ? (
        <textarea
          className={styles.manual}
          aria-label="Lista do skopiowania"
          readOnly
          value={text}
          rows={8}
          onFocus={(event) => event.target.select()}
        />
      ) : null}
    </div>
  );
}

/** One part of a list: today's trip, not all three. */
export function CopyPart({ text, label }: { text: string; label: string }) {
  const [state, copy] = useCopy();
  return (
    <button
      type="button"
      className={styles.part}
      aria-label={`Kopiuj tę część: ${label}`}
      onClick={() => void copy(text)}
    >
      <span aria-live="polite">
        {state === "copied" ? "Skopiowane" : state === "refused" ? "Nie da się tutaj" : "Kopiuj tę część"}
      </span>
    </button>
  );
}
