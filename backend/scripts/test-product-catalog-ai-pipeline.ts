/**
 * Catalog match → category corrections pipeline fixtures.
 * Run: pnpm exec tsx scripts/test-product-catalog-ai-pipeline.ts
 */
import assert from "node:assert/strict";

import { applyCategoryCorrection } from "@shared/category-corrections";
import {
  matchCatalogProduct,
  resolveCatalogLabel,
} from "@shared/product-catalog";

function normalizeNameCategory(name: string, locale: "pl" | "en") {
  const hit = matchCatalogProduct(name, locale);
  const afterCatalog = hit
    ? {
        name: resolveCatalogLabel(hit, locale),
        category: hit.category,
      }
    : { name, category: "other" as const };

  const corrected = applyCategoryCorrection(
    afterCatalog.name,
    afterCatalog.category,
  );

  return {
    name: afterCatalog.name,
    category: corrected.category,
  };
}

// Specificity preserved
assert.equal(normalizeNameCategory("ser żółty", "pl").name, "Ser żółty");
assert.equal(normalizeNameCategory("ser żółty", "pl").category, "dairy");
assert.equal(normalizeNameCategory("mleko 2%", "pl").name, "mleko 2%");

// Equivalent alias + catalog label
assert.equal(normalizeNameCategory("kartofle", "pl").name, "Ziemniaki");
assert.equal(normalizeNameCategory("kartofle", "pl").category, "vegetables");
assert.equal(normalizeNameCategory("pomidorki", "pl").name, "Pomidorki koktajlowe");
assert.notEqual(normalizeNameCategory("pomidorki", "pl").name, "Pomidory");

// Oil safety via corrections (after catalog)
{
  const out = normalizeNameCategory("oliwa z oliwek", "pl");
  assert.equal(out.category, "other");
}

// History merge: EN input labels normalize to actor locale (not hardcoded EN).
assert.equal(normalizeNameCategory("Milk", "pl").name, "Mleko");
assert.equal(normalizeNameCategory("Bread", "pl").name, "Chleb");
assert.equal(normalizeNameCategory("Mleko", "en").name, "Milk");

console.log("product-catalog AI pipeline ok");
