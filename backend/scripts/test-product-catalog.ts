/**
 * Product catalog unit checks.
 * Run from backend/: pnpm exec tsx scripts/test-product-catalog.ts
 */
import assert from "node:assert/strict";

import {
  assertCatalogLabelCompleteness,
  assertCatalogLabelUniqueness,
  CATALOG_PRODUCTS,
  matchCatalogProduct,
  searchCatalogProducts,
} from "@shared/product-catalog";

assertCatalogLabelCompleteness(CATALOG_PRODUCTS);
assertCatalogLabelUniqueness(CATALOG_PRODUCTS);
assert.ok(
  CATALOG_PRODUCTS.length >= 80 && CATALOG_PRODUCTS.length <= 320,
  `seed size ${CATALOG_PRODUCTS.length}`,
);

// slugs must be unique
{
  const slugs = CATALOG_PRODUCTS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate catalog slug");
}

// --- search ranking ---
{
  const hits = searchCatalogProducts("pomid", "pl", 6);
  assert.ok(hits.length > 0 && hits.length <= 6);
  const slugs = hits.map((h) => h.product.slug);
  assert.ok(slugs.includes("tomatoes") || slugs.includes("tomatoes_cherry"));
}

{
  const hits = searchCatalogProducts("ser", "pl", 6);
  const first = hits[0]?.product.slug;
  // "ser" should prefer cheese over contains noise
  assert.equal(first, "cheese");
}

{
  const hits = searchCatalogProducts("pieczar", "pl", 6);
  assert.equal(hits[0]?.product.slug, "champignons");
}

{
  const slugs = searchCatalogProducts("czereś", "pl", 6).map(
    (h) => h.product.slug,
  );
  assert.ok(slugs.includes("sweet_cherries"), slugs.join(","));
}

{
  const slugs = searchCatalogProducts("karków", "pl", 6).map(
    (h) => h.product.slug,
  );
  assert.ok(slugs.includes("pork_neck"), slugs.join(","));
}

// --- strict match: equivalent aliases OK ---
assert.equal(matchCatalogProduct("kartofle", "pl")?.slug, "potatoes");
assert.equal(matchCatalogProduct("kartofel", "pl")?.slug, "potatoes");
assert.equal(matchCatalogProduct("ziemniaki", "pl")?.slug, "potatoes");
assert.equal(matchCatalogProduct("passata", "pl")?.slug, "passata");
assert.equal(matchCatalogProduct("pomidorki", "pl")?.slug, "tomatoes_cherry");
assert.equal(
  matchCatalogProduct("pomidorki koktajlowe", "pl")?.slug,
  "tomatoes_cherry",
);
assert.equal(matchCatalogProduct("pomidory", "pl")?.slug, "tomatoes");
assert.equal(
  matchCatalogProduct("pomidory malinowe", "pl")?.slug,
  "tomatoes_raspberry",
);
assert.equal(matchCatalogProduct("pietruszka", "pl")?.slug, "parsley_root");
assert.equal(matchCatalogProduct("bułka tarta", "pl")?.slug, "breadcrumbs");
assert.equal(matchCatalogProduct("wołowina mielona", "pl")?.slug, "ground_beef");
assert.equal(matchCatalogProduct("mielone", "pl")?.slug, "minced_meat");
assert.equal(matchCatalogProduct("ser żółty", "pl")?.slug, "yellow_cheese");
assert.equal(matchCatalogProduct("pieczarki", "pl")?.slug, "champignons");
assert.equal(matchCatalogProduct("włoszczyzna", "pl")?.slug, "soup_vegetables");
assert.equal(matchCatalogProduct("czereśnie", "pl")?.slug, "sweet_cherries");
assert.equal(matchCatalogProduct("wiśnie", "pl")?.slug, "cherries");
assert.equal(
  matchCatalogProduct("kapusta pekińska", "pl")?.slug,
  "chinese_cabbage",
);
assert.equal(matchCatalogProduct("botwina", "pl")?.slug, "beet_greens");
assert.equal(matchCatalogProduct("fenkuł", "pl")?.slug, "fennel");
assert.equal(matchCatalogProduct("paluszki", "pl")?.slug, "salty_sticks");
assert.equal(
  matchCatalogProduct("serek wiejski", "pl")?.slug,
  "cottage_cheese_curds",
);
assert.equal(matchCatalogProduct("karkówka", "pl")?.slug, "pork_neck");

// --- strict match: general words stay on the generic product ---
assert.equal(matchCatalogProduct("kapusta", "pl")?.slug, "cabbage");
assert.equal(matchCatalogProduct("sałata", "pl")?.slug, "lettuce");
assert.equal(matchCatalogProduct("cebula", "pl")?.slug, "onion");
assert.equal(matchCatalogProduct("ogórki", "pl")?.slug, "cucumber");
assert.equal(matchCatalogProduct("grzyby", "pl")?.slug, "mushrooms");
assert.equal(matchCatalogProduct("papryka", "pl")?.slug, "bell_pepper");
assert.equal(matchCatalogProduct("kukurydza", "pl")?.slug, "corn");
assert.equal(matchCatalogProduct("groszek", "pl")?.slug, "green_peas");
assert.equal(matchCatalogProduct("orzechy", "pl")?.slug, "nuts");
assert.equal(matchCatalogProduct("cukier", "pl")?.slug, "sugar");
assert.equal(matchCatalogProduct("mąka", "pl")?.slug, "flour");
assert.equal(matchCatalogProduct("ocet", "pl")?.slug, "vinegar");
assert.equal(matchCatalogProduct("jogurt", "pl")?.slug, "yogurt");
assert.equal(matchCatalogProduct("kiełbasa", "pl")?.slug, "sausage");
assert.equal(matchCatalogProduct("schabowy", "pl")?.slug, "pork_chops");
assert.equal(matchCatalogProduct("seler naciowy", "pl")?.slug, "celery");
assert.equal(matchCatalogProduct("ogórki kiszone", "pl")?.slug, "pickles");

// --- strict match: specificity preserved (must miss) ---
assert.equal(matchCatalogProduct("mleko 2%", "pl"), null);
assert.equal(matchCatalogProduct("mleczko kokosowe", "pl"), null);
assert.equal(matchCatalogProduct("serek", "pl"), null);

// pomidorki / malinowe must NEVER resolve to plain tomatoes
assert.notEqual(matchCatalogProduct("pomidorki", "pl")?.slug, "tomatoes");
assert.notEqual(
  matchCatalogProduct("pomidory malinowe", "pl")?.slug,
  "tomatoes",
);

console.log(
  `product-catalog ok (${CATALOG_PRODUCTS.length} products)`,
);
