"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Headline } from "@/components/site/Headline";
import { HandoffQr } from "@/components/tools/HandoffQr";
import { ShareButton } from "@/components/tools/ShareButton";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { copyText } from "@/lib/marketing/copy-text";
import { plural } from "@/lib/marketing/lists/format";
import { QR_LIMIT, packList } from "@/lib/marketing/lists/handoff";
import type { KangurPart } from "@/lib/marketing/lists/parts";
import { isRecord } from "@/lib/marketing/lists/stored";
import { useHydrated, useStored } from "@/lib/marketing/lists/use-stored";

import styles from "./ToKangur.module.css";

/** Where every tool ends. Links on the page lead here. */
const END = "do-kangura";

/** Rendered on the server: pictures and links do not have to travel with the scripts. */
export type KangurSlots = {
  kangur: ReactNode;
  /** Cut out of the real Start screen: "Szybkie akcje" and "Aktywna przestrzeń". */
  quick: ReactNode;
  space: ReactNode;
  stores: ReactNode;
  link: ReactNode;
};

export type Chip = { icon?: string; text: string };

/** A mouse or a touchpad: the list is on a computer, and Kangur is in a pocket. */
const COMPUTER = "(hover: hover) and (pointer: fine)";

function watchPointer(listener: () => void) {
  const query = window.matchMedia(COMPUTER);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

const products = (count: number) => plural(count, "produkt", "produkty", "produktów");

/** Short and stable: the same text always gives the same mark. */
function fingerprint(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(36)}.${text.length.toString(36)}`;
}

const NO_COPIES: Readonly<Record<string, string>> = {};
const readCopies = (stored: unknown): Readonly<Record<string, string>> =>
  isRecord(stored)
    ? Object.fromEntries(
        Object.entries(stored).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      )
    : NO_COPIES;

/** After a jump the keyboard and screen readers carry on from the section, not from the link. */
function focusEnd() {
  requestAnimationFrame(() => document.getElementById(END)?.focus({ preventScroll: true }));
}

/** The way to the end: a bar at the bottom of a phone's screen. */
export function HopBar({ count }: { count: number }) {
  return (
    <a className={styles.bar} href={`#${END}`} onClick={focusEnd}>
      {HANDOFF.jump} <small>{products(count)}</small>
    </a>
  );
}

/** The same above the list, where there is no bar. */
export function HopButton() {
  return (
    <a className={styles.hop} href={`#${END}`} onClick={focusEnd}>
      {HANDOFF.jump}
    </a>
  );
}

