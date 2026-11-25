"use client";

import { useRef } from "react";

import { useCopy } from "@/components/tools/use-copy";
import { plainSpaces } from "@/lib/marketing/typography";

import styles from "./CopyBox.module.css";

/** A text meant to be pasted somewhere else. Selectable as it is, one tap copies it. */
export function CopyBox({
  text,
  label,
  done,
}: {
  text: string;
  label: string;
  done: string;
}) {
  const [state, copy] = useCopy();
  const textRef = useRef<HTMLParagraphElement>(null);

  return (
    <div className={styles.box}>
      <p ref={textRef}>{text}</p>
      <button
        type="button"
        onClick={() => {
          void copy(plainSpaces(text)).then((ok) => {
            // No clipboard at all: leave the text selected, one tap away from "Kopiuj".
            if (!ok && textRef.current) window.getSelection()?.selectAllChildren(textRef.current);
          });
        }}
      >
        <span aria-live="polite">{state === "copied" ? done : label}</span>
      </button>
      <span role="status" className={styles.refused}>
        {state === "refused" ? "Tekst jest zaznaczony. Przytrzymaj go i wybierz „Kopiuj”." : null}
      </span>
    </div>
  );
}
