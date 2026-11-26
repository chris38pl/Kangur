"use client";

import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { HopBar, HopButton, ToKangur, type KangurSlots } from "@/components/tools/ToKangur";
import { AISLES, AISLE_ICONS, AISLE_LABELS, isAisle, type Aisle } from "@/lib/marketing/aisles/labels";
import {
  buildAisleIndex,
  groupByAisle,
  sortByAisles,
  type SortedItem,
} from "@/lib/marketing/aisles/sort";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { formatLine, listToText, plural } from "@/lib/marketing/lists/format";
import { KANGUR_LIMIT, kangurParts } from "@/lib/marketing/lists/parts";
import { isRecord, strings } from "@/lib/marketing/lists/stored";
import { useArrival } from "@/lib/marketing/lists/use-arrival";
import { hasStored, readStored, useStored } from "@/lib/marketing/lists/use-stored";
import { typesetCopy } from "@/lib/marketing/typography";
import { mergeActiveCategoryOrder, resolveShoppingCategoryOrder } from "@shared/shopping-categories";

import styles from "./AisleTool.module.css";

/** Only one list lives here at a time. */
const TEXT_KEY = "alejki-tekst";
const ORDER_KEY = "alejki-kolejnosc";
const MOVES_KEY = "alejki-poprawki";
const DONE_KEY = "alejki-kupione";
/** Short address: in the code to scan, and next to a list sent in a message. */
const PATH = "/alejki";
const TITLE = "Lista zakupów";

const NO_TEXT = "";
const NO_ORDER: readonly Aisle[] = AISLES;
const NO_MOVES: Readonly<Record<string, Aisle>> = {};
const NO_DONE: readonly string[] = [];
/** A page pasted by mistake must not freeze a phone, and nobody shops for more. */
const LIMIT = 400;

const readText = (stored: unknown) => (typeof stored === "string" ? stored : NO_TEXT);
const readOrder = (stored: unknown): readonly Aisle[] => resolveShoppingCategoryOrder(strings(stored));
const readMoves = (stored: unknown): Readonly<Record<string, Aisle>> =>
  isRecord(stored)
    ? Object.fromEntries(
        Object.entries(stored).flatMap(([name, aisle]) =>
          typeof aisle === "string" && isAisle(aisle) ? [[name, aisle] as const] : [],
        ),
      )
    : NO_MOVES;

const nameKey = (name: string) => name.toLocaleLowerCase("pl");

/** Two lines of milk are two lines: each has its own tick. */
type Item = SortedItem & { key: string };

function withKeys(items: readonly SortedItem[]): Item[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const name = nameKey(item.name);
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    // A new line cannot be a part of a name.
    return { ...item, key: count === 1 ? name : `${name}\n${count}` };
  });
}

function summary(total: number, aisles: number, unknown: number): string {
  if (total === 0) return "";
  const where = aisles === 1 ? "jednej alejce" : plural(aisles, "alejce", "alejkach", "alejkach");
  const missing =
    unknown === 0
      ? ""
      : unknown === 1
        ? " Nie znamy jednego z nich, jest w „Inne”."
        : ` Nie znamy ${unknown} z nich, są w „Inne”.`;
  const cut = total >= LIMIT ? ` Pokazujemy pierwsze ${LIMIT}.` : "";
  return `${plural(total, "produkt", "produkty", "produktów")} w ${where}.${missing}${cut}`;
}

