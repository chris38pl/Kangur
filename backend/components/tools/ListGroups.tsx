"use client";

import { CopyPart } from "@/components/tools/ListActions";
import type { Line } from "@/lib/marketing/lists/build";
import { listToText } from "@/lib/marketing/lists/format";

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
  partTitle,
}: {
  groups: readonly LineGroup[];
  done: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Name of the whole list. When given, every group can be copied on its own. */
  partTitle?: string;
}) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => {
        const left = group.lines.filter((line) => !done.has(line.id));
        return (
          <section key={group.key} className={styles.group} data-empty={left.length === 0 || undefined}>
            <header className={styles.groupHead}>
              <h3>
                {group.icon ? <span aria-hidden>{group.icon} </span> : null}
                {group.title}
              </h3>
              {partTitle && left.length > 0 ? (
                <span data-noprint>
                  <CopyPart
                    label={group.title}
                    text={listToText(partTitle, [{ title: group.title, lines: left }])}
                  />
                </span>
              ) : null}
            </header>
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
        );
      })}
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
  return (
    <div className={styles.left}>
      <p aria-live="polite">
        {ticked === 0 ? (
          `${total} do kupienia.`
        ) : (
          <>
            <span data-noprint>{`Zostało ${left} z ${left + ticked}. `}</span>
            <span className={styles.paper}>Do kupienia: {left}.</span>
          </>
        )}
        {ticked === 0 ? <span data-noprint> Co masz w domu, odhacz i nie kupuj.</span> : null}
      </p>
      {ticked > 0 ? (
        <button type="button" className={styles.untick} data-noprint onClick={onUntick}>
          Odznacz wszystko ({ticked})
        </button>
      ) : null}
    </div>
  );
}