/** What came out of the tool, and three steps that take it into the app. */
export function ToKangur({
  lines,
  chips,
  summary,
  trips,
  whole,
  intro,
  ticked,
  share,
  path,
  list,
  store,
  invite = HANDOFF.invite,
  family,
  arrival,
  onBack,
  slots,
}: {
  /** "Oto Wasze dania.", "Wczytaj je do Kangura." */
  lines: readonly [string, string];
  chips: readonly Chip[];
  summary: readonly string[];
  trips: readonly KangurPart[];
  /** Everything in one list, for those who do not want several. */
  whole?: KangurPart;
  intro?: string;
  ticked: "none" | "some" | "all";
  share: { title: string; text: string; url: string };
  /** Short address of this tool and what has to be set there to get the same list. */
  path: string;
  list: Record<string, unknown>;
  /** Where this tool keeps its notes, so the copies are remembered after a reload. */
  store: string;
  invite?: { title: string; body: string };
  /** Christmas only: the message for the family that is not in the household. */
  family?: ReactNode;
  /** Grows every time a list arrives from a computer. Zero: it did not. */
  arrival: number;
  /** Brings back the list that was here before. */
  onBack?: () => void;
  slots: KangurSlots;
}) {
  const headingId = useId();
  const ref = useRef<HTMLElement>(null);
  const computer = useSyncExternalStore(
    watchPointer,
    () => window.matchMedia(COMPUTER).matches,
    () => false,
  );
  const url = computer ? window.location.origin + path + packList(list) : "";
  const fits = new TextEncoder().encode(url).length <= QR_LIMIT;

  useEffect(() => {
    if (arrival > 0) ref.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [arrival]);

  return (
    <section className={styles.band} id={END} aria-labelledby={headingId} ref={ref} tabIndex={-1}>
      <div className={styles.head}>
        {slots.kangur}
        <div>
          <div className={arrival > 0 ? styles.arrived : undefined}>
            <p role="status">{arrival > 0 ? HANDOFF.arrived : null}</p>{" "}
            {arrival > 0 && onBack ? (
              <button
                type="button"
                className={styles.quiet}
                onClick={() => {
                  onBack();
                  ref.current?.focus({ preventScroll: true });
                }}
              >
                {HANDOFF.back}
              </button>
            ) : null}
          </div>
          <Headline id={headingId} lines={lines} />
          {chips.length > 0 ? (
            <ul className={styles.chips}>
              {chips.map((chip, i) => (
                <li key={`${i}-${chip.text}`}>
                  {chip.icon ? <span aria-hidden>{chip.icon} </span> : null}
                  {chip.text}
                </li>
              ))}
            </ul>
          ) : null}
          {summary.map((sentence) => (
            <p key={sentence} className={styles.summary}>
              {sentence}
            </p>
          ))}
        </div>
      </div>

      <ol className={styles.steps}>
        <li className={`${styles.step} ${styles.take}`}>
          <h3>
            <span className={styles.number} aria-hidden>
              1
            </span>
            <span className={styles.forPhone}>{HANDOFF.copy.title}</span>
            <span className={styles.forComputer}>{HANDOFF.copy.titleComputer}</span>
          </h3>
          {computer && fits ? <p className={styles.lead}>{HANDOFF.qr.body}</p> : null}
          {computer ? (
            <div className={styles.qr}>
              {fits ? <HandoffQr url={url} /> : <p className={styles.long}>{HANDOFF.qr.long}</p>}
            </div>
          ) : null}
          <div className={styles.main}>
            <p>
              {ticked === "all" ? HANDOFF.copy.all : ticked === "some" ? HANDOFF.copy.ticked : HANDOFF.copy.home}
            </p>
            <CopyParts
              trips={trips}
              whole={whole}
              intro={intro}
              share={share}
              store={store}
              computer={computer}
            />
          </div>
        </li>

        <li className={styles.step}>
          <h3>
            <span className={styles.number} aria-hidden>
              2
            </span>
            {HANDOFF.open.title}
          </h3>
          <p className={styles.main}>{HANDOFF.open.body}</p>
          {slots.quick}
          <div className={styles.more}>
            <p>{HANDOFF.open.stores}</p>
            {slots.stores}
          </div>
        </li>

        <li className={styles.step}>
          <h3>
            <span className={styles.number} aria-hidden>
              3
            </span>
            {invite.title}
          </h3>
          <p className={styles.main}>{invite.body}</p>
          {slots.space}
          <p className={styles.more}>{slots.link}</p>
          {family ? <div className={styles.extra}>{family}</div> : null}
        </li>
      </ol>

      <p className={styles.note}>{HANDOFF.note}</p>
    </section>
  );
}

function CopyParts({
  trips,
  whole,
  intro,
  share,
  store,
  computer,
}: {
  trips: readonly KangurPart[];
  whole?: KangurPart;
  intro?: string;
  share: { title: string; text: string; url: string };
  store: string;
  computer: boolean;
}) {
  // Taps before the page comes alive would be lost.
  const ready = useHydrated();
  /** What was copied from each part, remembered after a trip to Kangur and back. */
  const [copied, setCopied] = useStored(`${store}-skopiowane`, NO_COPIES, readCopies);
  const [last, setLast] = useState<{ key: string; ok: boolean; shared?: boolean } | null>(null);

  const isCopied = (part: KangurPart) => copied[part.key] === fingerprint(part.text);
  const many = trips.length > 1;
  const wholeCopied = whole !== undefined && many && isCopied(whole);
  const next = wholeCopied ? undefined : trips.find((part) => !isCopied(part));
  const offerWhole = whole !== undefined && many && (wholeCopied || !trips.some(isCopied));
  const current =
    last && !last.shared ? [...trips, ...(whole ? [whole] : [])].find(({ key }) => key === last.key) : undefined;

  const take = async (part: KangurPart) => {
    const ok = await copyText(part.text);
    setLast({ key: part.key, ok });
    if (ok) setCopied({ ...copied, [part.key]: fingerprint(part.text) });
  };
  /** The share sheet did not open, so the message is at least in the clipboard. */
  const takeMessage = async () => {
    const ok = await copyText(share.text);
    setLast({ key: "", ok, shared: true });
  };

  const done = current && isCopied(current) ? current : undefined;
  const which = done && many && done !== whole ? `${HANDOFF.copy.done}: ${done.label}.` : `${HANDOFF.copy.done}.`;
  const what = computer ? HANDOFF.copy.computer : next ? HANDOFF.copy.more : HANDOFF.copy.next;
  const message = !last
    ? null
    : !last.ok
      ? HANDOFF.copy.refused
      : last.shared
        ? HANDOFF.copy.shareFailed
        : done
          ? `${which} ${what}`
          : null;
  const manual = last && !last.ok ? (last.shared ? share.text : (current?.text ?? "")) : null;

  return (
    <div>
      {computer ? <p className={styles.here}>{HANDOFF.copy.here}</p> : null}
      {many ? (
        <>
          {intro ? <p>{intro}</p> : null}
          <ul className={styles.parts}>
            {trips.map((part) => {
              const label = isCopied(part) ? HANDOFF.copy.done : HANDOFF.copy.part;
              return (
                <li key={part.key}>
                  <span>
                    <strong>{part.label}</strong> <small>{products(part.count)}</small>
                  </span>
                  <button
                    type="button"
                    className={part === next ? `${styles.button} ${styles.primary}` : styles.button}
                    aria-label={`${label}: ${part.label}`}
                    disabled={!ready}
                    onClick={() => void take(part)}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : trips.length === 1 ? (
        <button
          type="button"
          className={`${styles.button} ${styles.primary} ${styles.wide}`}
          disabled={!ready}
          onClick={() => void take(trips[0])}
        >
          {isCopied(trips[0]) ? `${HANDOFF.copy.done}: ${products(trips[0].count)}` : HANDOFF.copy.one}
        </button>
      ) : null}

      <div role="status">{message ? <p className={styles.message}>{message}</p> : null}</div>
      {manual !== null ? (
        <textarea
          className={styles.manual}
          aria-label={HANDOFF.copy.manual}
          readOnly
          value={manual}
          rows={8}
          onFocus={(event) => event.target.select()}
        />
      ) : null}

      <div className={styles.others}>
        {offerWhole ? (
          <button type="button" className={styles.quiet} disabled={!ready} onClick={() => void take(whole)}>
            {wholeCopied ? `${HANDOFF.copy.done}: ${products(whole.count)}` : HANDOFF.copy.whole}
          </button>
        ) : null}
        <ShareButton
          className={styles.quiet}
          label={HANDOFF.copy.share}
          title={share.title}
          text={share.text}
          url={share.url}
          onRefused={() => void takeMessage()}
        />
      </div>
    </div>
  );
}
