"use client";

import { useMemo, useState, type ReactNode } from "react";

import { ListActions } from "@/components/tools/ListActions";
import { ListGroups, type LineGroup } from "@/components/tools/ListGroups";
import { Stepper } from "@/components/tools/Stepper";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { useStored } from "@/lib/marketing/lists/use-stored";
import {
  DEFAULT_WEEK,
  WEEK_DINNERS,
  WEEK_PEOPLE,
  weekList,
  type Trip,
  type WeekPlan,
} from "@/lib/marketing/lists/week";

import styles from "./Calculator.module.css";

const TRIPS: readonly { id: Trip; title: string; hint: string }[] = [
  { id: "main", title: "Duże zakupy", hint: "W weekend. Ciężkie i trwałe." },
  { id: "topup", title: "Dokupka", hint: "W środku tygodnia. Świeże, na kilka dni." },
  { id: "cupboard", title: "Najpierw sprawdź szafkę", hint: "Starcza na dłużej niż tydzień." },
];

const PRESETS: readonly { label: string; people: number }[] = [
  { label: "Jedna osoba", people: 1 },
  { label: "Dwie", people: 2 },
  { label: "Rodzina 2+2", people: 4 },
];

const NOTHING_DONE: readonly string[] = [];

export function WeekCalculator({ children }: { children?: ReactNode }) {
  const [stored, setPlan, reset] = useStored<WeekPlan>("tydzien", DEFAULT_WEEK);
  const [done, setDone, clearDone] = useStored("tydzien-kupione", NOTHING_DONE);
  const [view, setView] = useState<"trips" | "aisles">("trips");

  const plan = useMemo(() => ({ ...DEFAULT_WEEK, ...stored }), [stored]);
  const lines = useMemo(() => weekList(plan), [plan]);
  const people = plural(plan.people, "osoba", "osoby", "osób");
  const title = `Zakupy na tydzień, ${people}`;
  const doneSet = new Set(done);

  const groups: LineGroup[] =
    view === "trips"
      ? TRIPS.map(({ id, title: name, hint }) => ({
          key: id,
          title: name,
          hint,
          lines: lines.filter((line) => line.when === id),
        })).filter((group) => group.lines.length > 0)
      : AISLES.map((aisle) => ({
          key: aisle,
          title: AISLE_LABELS[aisle],
          icon: AISLE_ICONS[aisle],
          lines: lines.filter((line) => line.aisle === aisle),
        })).filter((group) => group.lines.length > 0);

  return (
    <div className={styles.calculator}>
      <form className={styles.form} data-noprint onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>Dla kogo ta lista?</legend>
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
            label="Ile osób je w domu"
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

      <div className={styles.result}>
        <div className={styles.resultHead}>
          <h2>{title}</h2>
          <p aria-live="polite">
            {plural(lines.length, "produkt", "produkty", "produktów")}.
            <span data-noprint> Co masz w domu, odhacz i nie kupuj.</span>
          </p>
          <div className={styles.views} data-noprint>
            <button
              type="button"
              aria-pressed={view === "trips"}
              onClick={() => setView("trips")}
            >
              Duże zakupy i dokupka
            </button>
            <button
              type="button"
              aria-pressed={view === "aisles"}
              onClick={() => setView("aisles")}
            >
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

        <ListActions
          title={title}
          text={listToText(
            title,
            groups.map((group) => ({
              title: group.title,
              lines: group.lines.filter((line) => !doneSet.has(line.id)),
            })),
          )}
        />
        <p className={styles.kangurHint} data-noprint>
          Skopiowaną listę wkleisz do Kangura przez „Tekst ze schowka”. To jedno użycie AI, a lista
          od tej chwili jest wspólna.
        </p>
        <div className={styles.sheetFoot}>{children}</div>
      </div>
    </div>
  );
}
