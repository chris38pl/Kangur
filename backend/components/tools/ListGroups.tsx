"use client";

import { useRef } from "react";

import type { Line } from "@/lib/marketing/lists/build";
import { useHydrated } from "@/lib/marketing/lists/use-stored";

import styles from "./Calculator.module.css";

export type LineGroup = {
  key: string;
  title: string;
  icon?: string;
  hint?: string;
  lines: readonly Line[];
};

/** A finished list. What is at home gets a tick and does not go any further. */
export function ListGroups({
  groups,
  done,
  onToggle,
}: {
  groups: readonly LineGroup[];
  done: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  // Until the page comes alive a tick would be shown and lost.
  const ready = useHydrated();

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
                    disabled={!ready}
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

/** "Zostało 60 z 63." Ticked lines are at home already, so they are not bought. */
export function LeftToBuy({
  total,
  left,
  ticked,
  onUntick,
}: {
  total: string;
  left: number;
  ticked: number;
  onUntick: () => void;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  return (
    <div className={styles.left}>
      <p ref={textRef} tabIndex={-1} aria-live="polite">
        {ticked === 0
          ? `${total} do kupienia. Co masz w domu, odhacz i nie kupuj.`
          : `Zostało ${left} z ${left + ticked}.`}
      </p>
      {ticked > 0 ? (
        <button
          type="button"
          className={styles.untick}
          onClick={() => {
            onUntick();
            textRef.current?.focus({ preventScroll: true });
          }}
        >
          Odznacz wszystko ({ticked})
        </button>
      ) : null}
    </div>
  );
}
