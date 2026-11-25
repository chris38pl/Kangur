"use client";

import { useMemo, useState, type ReactNode } from "react";

import { CopyBox } from "@/components/site/CopyBox";
import { ListActions } from "@/components/tools/ListActions";
import { ListGroups, type LineGroup } from "@/components/tools/ListGroups";
import { Stepper } from "@/components/tools/Stepper";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import {
  DEFAULT_PLAN,
  DISHES,
  EXTRAS,
  FORGOTTEN,
  HOME,
  PEOPLE,
  PRODUCTS,
  christmasList,
  dishPlan,
  familyMessage,
  onTheTable,
  type ChristmasPlan,
  type Dish,
  type DishPlan,
  type When,
} from "@/lib/marketing/lists/christmas";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { useStored } from "@/lib/marketing/lists/use-stored";

import styles from "./Calculator.module.css";

const WHEN: readonly { id: When; title: string; hint: string }[] = [
  { id: "early", title: "Do 13 grudnia", hint: "Suche, w słoikach i puszkach. Poczeka w szafce." },
  { id: "weekend", title: "19 i 20 grudnia", hint: "Ostatni weekend. 20 grudnia to niedziela handlowa." },
  { id: "last", title: "22 i 23 grudnia", hint: "Świeże. Od 24 do 27 grudnia duże sklepy są zamknięte." },
];

const PLANS: readonly { id: DishPlan; label: string }[] = [
  { id: "make", label: "Robimy" },
  { id: "buy", label: "Kupujemy gotowe" },
  { id: "bring", label: "Ktoś przynosi" },
  { id: "skip", label: "Nie w tym roku" },
];

const NOTHING_DONE: readonly string[] = [];

function verdict(count: number): string {
  if (count === 0) return "Pusty stół. Odważnie.";
  if (count < 12) {
    return `Do dwunastu brakuje ${12 - count}. Chleb i masło się nie liczą, pytaliśmy.`;
  }
  if (count === 12) return "Dwanaście. Tradycja policzona.";
  return "Więcej niż dwanaście. Ktoś będzie jadł na stojąco.";
}

export function ChristmasCalculator({ children }: { children?: ReactNode }) {
  const [stored, setPlan, reset] = useStored<ChristmasPlan>("wigilia", DEFAULT_PLAN);
  const [done, setDone, clearDone] = useStored("wigilia-kupione", NOTHING_DONE);
  const [view, setView] = useState<"aisles" | "dates">("aisles");

  // Saved by an older version of the page, maybe without a field.
  const plan = useMemo(() => ({ ...DEFAULT_PLAN, ...stored }), [stored]);
  const lines = useMemo(() => christmasList(plan), [plan]);
  const table = onTheTable(plan);
  const message = familyMessage(plan);
  const people = plural(plan.people, "osoba", "osoby", "osób");

  const groups: LineGroup[] =
    view === "aisles"
      ? AISLES.map((aisle) => ({
          key: aisle,
          title: AISLE_LABELS[aisle],
          icon: AISLE_ICONS[aisle],
          lines: lines.filter((line) => line.aisle === aisle),
        })).filter((group) => group.lines.length > 0)
      : WHEN.map(({ id, title, hint }) => ({
          key: id,
          title,
          hint,
          lines: lines.filter((line) => line.when === id),
        })).filter((group) => group.lines.length > 0);

  const title = `Wigilia i święta 2026, ${people}`;
  const doneSet = new Set(done);

  return (
    <div className={styles.calculator}>
      <form className={styles.form} data-noprint onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>Ilu Was będzie?</legend>
          <Stepper
            label="Przy stole w Wigilię"
            value={plan.people}
            unit={people}
            {...PEOPLE}
            onChange={(next) => setPlan({ ...plan, people: next })}
          />
          <Stepper
            label="Zostaje na kolejne dni"
            hint="śniadania i obiady 25-27 grudnia"
            value={plan.home}
            unit={plural(plan.home, "osoba", "osoby", "osób")}
            {...HOME}
            onChange={(next) => setPlan({ ...plan, home: next })}
          />
        </fieldset>

        <fieldset>
          <legend>Dania</legend>
          <p className={styles.verdict} aria-live="polite">
            <strong>{plural(table.length, "danie", "dania", "dań")}.</strong> {verdict(table.length)}
          </p>
          <ul className={styles.dishes}>
            {(DISHES as readonly Dish[]).map((dish) => {
              const choice = dishPlan(plan, dish);
              const id = `danie-${dish.id}`;
              return (
                <li key={dish.id} data-plan={choice}>
                  <label htmlFor={id}>{dish.name}</label>
                  <select
                    id={id}
                    value={choice}
                    onChange={(event) =>
                      setPlan({
                        ...plan,
                        dishes: { ...plan.dishes, [dish.id]: event.target.value as DishPlan },
                      })
                    }
                  >
                    {PLANS.filter(({ id: option }) => option !== "buy" || dish.ready).map(
                      ({ id: option, label }) => (
                        <option key={option} value={option}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset>
          <legend>Poza daniami</legend>
          <div className={styles.checks}>
            {EXTRAS.map((extra) => (
              <label key={extra.id}>
                <input
                  type="checkbox"
                  checked={plan.extras[extra.id] ?? extra.on}
                  onChange={(event) =>
                    setPlan({
                      ...plan,
                      extras: { ...plan.extras, [extra.id]: event.target.checked },
                    })
                  }
                />
                <span>
                  {extra.label}
                  <small>{extra.hint}</small>
                </span>
              </label>
            ))}
          </div>
          <details className={styles.more}>
            <summary>O tym się zapomina</summary>
            <div className={styles.checks}>
              {FORGOTTEN.map(({ id, on }) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={plan.forgotten[id] ?? on}
                    onChange={(event) =>
                      setPlan({
                        ...plan,
                        forgotten: { ...plan.forgotten, [id]: event.target.checked },
                      })
                    }
                  />
                  <span>{PRODUCTS[id].name}</span>
                </label>
              ))}
            </div>
          </details>
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
            {plural(lines.length, "produkt", "produkty", "produktów")} do kupienia.
            <span data-noprint> Co masz w szafce, odhacz i nie kupuj.</span>
          </p>
          <div className={styles.views} data-noprint>
            <button
              type="button"
              aria-pressed={view === "aisles"}
              onClick={() => setView("aisles")}
            >
              Według alejek
            </button>
            <button
              type="button"
              aria-pressed={view === "dates"}
              onClick={() => setView("dates")}
            >
              Kiedy kupić
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

        {message ? (
          <div className={styles.family} data-noprint>
            <h3>Wiadomość do rodziny</h3>
            <CopyBox text={message} label="Kopiuj wiadomość" done="Skopiowane" />
          </div>
        ) : null}

        <div className={styles.sheetFoot}>{children}</div>
      </div>
    </div>
  );
}
