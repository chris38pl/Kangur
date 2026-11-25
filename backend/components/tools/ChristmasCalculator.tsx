"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { CopyBox } from "@/components/site/CopyBox";
import { LeftToBuy, ListGroups, type LineGroup } from "@/components/tools/ListGroups";
import { ShareButton } from "@/components/tools/ShareButton";
import { Stepper } from "@/components/tools/Stepper";
import { HopBar, HopButton, ToKangur, type KangurSlots } from "@/components/tools/ToKangur";
import { useCopy } from "@/components/tools/use-copy";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
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
  WHEN,
  activePreset,
  applyPreset,
  christmasList,
  christmasTitle,
  christmasTrips,
  dishCount,
  dishPlan,
  familyMessage,
  menu,
  mostStaying,
  planChanges,
  readPlan,
  staying,
  type ChristmasPlan,
  type Dish,
  type DishPlan,
  type OwnDish,
} from "@/lib/marketing/lists/christmas";
import { listToText, plural } from "@/lib/marketing/lists/format";
import { packTicks, unpackTicks } from "@/lib/marketing/lists/handoff";
import { strings } from "@/lib/marketing/lists/stored";
import { useArrival } from "@/lib/marketing/lists/use-arrival";
import { hasStored, readStored, useHydrated, useStored } from "@/lib/marketing/lists/use-stored";
import { typesetPl } from "@/lib/marketing/typography";

import styles from "./Calculator.module.css";

const PLANS: readonly { id: DishPlan; label: string }[] = [
  { id: "make", label: "Robimy" },
  { id: "buy", label: "Kupujemy gotowe" },
  { id: "bring", label: "Ktoś przynosi" },
  { id: "skip", label: "Nie w tym roku" },
];

const NOTHING_DONE: readonly string[] = [];
const PLAN_KEY = "wigilia";
// Last year's ticks must not shorten this year's list.
const DONE_KEY = `wigilia-${CHRISTMAS.year}-kupione`;
/** Short address: in the code to scan, and next to a list sent in a message. */
const PATH = "/wigilia";
const URL = `https://www.getkangur.com${PATH}`;

function verdict(count: number, people: number): string {
  if (count === 0) return "Bez Wigilii. Zostają cztery dni, kiedy duże sklepy śpią.";
  if (people <= 3 && count > 8) return "Na tak mały stół sześć dań to i tak uczta.";
  if (count < 12) return "Dwanaście to zwyczaj, a nie kontrola.";
  if (count === 12) return "Dwanaście. Tradycja policzona.";
  return "Więcej niż dwanaście. Ktoś będzie jadł na stojąco.";
}

