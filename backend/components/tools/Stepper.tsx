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
  return (
    <div className={styles.stepper} role="group" aria-labelledby={id}>
      <div>
        <p id={id}>{label}</p>
        {hint ? <small>{hint}</small> : null}
      </div>
      <div className={styles.stepperControls}>
        <button
          type="button"
          aria-label={`${label}: mniej`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <output aria-live="polite">{unit}</output>
        <button
          type="button"
          aria-label={`${label}: więcej`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
