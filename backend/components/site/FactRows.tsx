import type { AppLocale } from "@/lib/marketing/locale";
import { rich } from "@/lib/marketing/rich-text";

import styles from "./FactRows.module.css";

export type FactRow = { term: string; value: string };

/** Term and value pairs that people look up: names, numbers, addresses. */
export function FactRows({
  rows,
  locale,
}: {
  rows: readonly FactRow[];
  locale: AppLocale;
}) {
  return (
    <dl className={styles.rows}>
      {rows.map((row) => (
        <div key={row.term}>
          <dt>{row.term}</dt>
          <dd>{rich(row.value, locale)}</dd>
        </div>
      ))}
    </dl>
  );
}
