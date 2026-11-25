"use client";

import { useId } from "react";

import styles from "./Calculator.module.css";

/** A number changed with a thumb. */
export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** Already in the right Polish form: "8 osób". */
  unit: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  // aria-disabled, because a button that becomes disabled drops the keyboard focus.
  const step = (next: number) => {
    if (next >= min && next <= max) onChange(next);
  };

  return (
    <div
      className={styles.stepper}
      role="group"
      aria-labelledby={id}
      aria-describedby={hint ? hintId : undefined}
    >
      <div>
        <p id={id}>{label}</p>
        {hint ? <small id={hintId}>{hint}</small> : null}
      </div>
      <div className={styles.stepperControls}>
        <button
          type="button"
          aria-label={`${label}: mniej`}
          aria-disabled={value <= min}
          onClick={() => step(value - 1)}
        >
          −
        </button>
        <output aria-live="polite">{unit}</output>
        <button
          type="button"
          aria-label={`${label}: więcej`}
          aria-disabled={value >= max}
          onClick={() => step(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
