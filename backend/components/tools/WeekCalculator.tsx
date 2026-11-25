"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { ListActions } from "@/components/tools/ListActions";
import { LeftToBuy, ListGroups, type LineGroup } from "@/components/tools/ListGroups";
import { Stepper } from "@/components/tools/Stepper";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { strings } from "@/lib/marketing/lists/stored";
import { useHydrated, useStored } from "@/lib/marketing/lists/use-stored";
import {
  DEFAULT_WEEK,
  WEEK_DINNERS,
  WEEK_PEOPLE,
  readWeek,
  weekList,
  type Trip,
  type WeekPlan,
} from "@/lib/marketing/lists/week";

import styles from "./Calculator.module.css";

const TRIPS: readonly { id: Trip; title: string; hint: string }[] = [
  { id: "main", title: "Duże zakupy", hint: "W wolny dzień. Ciężkie i trwałe." },
  { id: "topup", title: "Dokupka", hint: "Kilka dni później. Świeże, na krótko." },
  { id: "cupboard", title: "Najpierw sprawdź szafkę", hint: "Starcza na dłużej niż tydzień." },
];

const PRESETS: readonly { label: string; people: number }[] = [
  { label: "Jedna osoba", people: 1 },
  { label: "Dwie", people: 2 },
  { label: "Cztery", people: 4 },
];

const NOTHING_DONE: readonly string[] = [];
const URL = "https://www.getkangur.com/poradniki/lista-zakupow-na-tydzien";

export function WeekCalculator({
  code,
  nudge,
}: {
  /** Corner of the printed sheet. */
  code?: ReactNode;
  /** Where the list can go next. */
  nudge?: ReactNode;
}) {
  const [plan, setPlan, reset] = useStored<WeekPlan>("tydzien", DEFAULT_WEEK, readWeek);
  const [done, setDone, clearDone] = useStored("tydzien-kupione", NOTHING_DONE, strings);
  const [view, setView] = useState<"trips" | "aisles">("trips");
  const listId = useId();
  // Until the page comes alive a choice would be lost, so the form waits.
  const ready = useHydrated();

  const lines = useMemo(() => weekList(plan), [plan]);
  const people = plural(plan.people, "osoba", "osoby", "osób");
  const title = `Lista zakupów na tydzień, ${people}`;
  const doneSet = new Set(done);
  const left = lines.filter((line) => !doneSet.has(line.id)).length;
  const total = plural(lines.length, "produkt", "produkty", "produktów");

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
    groups.map((group) => ({
      title: group.title,
      lines: left > 0 ? group.lines.filter((line) => !doneSet.has(line.id)) : group.lines,
    })),
  );
  const actions = (
    <ListActions
      title={title}
      text={text}
      url={URL}
      copied={left > 0 && left < lines.length ? `Skopiowane: ${left} z ${lines.length}` : undefined}
    />
  );

  return (
    <div className={styles.calculator}>
      <form className={styles.form} data-noprint onSubmit={(event) => event.preventDefault()}>
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
                onClick={() => setPlan({ ...plan, people: preset.people })}
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
            onChange={(next) => setPlan({ ...plan, people: next })}
          />
          <Stepper
            label="Obiady w domu"
            hint="reszta w pracy, w szkole albo na mieście"
            value={plan.dinners}
            unit={plural(plan.dinners, "obiad", "obiady", "obiadów")}
            {...WEEK_DINNERS}
            onChange={(next) => setPlan({ ...plan, dinners: next })}
          />
          <div className={styles.checks}>
            <label>
              <input
                type="checkbox"
                checked={plan.meat}
                onChange={(event) => setPlan({ ...plan, meat: event.target.checked })}
              />
              <span>Jemy mięso</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={plan.cupboard}
                onChange={(event) => setPlan({ ...plan, cupboard: event.target.checked })}
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
            reset();
            clearDone();
          }}
        >
          Zacznij od nowa
        </button>
      </form>

      <div className={styles.result} id={listId} tabIndex={-1}>
        <div className={styles.resultHead}>
          <h2>{title}</h2>
          <LeftToBuy total={total} left={left} ticked={lines.length - left} onUntick={clearDone} />
          <div className={styles.code}>{code}</div>
          {actions}
          <div className={styles.views} role="group" aria-label="Widok listy" data-noprint>
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
          partTitle={view === "trips" ? title : undefined}
          onToggle={(id) =>
            setDone(doneSet.has(id) ? done.filter((other) => other !== id) : [...done, id])
          }
        />

        {actions}
        {nudge}
      </div>
    </div>
  );
}