export function ChristmasCalculator({ slots }: { slots: KangurSlots }) {
  const [plan, setPlan, reset] = useStored<ChristmasPlan>(PLAN_KEY, DEFAULT_PLAN, readPlan);
  const [done, setDone, clearDone] = useStored(DONE_KEY, NOTHING_DONE, strings);
  const [view, setView] = useState<"dates" | "aisles">("dates");
  /** The plan from before a preset, a reset or a scanned code. Promises are not deleted by a curious tap. */
  const [before, setBefore] = useState<{
    plan: ChristmasPlan;
    done: readonly string[];
    by: "preset" | "reset" | "code";
  } | null>(null);
  const [arrived, setArrived] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  // Until the page comes alive a choice would be lost, so the form waits.
  const ready = useHydrated();

  /** A change by hand: from now on there is nothing to go back to. */
  const change = (next: ChristmasPlan) => {
    setBefore(null);
    setPlan(next);
  };
  const undo = () => {
    if (!before) return;
    setPlan(before.plan);
    setDone(before.done);
    setBefore(null);
    setArrived(false);
    if (before.by === "preset") presetsRef.current?.querySelector("button")?.focus();
    if (before.by === "reset") resetRef.current?.focus();
  };

  useArrival((list) => {
    const next = readPlan(list.p);
    const here = readStored(PLAN_KEY, DEFAULT_PLAN, readPlan);
    const same = JSON.stringify(planChanges(here)) === JSON.stringify(planChanges(next));
    setBefore(
      hasStored(PLAN_KEY) && !same
        ? { plan: here, done: readStored(DONE_KEY, NOTHING_DONE, strings), by: "code" }
        : null,
    );
    setPlan(next);
    setDone(unpackTicks(list.d, christmasList(next).map((line) => line.id)));
    setArrived(true);
  });

  const lines = useMemo(() => christmasList(plan), [plan]);
  const count = dishCount(plan);
  const message = familyMessage(plan);
  const { ours, bring } = menu(plan);
  const people = plural(plan.people, "osoba", "osoby", "osób");
  const title = christmasTitle(plan);
  const preset = activePreset(plan);
  const doneSet = new Set(done);
  const left = lines.filter((line) => !doneSet.has(line.id)).length;
  // When everything is ticked, the whole list goes out, not an empty one.
  const toBuy = left > 0 ? lines.filter((line) => !doneSet.has(line.id)) : lines;
  const going = new Set(toBuy.map((line) => line.id));
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
    groups.map((group) => ({ title: group.title, lines: group.lines.filter((line) => going.has(line.id)) })),
  );
  const home = staying(plan);
  const { trips, whole } = christmasTrips(plan, toBuy);
  const guests = count > 0 ? plan.people : plan.home;

  return (
    <>
      <div className={styles.calculator}>
        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
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
              onChange={(next) => change({ ...plan, people: next })}
            />
            <Stepper
              label="Zostaje na kolejne dni"
              hint="śniadania i obiady po Wigilii, wybierasz je niżej"
              value={home}
              unit={plural(home, "osoba", "osoby", "osób")}
              min={HOME.min}
              max={mostStaying(plan)}
              onChange={(next) => change({ ...plan, home: next })}
            />
            <div className={styles.checks}>
              <label>
                <input
                  type="checkbox"
                  checked={plan.meat}
                  onChange={(event) => change({ ...plan, meat: event.target.checked })}
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
                  onChange={(event) => change({ ...plan, seat: event.target.checked })}
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
            <div className={styles.presets} ref={presetsRef}>
              {PRESETS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={preset === id}
                  onClick={() => {
                    // Two presets in a row still go back to what was set by hand.
                    setBefore(before?.by === "preset" ? before : { plan, done, by: "preset" });
                    setPlan(applyPreset(plan, id));
                  }}
                >
                  {label}
                </button>
              ))}
              {before?.by === "preset" ? (
                <button type="button" className={styles.undo} onClick={undo}>
                  Cofnij
                </button>
              ) : null}
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
                        change({
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
            <OwnDishes own={plan.own} onChange={(own) => change({ ...plan, own })} />
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
                      change({
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
                        change({
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

          <div className={styles.resetRow}>
            <button
              ref={resetRef}
              type="button"
              className={styles.plainButton}
              onClick={() => {
                setBefore({ plan, done, by: "reset" });
                reset();
                clearDone();
              }}
            >
              Zacznij od nowa
            </button>
            {before?.by === "reset" ? (
              <button type="button" className={styles.undo} onClick={undo}>
                Cofnij
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.result} id={listId} tabIndex={-1}>
          <div className={styles.sheet}>
            <div className={styles.resultHead}>
              <h2>{title}</h2>
              {lines.length > 0 ? (
                <LeftToBuy total={total} left={left} ticked={lines.length - left} onUntick={clearDone} />
              ) : (
                <p>Lista jest pusta. Włącz jakieś danie albo posiłek.</p>
              )}
              {lines.length > 0 ? <HopButton /> : null}
              <div className={styles.views} role="group" aria-label="Widok listy">
                <button type="button" aria-pressed={view === "dates"} onClick={() => setView("dates")}>
                  Kiedy kupić
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
            {lines.length > 0 ? <HopBar count={toBuy.length} /> : null}
          </div>

          <div className={styles.family}>
            <h3>Wiadomość do rodziny</h3>
            {message ? (
              <FamilyMessage text={message} />
            ) : (
              <p>
                Przy daniach, które ktoś przyniesie, ustaw „Ktoś przynosi”. Ułożymy wiadomość do
                rodziny.
              </p>
            )}
          </div>
        </div>
      </div>

      {lines.length > 0 ? (
        <ToKangur
          line={count === 0 ? "Oto cztery dni bez sklepu." : plan.people === 1 ? "Oto Twoje dania." : "Oto Wasze dania."}
          chips={ours}
          summary={typesetPl(
            [
              bring.length > 0 ? `Przynoszą: ${bring.join(", ")}.` : "",
              `Do kupienia: ${plural(toBuy.length, "produkt", "produkty", "produktów")} na ${plural(guests, "osobę", "osoby", "osób")}.`,
            ]
              .filter(Boolean)
              .join(" "),
          )}
          trips={trips}
          whole={whole}
          intro={HANDOFF.copy.trips[trips.length]}
          ticked={left > 0 && left < lines.length}
          share={{ title, text, url: URL }}
          path={PATH}
          list={{ p: planChanges(plan), d: packTicks(lines.map((line) => line.id), doneSet) }}
          inviteTitle={HANDOFF.invite.titleFamily}
          arrived={arrived}
          onBack={before?.by === "code" ? undo : undefined}
          slots={slots}
        />
      ) : null}
    </>
  );
}

/** Who brings what, ready to send. When the share sheet does not open, it is copied. */
function FamilyMessage({ text }: { text: string }) {
  const [state, copy] = useCopy();
  return (
    <>
      <CopyBox text={text} label="Kopiuj wiadomość" done="Skopiowane" />
      <div className={styles.familyShare}>
        <ShareButton label="Wyślij rodzinie" title="Wigilia" text={text} onRefused={() => void copy(text)} />
        <p role="status" className={styles.small}>
          {state === "copied" ? "Wysyłanie się nie otworzyło, więc wiadomość jest skopiowana." : null}
        </p>
      </div>
    </>
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Place of the dish that has just been removed: the keyboard goes to its neighbour. */
  const removed = useRef<number | null>(null);
  const clean = name.trim();
  const full = own.length >= OWN.max;

  useEffect(() => {
    if (removed.current === null) return;
    const crosses = listRef.current?.querySelectorAll("button") ?? [];
    (crosses[Math.min(removed.current, crosses.length - 1)] ?? inputRef.current)?.focus();
    removed.current = null;
  }, [own]);

  // Nothing here is ever disabled: what is disabled drops the keyboard focus.
  const add = () => {
    inputRef.current?.focus();
    if (!clean || full) return;
    onChange([...own, { name: clean, plan: "make" }]);
    setName("");
  };

  return (
    <div className={styles.own}>
      <label htmlFor={id}>Dopisz swoje danie</label>
      <div className={styles.ownRow}>
        <input
          ref={inputRef}
          id={id}
          value={name}
          maxLength={OWN.length}
          readOnly={full}
          aria-disabled={full || undefined}
          aria-describedby={full ? `${id}-full` : undefined}
          autoComplete="off"
          enterKeyHint="done"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
        />
        <button
          type="button"
          className={styles.plainButton}
          aria-disabled={!clean || full}
          onClick={add}
        >
          Dodaj
        </button>
      </div>
      <p role="status" id={`${id}-full`} className={styles.small}>
        {full ? `Najwyżej ${OWN.max} własnych dań. Usuń któreś, żeby dodać następne.` : null}
      </p>
      {own.length > 0 ? (
        <>
          <ul className={styles.dishes} ref={listRef}>
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
                  onClick={() => {
                    removed.current = index;
                    onChange(own.filter((_, i) => i !== index));
                  }}
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
