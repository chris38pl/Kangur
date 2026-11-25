"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className={styles.box}>
      <p>{text}</p>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(plainSpaces(text)).then(() => setCopied(true));
        }}
      >
        <span aria-live="polite">{copied ? done : label}</span>
      </button>
    </div>
  );
}
