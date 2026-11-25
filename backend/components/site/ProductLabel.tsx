import type { ReactNode } from "react";

import styles from "./ProductLabel.module.css";

export type LabelRow = { term: string; value: ReactNode };

/** Facts about the app laid out like the back of a package. */
export function ProductLabel({
  title,
  subtitle,
  rows,
  footer,
}: {
  title: string;
  subtitle: string;
  rows: readonly LabelRow[];
  footer?: string;
}) {
  return (
    <div className={styles.label}>
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.term} className={styles.row}>
            <dt>{row.term}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {footer ? (
        <div className={styles.footer}>
          <svg viewBox="0 0 96 30" width="96" height="30" aria-hidden>
            {[
              [0, 2], [4, 1], [7, 3], [12, 1], [15, 1], [18, 2], [23, 1], [26, 3],
              [31, 1], [34, 2], [38, 1], [42, 1], [45, 3], [50, 1], [53, 2], [58, 1],
              [61, 1], [64, 3], [69, 2], [73, 1], [76, 1], [80, 2], [84, 1], [87, 3],
              [92, 1], [95, 1],
            ].map(([x, width]) => (
              <rect key={x} x={x} y="0" width={width} height="30" fill="currentColor" />
            ))}
          </svg>
          <span>{footer}</span>
        </div>
      ) : null}
    </div>
  );
}
