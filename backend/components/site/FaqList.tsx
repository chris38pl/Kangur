import type { ReactNode } from "react";

import styles from "./FaqList.module.css";

export type FaqEntry = { q: string; a: ReactNode };

/** Questions are headings, so they can be found, quoted and jumped between. */
export function FaqList({
  items,
  headingLevel: Heading = "h3",
}: {
  items: readonly FaqEntry[];
  headingLevel?: "h2" | "h3";
}) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.q} className={styles.item}>
          <summary className={styles.summary}>
            <Heading className={styles.question}>{item.q}</Heading>
            <svg
              className={styles.chevron}
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              aria-hidden
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className={styles.answer}>{item.a}</div>
        </details>
      ))}
    </div>
  );
}
