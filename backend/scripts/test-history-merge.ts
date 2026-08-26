/**
 * Smoke asserts for deterministic history-merge identity + clustering.
 * Run: pnpm exec tsx scripts/test-history-merge.ts
 */

import assert from "node:assert/strict";

import { toProductIdentityKey } from "../../shared/history-product-identity";
import {
  formatDefaultShoppingListTitle,
  SHOPPING_LIST_TITLE_MAX_LENGTH,
} from "../../shared/shopping-list/default-list-title";
import {
  mergeHistoryLists,
  type HistorySourceList,
} from "../features/shopping-list/mergeHistoryLists";

function list(
  id: string,
  updatedAt: string,
  items: Array<{ name: string; category?: string }>,
  preferredForAi = false,
): HistorySourceList {
  return {
    id,
    name: `List ${id}`,
    updatedAt,
    preferredForAi,
    recencyWeight: 1,
    items: items.map((item) => ({
      name: item.name,
      amount: null,
      note: null,
      category: item.category ?? "vegetables",
      normalizedName: item.name.toLowerCase(),
    })),
  };
}

// Identity
assert.equal(toProductIdentityKey("pomidory"), toProductIdentityKey("pomidorki"));
assert.equal(toProductIdentityKey("piwo"), toProductIdentityKey("piwko"));
assert.equal(toProductIdentityKey("ziemniaki"), toProductIdentityKey("kartofle"));
assert.notEqual(toProductIdentityKey("ser"), toProductIdentityKey("deser"));
assert.notEqual(toProductIdentityKey("mleko"), toProductIdentityKey("mleczko"));
assert.notEqual(toProductIdentityKey("ser"), toProductIdentityKey("serek"));

// Merge display name majority
{
  const proposal = mergeHistoryLists([
    list("a", "2026-01-03T00:00:00.000Z", [{ name: "pomidory" }]),
    list("b", "2026-01-02T00:00:00.000Z", [{ name: "pomidory" }]),
    list("c", "2026-01-01T00:00:00.000Z", [{ name: "pomidorki" }]),
  ]);
  const row = proposal.items.find((i) =>
    toProductIdentityKey(i.name) === toProductIdentityKey("pomidor"),
  );
  assert.ok(row);
  assert.equal(row!.name, "pomidory");
  assert.equal(row!.timesSeen, 3);
  assert.equal(row!.amount, null);
  assert.equal(row!.note, null);
}

{
  const proposal = mergeHistoryLists([
    list("a", "2026-01-03T00:00:00.000Z", [{ name: "pomidorki" }]),
    list("b", "2026-01-02T00:00:00.000Z", [{ name: "pomidorki" }]),
    list("c", "2026-01-01T00:00:00.000Z", [{ name: "pomidory" }]),
  ]);
  const row = proposal.items.find((i) =>
    toProductIdentityKey(i.name) === toProductIdentityKey("pomidor"),
  );
  assert.equal(row!.name, "pomidorki");
}

// timesSeen: unique lists only (dup on same list doesn't bump)
{
  const proposal = mergeHistoryLists([
    list("a", "2026-01-03T00:00:00.000Z", [
      { name: "pomidory" },
      { name: "pomidory" },
    ]),
    list("b", "2026-01-02T00:00:00.000Z", [{ name: "pomidorki" }]),
  ]);
  const row = proposal.items.find((i) =>
    toProductIdentityKey(i.name) === toProductIdentityKey("pomidor"),
  );
  assert.equal(row!.timesSeen, 2);
}

// Category independent of identity; latest wins
{
  const proposal = mergeHistoryLists([
    list("a", "2026-01-01T00:00:00.000Z", [
      { name: "makaron", category: "pantry" },
    ]),
    list("b", "2026-01-03T00:00:00.000Z", [
      { name: "makaron", category: "other" },
    ]),
  ]);
  const row = proposal.items.find((i) => i.name === "makaron");
  assert.ok(row);
  assert.equal(row!.timesSeen, 2);
  assert.equal(row!.category, "other");
}

console.log("history-merge asserts OK");

// Default list title (locale + date)
{
  const sampleDate = new Date("2024-05-23T12:00:00.000Z");
  assert.equal(
    formatDefaultShoppingListTitle("pl", sampleDate),
    "Zakupy, Czwartek 23 Maj",
  );
  assert.equal(
    formatDefaultShoppingListTitle("en", sampleDate),
    "Shopping, Thursday 23 May",
  );
  assert.equal(
    formatDefaultShoppingListTitle("de", sampleDate),
    "Einkauf, Donnerstag 23 Mai",
  );
  assert.ok(
    formatDefaultShoppingListTitle("pl", sampleDate).length <=
      SHOPPING_LIST_TITLE_MAX_LENGTH,
  );
}

{
  const proposal = mergeHistoryLists(
    [
      list("a", "2026-01-03T00:00:00.000Z", [{ name: "mleko" }], true),
      list("b", "2026-01-02T00:00:00.000Z", [{ name: "chleb" }]),
    ],
    "pl",
  );
  assert.match(proposal.shoppingContext.title, /^Zakupy, /);
}

console.log("default-list-title asserts OK");
