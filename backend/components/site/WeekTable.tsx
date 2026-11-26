import prose from "@/components/site/prose.module.css";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { DEFAULT_WEEK, weekList } from "@/lib/marketing/lists/week";

import styles from "./WeekTable.module.css";

const HOUSEHOLDS = [
  { label: "1 osoba", people: 1 },
  { label: "2 osoby", people: 2 },
  { label: "4 osoby (2+2)", people: 4 },
] as const;

/** The calculator's answer for three households, in the page itself. */
export function WeekTable() {
  const lists = HOUSEHOLDS.map(({ people }) =>
    weekList({ ...DEFAULT_WEEK, people, cupboard: false }),
  );
  // Every household gets the same products, only the amounts differ.
  const rows = lists[lists.length - 1].map((line) => ({
    ...line,
    amounts: lists.map((list) => list.find((l) => l.id === line.id)?.quantity ?? "-"),
  }));

  return (
    <div className={prose.tableWrap}>
      <table className={`${prose.table} ${styles.table}`}>
        <caption className="visually-hidden">
          Ilości produktów na tydzień dla jednej osoby, dwóch osób i rodziny 2+2
        </caption>
        <thead>
          <tr>
            <th scope="col">Produkt</th>
            {HOUSEHOLDS.map(({ label }) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        {AISLES.map((aisle) => {
          const products = rows.filter((row) => row.aisle === aisle);
          if (products.length === 0) return null;
          return (
            <tbody key={aisle}>
              <tr className={styles.aisle}>
                <th colSpan={4} scope="rowgroup">
                  <span aria-hidden>{AISLE_ICONS[aisle]}</span> {AISLE_LABELS[aisle]}
                </th>
              </tr>
              {products.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    {`${row.name} `}
                    {row.when === "topup" ? <small>dokupka</small> : null}
                  </th>
                  {row.amounts.map((amount, index) => (
                    <td key={HOUSEHOLDS[index].label}>{amount}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
