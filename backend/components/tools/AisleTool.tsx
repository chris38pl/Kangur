"use client";

import { useId, useMemo, useRef, type ReactNode } from "react";

import { ListActions } from "@/components/tools/ListActions";
import { AISLES, AISLE_ICONS, AISLE_LABELS, isAisle, type Aisle } from "@/lib/marketing/aisles/labels";
import {
  buildAisleIndex,
  groupByAisle,
  sortByAisles,
  type SortedItem,
} from "@/lib/marketing/aisles/sort";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { useStored } from "@/lib/marketing/lists/use-stored";

import styles from "./AisleTool.module.css";

/** Only one list lives here at a time, like a piece of paper on the fridge. */
const NO_TEXT = "";
const NO_ORDER: readonly Aisle[] = AISLES;
const NO_MOVES: Readonly<Record<string, Aisle>> = {};
const NO_DONE: readonly string[] = [];

const keyOf = (name: string) => name.toLocaleLowerCase("pl");

/** Text in, aisles out. Everything happens in the browser. */
export function AisleTool({
  words,
  sample,
  children,
}: {
  /** Phrases per aisle, from the app's own catalogue. */
  words: Partial<Record<Aisle, string>>;
  sample: string;
  /** Bottom of the printed sheet. */
  children?: ReactNode;
}) {
  const fieldId = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [text, setText, clearText] = useStored("alejki-tekst", NO_TEXT);
  const [order, setOrder, clearOrder] = useStored("alejki-kolejnosc", NO_ORDER);
  const [moves, setMoves] = useStored("alejki-poprawki", NO_MOVES);
  const [done, setDone, clearDone] = useStored("alejki-kupione", NO_DONE);

  const index = useMemo(
    () =>
      buildAisleIndex(
        Object.entries(words).flatMap(([aisle, phrases]) =>
          isAisle(aisle)
            ? phrases.split("|").map((phrase) => [phrase, aisle] as const)
            : [],
        ),
      ),
    [words],
  );

  const items = useMemo<SortedItem[]>(
    () =>
      sortByAisles(text, index).map((item) => {
        const moved = moves[keyOf(item.name)];
        return moved ? { ...item, aisle: moved, recognised: true } : item;
      }),
    [text, index, moves],
  );

  // An order saved by an older version may lack an aisle.
  const fullOrder = useMemo(
    () => [...order.filter(isAisle), ...AISLES.filter((a) => !order.includes(a))],
    [order],
  );
  const groups = useMemo(() => groupByAisle(items, fullOrder), [items, fullOrder]);

  const doneSet = new Set(done);
  const unknown = items.filter((item) => !item.recognised).length;
  const changedOrder = fullOrder.some((aisle, i) => aisle !== AISLES[i]);

  const toggle = (item: SortedItem) => {
    const key = keyOf(item.name);
    setDone(doneSet.has(key) ? done.filter((k) => k !== key) : [...done, key]);
  };

  /** Moves an aisle past the next one that is on this list, not past an invisible one. */
  const moveAisle = (aisle: Aisle, step: -1 | 1) => {
    const visible = groups.map((group) => group.aisle);
    const neighbour = visible[visible.indexOf(aisle) + step];
    if (!neighbour) return;
    const rest = fullOrder.filter((a) => a !== aisle);
    const at = rest.indexOf(neighbour) + (step === 1 ? 1 : 0);
    setOrder([...rest.slice(0, at), aisle, ...rest.slice(at)]);
  };

  const plainText = listToText(
    "Lista zakupów",
    groups.map(({ aisle, items: products }) => ({
      title: AISLE_LABELS[aisle],
      lines: products,
    })),
  );

  return (
    <div className={styles.tool}>
      <div className={styles.input} data-noprint>
        <label htmlFor={fieldId}>Twoja lista</label>
        <textarea
          id={fieldId}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (done.length) clearDone();
          }}
          placeholder={sample}
          rows={9}
          spellCheck={false}
          autoCapitalize="none"
        />
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.main}
            disabled={items.length === 0}
            onClick={() =>
              resultRef.current?.scrollIntoView({ block: "start" })
            }
          >
            Ułóż według alejek
          </button>
          {text ? (
            <button
              type="button"
              onClick={() => {
                clearText();
                clearDone();
              }}
            >
              Wyczyść
            </button>
          ) : (
            <button type="button" onClick={() => setText(sample)}>
              Wstaw przykład
            </button>
          )}
        </div>
        <p className={styles.private}>
          Lista zostaje na tym urządzeniu. Nic nie wysyłamy.
        </p>
      </div>

      <div className={styles.result} ref={resultRef}>
        {items.length === 0 ? (
          <div className={styles.empty} data-noprint>
            <p>Tu pojawią się alejki.</p>
            <p>
              Wklej listę po przecinku albo w linijkach. „Aaa i proszek” też się
              nada.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.summary}>
              <p aria-live="polite">
                <strong>{plural(items.length, "produkt", "produkty", "produktów")}</strong>
                {" w "}
                {groups.length === 1
                  ? "jednej alejce"
                  : plural(groups.length, "alejce", "alejkach", "alejkach")}
                {unknown > 0 ? (
                  <span data-noprint>
                    . Nie znamy {unknown === 1 ? "jednego z nich" : unknown}, jest w „Inne”.
                  </span>
                ) : null}
              </p>
              {changedOrder ? (
                <button type="button" className={styles.reset} onClick={clearOrder} data-noprint>
                  Przywróć kolejność
                </button>
              ) : null}
            </div>

            <div className={styles.groups}>
              {groups.map(({ aisle, items: products }, position) => (
                <section key={aisle} className={styles.group} aria-label={AISLE_LABELS[aisle]}>
                  <header>
                    <h3>
                      <span aria-hidden>{AISLE_ICONS[aisle]}</span> {AISLE_LABELS[aisle]}
                    </h3>
                    <span className={styles.order} data-noprint>
                      <button
                        type="button"
                        disabled={position === 0}
                        aria-label={`${AISLE_LABELS[aisle]}: wcześniej`}
                        onClick={() => moveAisle(aisle, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={position === groups.length - 1}
                        aria-label={`${AISLE_LABELS[aisle]}: później`}
                        onClick={() => moveAisle(aisle, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  </header>
                  <ul>
                    {products.map((item) => (
                      <li key={item.id} data-done={doneSet.has(keyOf(item.name)) || undefined}>
                        <label>
                          <input
                            type="checkbox"
                            checked={doneSet.has(keyOf(item.name))}
                            onChange={() => toggle(item)}
                          />
                          <span>
                            {item.name}
                            {item.quantity ? <small>{item.quantity}</small> : null}
                          </span>
                        </label>
                        <select
                          aria-label={`Alejka: ${item.name}`}
                          value={aisle}
                          data-noprint
                          onChange={(event) => {
                            const next = event.target.value;
                            if (isAisle(next)) setMoves({ ...moves, [keyOf(item.name)]: next });
                          }}
                        >
                          {AISLES.map((option) => (
                            <option key={option} value={option}>
                              {AISLE_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <ListActions text={plainText} title="Lista zakupów" />
            <div className={styles.sheetFoot}>{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
