"use client";

import { useId, useMemo, useState } from "react";

import { LeftToBuy, ListGroups, type LineGroup } from "@/components/tools/ListGroups";
import { Stepper } from "@/components/tools/Stepper";
import { HopBar, HopButton, ToKangur, type KangurSlots } from "@/components/tools/ToKangur";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { packTicks, unpackTicks } from "@/lib/marketing/lists/handoff";
import { strings } from "@/lib/marketing/lists/stored";
import { useArrival } from "@/lib/marketing/lists/use-arrival";
import { hasStored, readStored, useHydrated, useStored } from "@/lib/marketing/lists/use-stored";
import {
  DEFAULT_WEEK,
  WEEK_DINNERS,
  WEEK_PEOPLE,
  readWeek,
  weekChanges,
  weekList,
  weekTrips,
  type Trip,
  type WeekPlan,
} from "@/lib/marketing/lists/week";
import { typesetCopy } from "@/lib/marketing/typography";

import styles from "./Calculator.module.css";

const TRIPS = typesetCopy<readonly { id: Trip; title: string; hint: string }[]>([
  { id: "main", title: "Duże zakupy", hint: "W wolny dzień. Ciężkie i trwałe." },
  { id: "topup", title: "Dokupka", hint: "Kilka dni później. Świeże, na krótko." },
  {
    id: "cupboard",
    title: "Najpierw sprawdź szafkę",
    hint: "Starcza na dłużej niż tydzień. Czego nie zaznaczysz, trafi na duże zakupy.",
  },
]);

const sameTicks = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

const PRESETS: readonly { label: string; people: number }[] = [
  { label: "Jedna osoba", people: 1 },
  { label: "Dwie", people: 2 },
  { label: "Cztery", people: 4 },
];

const NOTHING_DONE: readonly string[] = [];
const PLAN_KEY = "tydzien";
const DONE_KEY = "tydzien-kupione";
/** Short address: in the code to scan, and next to a list sent in a message. */
const PATH = "/tydzien";
const URL = `https://www.getkangur.com${PATH}`;

