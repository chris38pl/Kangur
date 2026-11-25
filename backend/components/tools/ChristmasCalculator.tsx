"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { CopyBox } from "@/components/site/CopyBox";
import { ListActions, ShareButton } from "@/components/tools/ListActions";
import { LeftToBuy, ListGroups, type LineGroup } from "@/components/tools/ListGroups";
import { Stepper } from "@/components/tools/Stepper";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import {
  CHRISTMAS,
  DEFAULT_PLAN,
  DISHES,
  EXTRAS,
  FORGOTTEN,
  HOME,
  OWN,
  PEOPLE,
  PRESETS,
  PRODUCTS,
  activePreset,
  applyPreset,
  christmasList,
  christmasTitle,
  dishCount,
  dishPlan,
  familyMessage,
  menu,
  readPlan,
  type ChristmasPlan,
  type Dish,
  type DishPlan,
  type OwnDish,
  type When,
} from "@/lib/marketing/lists/christmas";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { strings } from "@/lib/marketing/lists/stored";
import { useHydrated, useStored } from "@/lib/marketing/lists/use-stored";

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
const URL = "https://www.getkangur.com/poradniki/lista-zakupow-na-wigilie-i-swieta";

function verdict(count: number, people: number): string {
  if (count === 0) return "Bez Wigilii. Zostają cztery dni, kiedy duże sklepy śpią.";
  if (people <= 3 && count > 8) return "Na tak mały stół sześć dań to i tak uczta.";
  if (count < 12) return "Dwanaście to zwyczaj, a nie kontrola.";
  if (count === 12) return "Dwanaście. Tradycja policzona.";
  return "Więcej niż dwanaście. Ktoś będzie jadł na stojąco.";
}

