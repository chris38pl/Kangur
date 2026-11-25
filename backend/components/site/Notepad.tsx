import { Caveat } from "next/font/google";

import styles from "./Notepad.module.css";

// Only pages with a note download it, and only once the note is near the screen.
const caveat = Caveat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500"],
  display: "swap",
  preload: false,
});

/** A handwritten list the way it really hangs on a fridge. */
export function Notepad({
  lines,
  className,
}: {
  lines: readonly string[];
  className?: string;
}) {
  return (
    <div
      className={[styles.pad, caveat.className, className ?? ""]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <span className={styles.magnet} />
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
