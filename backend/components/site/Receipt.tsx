import styles from "./Receipt.module.css";

export type ReceiptLine =
  | { kind: "head"; text: string }
  | { kind: "item"; text: string; price: string; note?: string }
  | { kind: "rule" }
  | { kind: "total"; text: string; price: string }
  | { kind: "foot"; text: string };

/** The price list as a shop receipt. A definition list underneath, so it reads in order. */
export function Receipt({
  lines,
  label,
}: {
  lines: readonly ReceiptLine[];
  label: string;
}) {
  return (
    <div className={styles.receipt} role="group" aria-label={label}>
      {lines.map((line, index) => {
        switch (line.kind) {
          case "head":
            return (
              <p key={index} className={styles.head}>
                {line.text}
              </p>
            );
          case "rule":
            return <hr key={index} className={styles.rule} />;
          case "foot":
            return (
              <p key={index} className={styles.foot}>
                {line.text}
              </p>
            );
          default:
            return (
              <p
                key={index}
                className={line.kind === "total" ? styles.total : styles.item}
              >
                <span>
                  {line.text}
                  {"note" in line && line.note ? (
                    <small>{line.note}</small>
                  ) : null}
                </span>
                <span className={styles.dots} aria-hidden />
                <span className={styles.price}>{line.price}</span>
              </p>
            );
        }
      })}
    </div>
  );
}
