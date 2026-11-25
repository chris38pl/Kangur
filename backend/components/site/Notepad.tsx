import { NOTE_FONTS } from "@/lib/marketing/fonts.generated";
import type { AppLocale } from "@/lib/marketing/locale";

import styles from "./Notepad.module.css";

/** A handwritten list the way it really hangs on a fridge. The font has only its letters. */
export function Notepad({
  lines,
  locale,
  className,
}: {
  lines: readonly string[];
  locale: AppLocale;
  className?: string;
}) {
  const family = `Kartka ${locale}`;
  return (
    <div
      className={[styles.pad, className ?? ""].filter(Boolean).join(" ")}
      style={{ fontFamily: `"${family}", "Segoe Print", cursive` }}
      aria-hidden
    >
      <style href={`note-${locale}`} precedence="fonts">
        {`@font-face{font-family:"${family}";font-display:swap;src:url(${NOTE_FONTS[locale].file}) format("woff2")}`}
      </style>
      <span className={styles.magnet} />
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
