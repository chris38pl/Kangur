import { CATALOG_PRODUCTS } from "@shared/product-catalog";

import { UNSHOWN, buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import { AISLES, AISLE_ICONS, AISLE_LABELS } from "@/lib/marketing/aisles/labels";

import styles from "./AisleTable.module.css";

const SHOWN = 9;

/** "Płyn do WC" keeps its capitals. */
const small = (label: string) => label[0].toLocaleLowerCase("pl") + label.slice(1);

/**
 * Every aisle of the app with products from its catalogue, straight from the code. Aisles
 * the catalogue leaves empty show what the tool knows about them.
 */
export function AisleTable() {
  const words = buildAisleWords().filter(([word]) => !UNSHOWN.has(word));
  const aisleOf = new Map(words);

  return (
    <dl className={styles.table}>
      {AISLES.map((aisle) => {
        const products = CATALOG_PRODUCTS.filter(
          (product) => aisleOf.get(product.labels.pl.toLocaleLowerCase("pl")) === aisle,
        ).map((product) => small(product.labels.pl));
        const names =
          products.length >= 3
            ? products
            : [...new Set([...products, ...words.filter(([, a]) => a === aisle).map(([w]) => w)])];
        const rest = names.slice(SHOWN);
        return (
          <div key={aisle}>
            <dt>
              <span aria-hidden>{AISLE_ICONS[aisle]}</span> {AISLE_LABELS[aisle]}
            </dt>
            <dd>
              {names.slice(0, SHOWN).join(", ")}
              {rest.length > 0 ? (
                <details>
                  <summary>
                    Pokaż wszystkie<span className="visually-hidden">: {AISLE_LABELS[aisle]}</span>
                  </summary>
                  {rest.join(", ")}
                </details>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
