"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Headline } from "@/components/site/Headline";
import { ShareButton } from "@/components/tools/ShareButton";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { copyText } from "@/lib/marketing/copy-text";
import { plural } from "@/lib/marketing/lists/format";
import type { KangurPart } from "@/lib/marketing/lists/parts";

import styles from "./ToKangur.module.css";

/** Where every tool ends. The address is in links and in our QR codes. */
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

const HandoffQr = dynamic(() => import("./HandoffQr").then((module) => module.HandoffQr), { ssr: false });

/** The same screens as in ToKangur.module.css: a list ends up on a phone, so it needs a code. */
const COMPUTER = "(min-width: 900px) and (hover: hover) and (pointer: fine)";

function watchScreen(listener: () => void) {
  const screen = window.matchMedia(COMPUTER);
  screen.addEventListener("change", listener);
  return () => screen.removeEventListener("change", listener);
}

const products = (count: number) => plural(count, "produkt", "produkty", "produktów");

/** The way to the end: a bar at the bottom of a phone's screen. */
export function HopBar({ count }: { count: number }) {
  return (
    <a className={styles.bar} href={`#${END}`}>
      {HANDOFF.jump} <small>{products(count)}</small>
    </a>
  );
}

/** The same on a computer, above the list. */
export function HopButton() {
  return (
    <a className={styles.hop} href={`#${END}`}>
      {HANDOFF.jump}
    </a>
  );
}

/** What came out of the tool, and three steps that take it into the app. */
export function ToKangur({
  line,
  chips,
  summary,
  trips,
  whole,
  intro,
  ticked,
  share,
  path,
  list,
  inviteTitle = HANDOFF.invite.title,
  arrived,
  onBack,
  slots,
}: {
  /** First line of the heading: "Oto Wasze dania." */
  line: string;
  chips: readonly string[];
  summary: string;
  trips: readonly KangurPart[];
  /** Everything in one list, for those who do not want several. */
  whole?: KangurPart;
  intro?: string;
  ticked: boolean;
  share: { title: string; text: string; url: string };
  /** Short address of this tool and what has to be set there to get the same list. */
  path: string;
  list: Record<string, unknown>;
  inviteTitle?: string;
  /** The page was opened with a list from a computer. */
  arrived: boolean;
  /** Brings back the list that was here before. */
  onBack?: () => void;
  slots: KangurSlots;
}) {
  const headingId = useId();
  const ref = useRef<HTMLElement>(null);
  const computer = useSyncExternalStore(
    watchScreen,
    () => window.matchMedia(COMPUTER).matches,
    () => false,
  );

  useEffect(() => {
    if (arrived) ref.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [arrived]);

  return (
    <section className={styles.band} id={END} aria-labelledby={headingId} ref={ref}>
      <div className={styles.head}>
        {slots.kangur}
        <div>
          <div className={styles.arrived}>
            <p role="status">{arrived ? HANDOFF.arrived : null}</p>
            {arrived && onBack ? (
              <button type="button" className={styles.quiet} onClick={onBack}>
                {HANDOFF.back}
              </button>
            ) : null}
          </div>
          <Headline id={headingId} lines={[line, HANDOFF.hop]} />
          {chips.length > 0 ? (
            <ul className={styles.chips}>
              {chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          ) : null}
          <p className={styles.summary}>{summary}</p>
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
          <div className={styles.qr}>{computer ? <HandoffQr path={path} list={list} /> : null}</div>
          <div className={styles.main}>
            <p className={styles.forComputer}>{HANDOFF.qr.body}</p>
            <p className={styles.forPhone}>{ticked ? HANDOFF.copy.ticked : HANDOFF.copy.home}</p>
            <CopyParts trips={trips} whole={whole} intro={intro} share={share} />
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
            {inviteTitle}
          </h3>
          <p className={styles.main}>{HANDOFF.invite.body}</p>
          {slots.space}
          <p className={styles.more}>{slots.link}</p>
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
}: {
  trips: readonly KangurPart[];
  whole?: KangurPart;
  intro?: string;
  share: { title: string; text: string; url: string };
}) {
  /** Text copied from each part. A list changed since then is not copied any more. */
  const [copied, setCopied] = useState<Readonly<Record<string, string>>>({});
  const [last, setLast] = useState<{ key: string; text: string; ok: boolean; shared?: boolean } | null>(null);

  const isCopied = (part: KangurPart) => copied[part.key] === part.text;
  const next = trips.find((part) => !isCopied(part));
  const current = last === null ? undefined : [...trips, ...(whole ? [whole] : [])].find(({ key }) => key === last.key);

  const take = async (part: KangurPart) => {
    const ok = await copyText(part.text);
    setLast({ key: part.key, text: part.text, ok });
    setCopied((before) => ({ ...before, [part.key]: ok ? part.text : "" }));
  };
  /** The share sheet did not open, so the message is at least in the clipboard. */
  const takeMessage = async () => {
    const ok = await copyText(share.text);
    setLast({ key: "", text: share.text, ok, shared: true });
  };

  const message = !last
    ? null
    : !last.ok
      ? HANDOFF.copy.refused
      : last.shared
        ? HANDOFF.copy.shareFailed
        : !current || !isCopied(current)
          ? null
          : next && current !== whole
            ? HANDOFF.copy.more
            : HANDOFF.copy.next;
  const toKangur = message === HANDOFF.copy.more || message === HANDOFF.copy.next;

  return (
    <div className={styles.copy}>
      <p className={`${styles.here} ${styles.forComputer}`}>{HANDOFF.copy.here}</p>
      {trips.length === 1 ? (
        <button type="button" className={`${styles.button} ${styles.primary} ${styles.wide}`} onClick={() => void take(trips[0])}>
          {isCopied(trips[0]) ? `${HANDOFF.copy.done}: ${products(trips[0].count)}` : HANDOFF.copy.one}
        </button>
      ) : (
        <>
          {intro ? <p>{intro}</p> : null}
          <ul className={styles.parts}>
            {trips.map((part) => (
              <li key={part.key}>
                <span>
                  <strong>{part.label}</strong> <small>{products(part.count)}</small>
                </span>
                <button
                  type="button"
                  className={part === next ? `${styles.button} ${styles.primary}` : styles.button}
                  onClick={() => void take(part)}
                >
                  {isCopied(part) ? HANDOFF.copy.done : HANDOFF.copy.part}
                  <span className="visually-hidden">: {part.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div role="status">
        {message ? (
          <p className={styles.message}>
            {toKangur ? (
              <>
                <span className={styles.forPhone}>{message}</span>
                <span className={styles.forComputer}>{HANDOFF.copy.computer}</span>
              </>
            ) : (
              message
            )}
          </p>
        ) : null}
      </div>
      {last && !last.ok ? (
        <textarea
          className={styles.manual}
          aria-label={HANDOFF.copy.manual}
          readOnly
          value={last.text}
          rows={8}
          onFocus={(event) => event.target.select()}
        />
      ) : null}

      <div className={styles.others}>
        {whole && trips.length > 1 ? (
          <button type="button" className={styles.quiet} onClick={() => void take(whole)}>
            {isCopied(whole) ? `${HANDOFF.copy.done}: ${products(whole.count)}` : HANDOFF.copy.whole}
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
