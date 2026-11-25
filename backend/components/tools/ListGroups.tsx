"use client";

import type { Line } from "@/lib/marketing/lists/build";

import styles from "./Calculator.module.css";

export type LineGroup = {
  key: string;
  title: string;
  icon?: string;
  hint?: string;
  lines: readonly Line[];
};

/** A finished list, to tick on the phone or on paper. */
export function ListGroups({
  groups,
  done,
  onToggle,
}: {
  groups: readonly LineGroup[];
  done: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <h3>
            {group.icon ? <span aria-hidden>{group.icon} </span> : null}
            {group.title}
          </h3>
          {group.hint ? <p className={styles.hint}>{group.hint}</p> : null}
          <ul>
            {group.lines.map((line) => (
              <li key={line.id} data-done={done.has(line.id) || undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={done.has(line.id)}
                    onChange={() => onToggle(line.id)}
                  />
                  <span className={styles.name}>
                    {line.name}
                    {line.note ? <small>{line.note}</small> : null}
                  </span>
                  <span className={styles.quantity}>{line.quantity}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
