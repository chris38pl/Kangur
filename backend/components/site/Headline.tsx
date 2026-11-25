import type { ReactNode } from "react";

import styles from "./Headline.module.css";

type Props = {
  as?: "h1" | "h2" | "h3";
  /** Small line above, part of the heading for search engines and screen readers. */
  eyebrow?: string;
  /** Our signature: first line ink, second line mint. */
  lines: readonly [string, string?];
  id?: string;
  lang?: string;
  size?: "xl" | "lg" | "md";
  className?: string;
};

export function Headline({
  as: Tag = "h2",
  eyebrow,
  lines,
  id,
  lang,
  size = "lg",
  className,
}: Props) {
  return (
    <Tag
      id={id}
      lang={lang}
      className={[styles.headline, styles[size], className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? (
        <span className={styles.eyebrow}>
          {eyebrow}
          <span className="visually-hidden">. </span>
        </span>
      ) : null}
      <span className={styles.line}>{lines[0]}</span>
      {lines[1] ? (
        <>
          {" "}
          <span className={`${styles.line} ${styles.accent}`}>{lines[1]}</span>
        </>
      ) : null}
    </Tag>
  );
}

/** Rounded label from our carousels: "Krok 1". */
export function Pill({ children }: { children: ReactNode }) {
  return <span className={styles.pill}>{children}</span>;
}