export function ChristmasCalculator({
  code,
  nudge,
}: {
  /** Corner of the printed sheet. */
  code?: ReactNode;
  /** Where the list can go next. */
  nudge?: ReactNode;
}) {
  const [plan, setPlan, reset] = useStored<ChristmasPlan>("wigilia", DEFAULT_PLAN, readPlan);
  const [done, setDone, clearDone] = useStored(
    // Last year's ticks must not shorten this year's list.
    `wigilia-${CHRISTMAS.year}-kupione`,
    NOTHING_DONE,
    strings,
  );
  const [view, setView] = useState<"aisles" | "dates">("aisles");
  const listId = useId();
  // Until the page comes alive a choice would be lost, so the form waits.
  const ready = useHydrated();

  const lines = useMemo(() => christmasList(plan), [plan]);
  const count = dishCount(plan);
  const message = familyMessage(plan);
  const { ours, bring } = menu(plan);
  const people = plural(plan.people, "osoba", "osoby", "osób");
  const title = christmasTitle(plan);
  const preset = activePreset(plan);
  const doneSet = new Set(done);
  const left = lines.filter((line) => !doneSet.has(line.id)).length;
  const total = plural(lines.length, "produkt", "produkty", "produktów");

  const groups: LineGroup[] = (
    view === "aisles"
      ? AISLES.map((aisle): LineGroup => ({
          key: aisle,
          title: AISLE_LABELS[aisle],
          icon: AISLE_ICONS[aisle],
          lines: lines.filter((line) => line.aisle === aisle),
        }))
      : WHEN.map(({ id, title: name, hint }): LineGroup => ({
          key: id,
          title: name,
          hint,
          lines: lines.filter((line) => line.when === id),
        }))
  ).filter((group) => group.lines.length > 0);

  const text = listToText(
    title,
    groups.map((group) => ({
      title: group.title,
      // When everything is ticked, the whole list goes out, not an empty page.
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
          <legend>Ilu Was będzie?</legend>
          <a className={styles.jump} href={`#${listId}`}>
            Przejdź do listy, {total}
          </a>
          <Stepper
            label="Przy stole w Wigilię"
            hint="dwoje małych dzieci to mniej więcej jedna osoba"
            value={plan.people}
            unit={people}
            {...PEOPLE}
            onChange={(next) =>
              setPlan({ ...plan, people: next, home: Math.min(plan.home, Math.max(next, HOME.min)) })
            }
          />
          <Stepper
            label="Zostaje na kolejne dni"
            hint="śniadania i obiady po Wigilii, wybierasz je niżej"
            value={plan.home}
            unit={plural(plan.home, "osoba", "osoby", "osób")}
            {...HOME}
            onChange={(next) => setPlan({ ...plan, home: next })}
          />
          <div className={styles.checks}>
            <label>
              <input
                type="checkbox"
                checked={plan.meat}
                onChange={(event) => setPlan({ ...plan, meat: event.target.checked })}
              />
              <span>
                Jemy mięso
                <small>pieczeń, rosół i wędlina po Wigilii</small>
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={plan.seat}
                onChange={(event) => setPlan({ ...plan, seat: event.target.checked })}
              />
              <span>
                Dodatkowe nakrycie
                <small>jedna porcja więcej, gdyby ktoś jednak zapukał</small>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset disabled={!ready}>
          <legend>Dania</legend>
          <div className={styles.presets}>
            {PRESETS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={preset === id}
                onClick={() => setPlan(applyPreset(plan, id))}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={styles.verdict} aria-live="polite">
            <strong>{plural(count, "danie", "dania", "dań")}.</strong> {verdict(count, plan.people)}
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
          <OwnDishes own={plan.own} onChange={(own) => setPlan({ ...plan, own })} />
        </fieldset>

        <fieldset disabled={!ready}>
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
                  <small>
                    {!plan.meat && "meatless" in extra && "hint" in extra.meatless
                      ? extra.meatless.hint
                      : extra.hint}
                  </small>
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

      <div className={styles.result} id={listId} tabIndex={-1}>
        <div className={styles.resultHead}>
          <h2>{title}</h2>
          {count > 0 ? (
            <p className={styles.menu}>
              {ours.length > 0 ? <>Na stole: {ours.join(", ")}. </> : null}
              {bring.length > 0 ? <>Przynoszą: {bring.map((name) => `${name} ..............`).join(", ")}</> : null}
            </p>
          ) : null}
          <LeftToBuy total={total} left={left} ticked={lines.length - left} onUntick={clearDone} />
          <div className={styles.code}>{code}</div>
          {actions}
          <div className={styles.views} role="group" aria-label="Widok listy" data-noprint>
            <button type="button" aria-pressed={view === "aisles"} onClick={() => setView("aisles")}>
              Według alejek
            </button>
            <button type="button" aria-pressed={view === "dates"} onClick={() => setView("dates")}>
              Kiedy kupić
            </button>
          </div>
        </div>

        <ListGroups
          groups={groups}
          done={doneSet}
          partTitle={view === "dates" ? title : undefined}
          onToggle={(id) =>
            setDone(doneSet.has(id) ? done.filter((other) => other !== id) : [...done, id])
          }
        />

        {actions}
        {nudge}

        <div className={styles.family} data-noprint>
          <h3>Wiadomość do rodziny</h3>
          {message ? (
            <>
              <CopyBox text={message} label="Kopiuj wiadomość" done="Skopiowane" />
              <div className={styles.familyShare}>
                <ShareButton label="Wyślij rodzinie" title="Wigilia" text={message} />
              </div>
            </>
          ) : (
            <p>
              Przy daniach, które ktoś przyniesie, ustaw „Ktoś przynosi”. Ułożymy wiadomość do
              rodziny.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Moczka, makówki and everything else we do not know how to cook. */
function OwnDishes({
  own,
  onChange,
}: {
  own: readonly OwnDish[];
  onChange: (own: readonly OwnDish[]) => void;
}) {
  const [name, setName] = useState("");
  const id = useId();
  const clean = name.trim();
  const full = own.length >= OWN.max;

  const add = () => {
    if (!clean || full) return;
    onChange([...own, { name: clean, plan: "make" }]);
    setName("");
  };

  return (
    <div className={styles.own}>
      <label htmlFor={id}>Dopisz swoje danie</label>
      <div className={styles.ownRow}>
        <input
          id={id}
          value={name}
          maxLength={OWN.length}
          disabled={full}
          autoComplete="off"
          enterKeyHint="done"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
        />
        <button type="button" className={styles.plainButton} disabled={!clean || full} onClick={add}>
          Dodaj
        </button>
      </div>
      {own.length > 0 ? (
        <>
          <ul className={styles.dishes}>
            {own.map((dish, index) => (
              <li key={`${index}-${dish.name}`} data-plan={dish.plan}>
                <span className={styles.ownName}>{dish.name}</span>
                <select
                  aria-label={`${dish.name}: kto robi`}
                  value={dish.plan}
                  onChange={(event) =>
                    onChange(
                      own.map((other, i) =>
                        i === index
                          ? { ...other, plan: event.target.value === "bring" ? "bring" : "make" }
                          : other,
                      ),
                    )
                  }
                >
                  <option value="make">Robimy</option>
                  <option value="bring">Ktoś przynosi</option>
                </select>
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Usuń danie: ${dish.name}`}
                  onClick={() => onChange(own.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.small}>
            Składników nie znamy. Zna je Kangur: wpisz nazwę w „Z przepisu”.
          </p>
        </>
      ) : null}
    </div>
  );
}
