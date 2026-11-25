"use client";

import { useEffect, useRef, useState } from "react";

import { copyText } from "@/lib/marketing/copy-text";
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
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (await copyText(plainSpaces(text))) {
      setCopied(true);
    } else if (textRef.current) {
      // No clipboard at all: leave the text selected, one tap away from "Copy".
      window.getSelection()?.selectAllChildren(textRef.current);
    }
  };

  return (
    <div className={styles.box}>
      <p ref={textRef}>{text}</p>
      <button type="button" onClick={() => void copy()}>
        <span aria-live="polite">{copied ? done : label}</span>
      </button>
    </div>
  );
}
