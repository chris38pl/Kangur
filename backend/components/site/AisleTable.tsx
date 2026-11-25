import { CATALOG_PRODUCTS } from "@shared/product-catalog";

import { buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";
import { plural } from "@/lib/marketing/lists/format";

import styles from "./AisleTable.module.css";

const SHOWN = 9;

/** "Płyn do WC" keeps its capitals. */
const small = (label: string) => label[0].toLocaleLowerCase("pl") + label.slice(1);

/**
 * Every aisle of the app with products from its catalogue, straight from the code. Aisles
 * the catalogue leaves empty show what the tool knows about them.
 */
export function AisleTable() {
  const words = buildAisleWords();

  return (
    <dl className={styles.table}>
      {AISLES.map((aisle) => {
        const products = CATALOG_PRODUCTS.filter((p) => p.category === aisle).map((p) =>
          small(p.labels.pl),
        );
        const names =
          products.length >= 3
            ? products
            : [...new Set([...products, ...words.filter(([, a]) => a === aisle).map(([w]) => w)])];
        return (
          <div key={aisle}>
            <dt>
              <span aria-hidden>{AISLE_ICONS[aisle]}</span> {AISLE_LABELS[aisle]}
              {products.length > 0 ? (
                <small>{plural(products.length, "produkt", "produkty", "produktów")}</small>
              ) : null}
            </dt>
            <dd>
              {names.slice(0, SHOWN).join(", ")}
              {names.length > SHOWN ? "..." : ""}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