export function WeekCalculator({ slots }: { slots: KangurSlots }) {
  const [plan, setPlan, reset] = useStored<WeekPlan>(PLAN_KEY, DEFAULT_WEEK, readWeek);
  const [done, setDone, clearDone] = useStored(DONE_KEY, NOTHING_DONE, strings);
  const [view, setView] = useState<"trips" | "aisles">("trips");
  /** Grows with every list that comes from a computer, back to zero after a change by hand. */
  const [arrival, setArrival] = useState(0);
  /** The week that was here before a code was scanned. */
  const [before, setBefore] = useState<{ plan: WeekPlan; done: readonly string[] } | null>(null);
  const listId = useId();
  // Until the page comes alive a choice would be lost, so the form waits.
  const ready = useHydrated();

  /** A change by hand: from now on there is nothing to go back to. */
  const change = (next: WeekPlan) => {
    setBefore(null);
    setArrival(0);
    setPlan(next);
  };

  useArrival((list) => {
    const next = readWeek(list.p);
    const nextDone = unpackTicks(list.d, weekList(next).map((line) => line.id));
    const here = readStored(PLAN_KEY, DEFAULT_WEEK, readWeek);
    const hereDone = readStored(DONE_KEY, NOTHING_DONE, strings);
    const same = JSON.stringify(weekChanges(here)) === JSON.stringify(weekChanges(next)) && sameTicks(hereDone, nextDone);
    setBefore((hasStored(PLAN_KEY) || hereDone.length > 0) && !same ? { plan: here, done: hereDone } : null);
    setPlan(next);
    setDone(nextDone);
    setArrival((count) => count + 1);
  });

  const lines = useMemo(() => weekList(plan), [plan]);
  const people = plural(plan.people, "osoba", "osoby", "osób");
  const title = `Lista zakupów na tydzień, ${people}`;
  const doneSet = new Set(done);
  const left = lines.filter((line) => !doneSet.has(line.id)).length;
  // When everything is ticked, the whole list goes out, not an empty one.
  const toBuy = left > 0 ? lines.filter((line) => !doneSet.has(line.id)) : lines;
  const going = new Set(toBuy.map((line) => line.id));
  const total = plural(lines.length, "produkt", "produkty", "produktów");
  const trips = weekTrips(toBuy);

  const groups: LineGroup[] = (
    view === "trips"
      ? TRIPS.map(({ id, title: name, hint }): LineGroup => ({
          key: id,
          title: name,
          hint,
          lines: lines.filter((line) => line.when === id),
        }))
      : AISLES.map((aisle): LineGroup => ({
          key: aisle,
          title: AISLE_LABELS[aisle],
          icon: AISLE_ICONS[aisle],
          lines: lines.filter((line) => line.aisle === aisle),
        }))
  ).filter((group) => group.lines.length > 0);

  const text = listToText(
    title,
    groups.map((group) => ({ title: group.title, lines: group.lines.filter((line) => going.has(line.id)) })),
  );
  const inCupboard = toBuy.filter((line) => line.when === "cupboard").length;
  const tens = inCupboard % 100;
  const may = inCupboard % 10 >= 2 && inCupboard % 10 <= 4 && !(tens >= 12 && tens <= 14) ? "mogą" : "może";
  const summary = typesetCopy([
    `Do kupienia: ${plural(toBuy.length, "produkt", "produkty", "produktów")} na ${plural(plan.people, "osobę", "osoby", "osób")}${
      plan.dinners === 0 ? ", bez obiadów w domu" : ` i ${plural(plan.dinners, "obiad", "obiady", "obiadów")}`
    }.`,
    ...(inCupboard > 0
      ? [`Zanim skopiujesz, zajrzyj do szafki. ${plural(inCupboard, "produkt", "produkty", "produktów")} z listy ${may} już tam być.`]
      : []),
  ]);

  return (
    <>
      <div className={styles.calculator}>
        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          <fieldset disabled={!ready}>
            <legend>Dla kogo ta lista?</legend>
            <a className={styles.jump} href={`#${listId}`}>
              Przejdź do listy, {total}
            </a>
            <div className={styles.views}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.people}
                  type="button"
                  aria-pressed={plan.people === preset.people}
                  onClick={() => change({ ...plan, people: preset.people })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Stepper
              label="Ile osób jest w domu"
              hint="dwoje małych dzieci to mniej więcej jedna osoba"
              value={plan.people}
              unit={people}
              {...WEEK_PEOPLE}
              onChange={(next) => change({ ...plan, people: next })}
            />
            <Stepper
              label="Obiady w domu"
              hint="reszta w pracy, w szkole albo na mieście"
              value={plan.dinners}
              unit={plural(plan.dinners, "obiad", "obiady", "obiadów")}
              {...WEEK_DINNERS}
              onChange={(next) => change({ ...plan, dinners: next })}
            />
            <div className={styles.checks}>
              <label>
                <input
                  type="checkbox"
                  checked={plan.meat}
                  onChange={(event) => change({ ...plan, meat: event.target.checked })}
                />
                <span>Jemy mięso</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={plan.cupboard}
                  onChange={(event) => change({ ...plan, cupboard: event.target.checked })}
                />
                <span>
                  Pokaż też zapasy
                  <small>olej, kawa, papier toaletowy</small>
                </span>
              </label>
            </div>
          </fieldset>
          <button
            type="button"
            className={styles.plainButton}
            onClick={() => {
              setBefore(null);
              setArrival(0);
              reset();
              clearDone();
            }}
          >
            Zacznij od nowa
          </button>
        </form>

        <div className={styles.result} id={listId} tabIndex={-1}>
          <div>
            <div className={styles.resultHead}>
              <h2>{title}</h2>
              <LeftToBuy total={total} left={left} ticked={lines.length - left} onUntick={clearDone} />
              <HopButton />
              <div className={styles.views} role="group" aria-label="Widok listy">
                <button type="button" aria-pressed={view === "trips"} onClick={() => setView("trips")}>
                  Duże zakupy i dokupka
                </button>
                <button type="button" aria-pressed={view === "aisles"} onClick={() => setView("aisles")}>
                  Według alejek
                </button>
              </div>
            </div>

            <ListGroups
              groups={groups}
              done={doneSet}
              onToggle={(id) =>
                setDone(doneSet.has(id) ? done.filter((other) => other !== id) : [...done, id])
              }
            />
            <HopBar count={toBuy.length} />
          </div>
        </div>
      </div>

      <ToKangur
        lines={[plan.people === 1 ? "Oto Twój tydzień." : "Oto Wasz tydzień.", HANDOFF.loadIt]}
        chips={trips.map((part) => ({ text: `${part.label}: ${part.count}` }))}
        summary={summary}
        trips={trips}
        intro={HANDOFF.copy.trips[trips.length]}
        ticked={left === 0 ? "all" : left < lines.length ? "some" : "none"}
        share={{ title, text, url: URL }}
        path={PATH}
        list={{ p: weekChanges(plan), d: packTicks(lines.map((line) => line.id), doneSet) }}
        store={PLAN_KEY}
        invite={plan.people === 1 ? HANDOFF.alone : undefined}
        arrival={arrival}
        onBack={
          before
            ? () => {
                setPlan(before.plan);
                setDone(before.done);
                setBefore(null);
                setArrival(0);
              }
            : undefined
        }
        slots={slots}
      />
    </>
  );
}