/** Text in, aisles out. Everything happens in the browser. */
export function AisleTool({
  words,
  sample,
  slots,
}: {
  /** Phrases per aisle, from the app's own catalogue. */
  words: Partial<Record<Aisle, string>>;
  sample: string;
  slots: KangurSlots;
}) {
  const fieldId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [cleared, setCleared] = useState<{ text: string; done: readonly string[] } | null>(null);
  /** The product that has just changed its aisle: the keyboard goes there with it. */
  const moved = useRef<string | null>(null);

  const [text, setText, clearText] = useStored(TEXT_KEY, NO_TEXT, readText);
  const [order, setOrder, clearOrder] = useStored(ORDER_KEY, NO_ORDER, readOrder);
  const [moves, setMoves, clearMoves] = useStored(MOVES_KEY, NO_MOVES, readMoves);
  const [done, setDone, clearDone] = useStored(DONE_KEY, NO_DONE, strings);
  /** Grows with every list that comes from a computer, back to zero after a change by hand. */
  const [arrival, setArrival] = useState(0);
  /** Everything that was here before a code was scanned. */
  const [before, setBefore] = useState<{
    text: string;
    done: readonly string[];
    order: readonly Aisle[];
    moves: Readonly<Record<string, Aisle>>;
  } | null>(null);
  /** Typing, clearing or the sample: the list is now this person's own. */
  const byHand = () => {
    setArrival(0);
    setBefore(null);
  };
  // Typing stays quick on a phone, the aisles follow a moment later.
  const deferred = useDeferredValue(text);

  // Somebody may have pasted a list before the page came alive. It wins over the saved one.
  useLayoutEffect(() => {
    const early = fieldRef.current?.value;
    if (!early) return;
    // After Back, a reload or in a restored tab the browser puts the old text there by itself.
    const [visit] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (visit && visit.type !== "navigate" && hasStored(TEXT_KEY)) return;
    setText(early);
    // Only once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safari may put the old text back into the field when React has already filled it.
  const settle = useEffectEvent(() => {
    const field = fieldRef.current;
    if (field && field.value !== text) field.value = text;
  });
  useEffect(() => {
    const onShow = () => settle();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // A list from the computer, with the aisles set there.
  useArrival((list) => {
    if (typeof list.t !== "string" || !list.t.trim()) return;
    const next = list.t.slice(0, KANGUR_LIMIT);
    const here = {
      text: readStored(TEXT_KEY, NO_TEXT, readText),
      done: readStored(DONE_KEY, NO_DONE, strings),
      order: readStored(ORDER_KEY, NO_ORDER, readOrder),
      moves: readStored(MOVES_KEY, NO_MOVES, readMoves),
    };
    setBefore(here.text.trim() && (here.text !== next || here.done.length > 0) ? here : null);
    setText(next);
    clearDone();
    if (Array.isArray(list.o)) setOrder(readOrder(list.o.map((place) => AISLES[place])));
    if (list.m) setMoves({ ...here.moves, ...readMoves(list.m) });
    setArrival((count) => count + 1);
  });

  const index = useMemo(
    () =>
      buildAisleIndex(
        Object.entries(words).flatMap(([aisle, phrases]) =>
          isAisle(aisle) ? phrases.split("|").map((phrase) => [phrase, aisle] as const) : [],
        ),
      ),
    [words],
  );

  const items = useMemo<Item[]>(
    () =>
      withKeys(sortByAisles(deferred, index, LIMIT)).map((item) => {
        const key = nameKey(item.name);
        return Object.hasOwn(moves, key) ? { ...item, aisle: moves[key], recognised: true } : item;
      }),
    [deferred, index, moves],
  );
  const groups = useMemo(() => groupByAisle(items, order), [items, order]);

  const doneSet = new Set(done);
  const ticked = items.filter((item) => doneSet.has(item.key)).length;
  const left = items.length - ticked;
  const unknown = items.filter((item) => !item.recognised).length;
  const changedOrder = order.some((aisle, i) => aisle !== AISLES[i]);
  const corrections = Object.keys(moves).length;

  useEffect(() => {
    if (moved.current === null) return;
    const buttons = resultRef.current?.querySelectorAll<HTMLElement>("[data-move]") ?? [];
    [...buttons].find((button) => button.dataset.move === moved.current)?.focus();
    moved.current = null;
  }, [groups]);

  const toggle = (key: string) => {
    const here = new Set(items.map((item) => item.key));
    setDone(
      doneSet.has(key)
        ? done.filter((other) => other !== key)
        : [...done.filter((other) => here.has(other)), key],
    );
  };
  const focusResult = () => resultRef.current?.focus({ preventScroll: true });

  /** Moves an aisle past the next one that is on this list, not past an invisible one. */
  const moveAisle = (aisle: Aisle, step: -1 | 1) => {
    const visible = groups.map((group) => group.aisle);
    const from = visible.indexOf(aisle);
    const to = from + step;
    if (to < 0 || to >= visible.length) return;
    [visible[from], visible[to]] = [visible[to], visible[from]];
    setOrder(mergeActiveCategoryOrder(order, visible));
  };

  // What is ticked does not go any further, unless everything is.
  const groupsToBuy = groups
    .map(({ aisle, items: products }) => ({
      aisle,
      lines: left > 0 ? products.filter((item) => !doneSet.has((item as Item).key)) : products,
    }))
    .filter(({ lines }) => lines.length > 0);
  const toBuy = groupsToBuy.flatMap(({ lines }) => lines);
  const movedHere = Object.fromEntries(
    toBuy.flatMap((item) => {
      const key = nameKey(item.name);
      return Object.hasOwn(moves, key) ? [[key, moves[key]] as const] : [];
    }),
  );
  const trips = kangurParts(TITLE, toBuy);

  const showResult = () => {
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <div className={styles.tool}>
        <div className={styles.input}>
          <label htmlFor={fieldId}>Twoja lista</label>
          <textarea
            ref={fieldRef}
            id={fieldId}
            value={text}
            onChange={(event) => {
              byHand();
              setText(event.target.value);
              // An empty field is a new list, and last week's ticks are not for it.
              if (!event.target.value.trim()) clearDone();
            }}
            onPaste={({ currentTarget: { selectionStart, selectionEnd, value } }) => {
              if (value && selectionStart === 0 && selectionEnd === value.length) clearDone();
            }}
            placeholder={sample}
            rows={9}
            maxLength={20000}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
          />
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.main}
              aria-disabled={items.length === 0}
              onClick={() => {
                if (items.length > 0) showResult();
              }}
            >
              Ułóż według alejek
            </button>
            {text ? (
              <button
                type="button"
                onClick={() => {
                  byHand();
                  setCleared({ text, done });
                  clearText();
                  clearDone();
                  fieldRef.current?.focus();
                }}
              >
                Wyczyść
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    byHand();
                    setText(sample);
                    clearDone();
                    focusResult();
                  }}
                >
                  Wstaw przykład
                </button>
                {cleared ? (
                  <button
                    type="button"
                    onClick={() => {
                      byHand();
                      setText(cleared.text);
                      setDone(cleared.done);
                      setCleared(null);
                      focusResult();
                    }}
                  >
                    Cofnij
                  </button>
                ) : null}
              </>
            )}
          </div>
          <p className={styles.private}>Lista zostaje na tym urządzeniu. Nic nie wysyłamy.</p>
        </div>

        <div
          className={styles.result}
          ref={resultRef}
          tabIndex={-1}
          role="region"
          aria-label="Lista według alejek"
        >
          {items.length > 0 ? <h2 className="visually-hidden">{TITLE}</h2> : null}
          <div className={styles.summary}>
            <p role="status">
              {summary(items.length, groups.length, unknown)}
              {ticked > 0 ? ` Zostało ${left} z ${items.length}.` : null}
            </p>
            {items.length > 0 ? <HopButton /> : null}
            <div className={styles.resets}>
              {ticked > 0 ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={() => {
                    clearDone();
                    focusResult();
                  }}
                >
                  Odznacz wszystko ({ticked})
                </button>
              ) : null}
              {changedOrder && items.length > 0 ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={() => {
                    clearOrder();
                    focusResult();
                  }}
                >
                  Przywróć kolejność
                </button>
              ) : null}
              {corrections > 0 ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={() => {
                    clearMoves();
                    focusResult();
                  }}
                >
                  Zapomnij poprawki ({corrections})
                </button>
              ) : null}
            </div>
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>Tu pojawią się alejki.</p>
              <p>Wklej listę po przecinku albo w linijkach. „Aaa i proszek” też się nada.</p>
            </div>
          ) : (
            <>
              <div className={styles.groups}>
                {groups.map(({ aisle, items: products }, position) => (
                  <div key={aisle} className={styles.group}>
                    <header>
                      <h3>
                        <span aria-hidden>{AISLE_ICONS[aisle]}</span> {AISLE_LABELS[aisle]}
                      </h3>
                      <span className={styles.order}>
                        <button
                          type="button"
                          aria-disabled={position === 0}
                          aria-label={`${AISLE_LABELS[aisle]}: wcześniej`}
                          onClick={() => moveAisle(aisle, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-disabled={position === groups.length - 1}
                          aria-label={`${AISLE_LABELS[aisle]}: później`}
                          onClick={() => moveAisle(aisle, 1)}
                        >
                          ↓
                        </button>
                      </span>
                    </header>
                    <ul>
                      {(products as Item[]).map((item) => (
                        <li key={item.key} data-done={doneSet.has(item.key) || undefined}>
                          <label>
                            <input
                              type="checkbox"
                              checked={doneSet.has(item.key)}
                              onChange={() => toggle(item.key)}
                            />
                            <span>
                              {item.name}
                              {item.quantity ? (
                                <>
                                  {" "}
                                  <small>{item.quantity}</small>
                                </>
                              ) : null}
                            </span>
                          </label>
                          <MoveItem
                            item={item}
                            aisle={aisle}
                            onMove={(next) => {
                              moved.current = item.key;
                              setMoves({ ...moves, [nameKey(item.name)]: next });
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <HopBar count={toBuy.length} />
            </>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <ToKangur
          lines={["Oto Twoje alejki.", HANDOFF.loadThem]}
          chips={groupsToBuy.map(({ aisle, lines }) => ({
            icon: AISLE_ICONS[aisle],
            text: `${AISLE_LABELS[aisle]}: ${lines.length}`,
          }))}
          summary={typesetCopy([
            `Do kupienia: ${plural(toBuy.length, "produkt", "produkty", "produktów")}.`,
            ...(changedOrder || corrections > 0
              ? ["Kangur ułoży produkty w te same 24 alejki. Swoją kolejność ustawisz w nim jeszcze raz."]
              : []),
          ])}
          trips={trips}
          intro={HANDOFF.copy.parts}
          ticked={ticked === 0 ? "none" : left > 0 ? "some" : "all"}
          share={{
            title: TITLE,
            text: listToText(TITLE, groupsToBuy.map(({ aisle, lines }) => ({ title: AISLE_LABELS[aisle], lines }))),
            url: `https://www.getkangur.com${PATH}`,
          }}
          path={PATH}
          list={{
            t: toBuy.map(formatLine).join("\n"),
            ...(changedOrder ? { o: order.map((aisle) => AISLES.indexOf(aisle)) } : {}),
            ...(Object.keys(movedHere).length > 0 ? { m: movedHere } : {}),
          }}
          store="alejki"
          arrival={arrival}
          onBack={
            before
              ? () => {
                  setText(before.text);
                  setDone(before.done);
                  setOrder(before.order);
                  setMoves(before.moves);
                  setBefore(null);
                  setArrival(0);
                }
              : undefined
          }
          slots={slots}
        />
      ) : null}
    </>
  );
}

/**
 * Another aisle for one product. The select appears only when somebody asks for it: 24 options
 * next to every product is what makes a phone stutter. With the keyboard the choice counts on
 * Enter or when the focus leaves, not on every arrow.
 */
function MoveItem({
  item,
  aisle,
  onMove,
}: {
  item: Item;
  aisle: Aisle;
  onMove: (next: Aisle) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Aisle | null>(null);
  const byKeyboard = useRef(false);
  const returning = useRef(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      if (returning.current) buttonRef.current?.focus();
      returning.current = false;
      return;
    }
    const select = selectRef.current;
    select?.focus();
    try {
      select?.showPicker();
    } catch {
      // Older browsers: one more tap opens it.
    }
  }, [open]);

  /** `stay`: nothing moved and nobody clicked elsewhere, so the focus comes back. */
  const finish = (next: Aisle | null, stay: boolean) => {
    const moves = next !== null && next !== aisle;
    returning.current = stay && !moves;
    setOpen(false);
    setDraft(null);
    if (moves) onMove(next);
  };

  if (!open) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className={styles.move}
        data-move={item.key}
        aria-label={`Przenieś: ${item.name}`}
        onClick={() => setOpen(true)}
      >
        Przenieś
      </button>
    );
  }

  return (
    <select
      ref={selectRef}
      className={styles.aisle}
      aria-label={`Alejka: ${item.name}`}
      value={draft ?? aisle}
      onPointerDown={() => {
        byKeyboard.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finish(draft, true);
        } else if (event.key === "Escape") {
          finish(null, true);
        } else {
          byKeyboard.current = true;
        }
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (!isAisle(next)) return;
        if (byKeyboard.current) setDraft(next);
        else finish(next, true);
      }}
      onBlur={() => finish(draft, false)}
    >
      {AISLES.map((option) => (
        <option key={option} value={option}>
          {AISLE_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
