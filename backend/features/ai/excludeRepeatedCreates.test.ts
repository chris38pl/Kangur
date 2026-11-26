import assert from "node:assert/strict";
import test from "node:test";

import {
  excludeRepeatedCreates,
  type ItemText,
} from "./excludeRepeatedCreates.ts";

type Create = ItemText & { clientId: string };

function create(
  clientId: string,
  name: string,
  amount: string | null = null,
  note: string | null = null,
): Create {
  return { clientId, name, amount, note };
}

function item(
  name: string,
  amount: string | null = null,
  note: string | null = null,
): ItemText {
  return { name, amount, note };
}

const ids = (rows: Create[]) => rows.map((row) => row.clientId);

test("two variants of one name both go on the list", () => {
  // "mleko 2%, mleko bez laktozy": the prompt keeps the name and moves the variant to note.
  const creates = [
    create("a", "Mleko", null, "2%"),
    create("b", "Mleko", null, "bez laktozy"),
  ];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a", "b"]);
});

test("ready herring in oil and in cream are two products", () => {
  const creates = [
    create("a", "Śledzie", null, "w oleju"),
    create("b", "Śledzie", null, "w śmietanie"),
  ];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a", "b"]);
});

test("one name with two amounts keeps both amounts", () => {
  const creates = [
    create("a", "Mleko", "1 l"),
    create("b", "Mleko", "2 l"),
  ];
  const kept = excludeRepeatedCreates(creates, []);
  assert.deepEqual(
    kept.map((row) => row.amount),
    ["1 l", "2 l"],
  );
});

test("a bare row and a row with a note are not repeats", () => {
  const creates = [create("a", "Mleko"), create("b", "Mleko", null, "2%")];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a", "b"]);
});

test("an exact repeat without amount or note collapses into one", () => {
  const creates = [create("a", "Chleb"), create("b", "Chleb")];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a"]);
});

test("an exact repeat with the same amount and note collapses into one", () => {
  const creates = [
    create("a", "Mleko", "1 l", "2%"),
    create("b", "Mleko", "1 l", "2%"),
  ];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a"]);
});

test("case and spaces do not make a different product", () => {
  const creates = [
    create("a", "Mleko", "1 l", "bez laktozy"),
    create("b", "  mleko ", "1 L", "Bez   laktozy"),
  ];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a"]);
});

test("an empty amount or note counts as none", () => {
  const creates = [create("a", "Chleb"), create("b", "Chleb", "", " ")];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, [])), ["a"]);
});

test("the first of the repeats wins and the order stays", () => {
  const creates = [
    create("a", "Mleko"),
    create("b", "Masło"),
    create("c", "mleko"),
    create("d", "Jajka", "10 szt."),
  ];
  const kept = excludeRepeatedCreates(creates, []);
  assert.deepEqual(ids(kept), ["a", "b", "d"]);
  assert.equal(kept[0], creates[0]);
});

test("a row identical to an item on the list is not added again", () => {
  const onList = [item("Mleko", null, "2%"), item("Chleb")];
  const creates = [create("a", "mleko", null, "2%"), create("b", "Chleb")];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, onList)), []);
});

test("a new variant of an item on the list is added", () => {
  const onList = [item("Mleko", null, "2%")];
  const creates = [create("a", "Mleko", null, "bez laktozy")];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, onList)), ["a"]);
});

test("a new amount of an item on the list is added", () => {
  const onList = [item("Mleko")];
  const creates = [create("a", "Mleko", "2 l")];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, onList)), ["a"]);
});

test("the list and the paste share one repeat check", () => {
  const onList = [item("Mleko", null, "2%")];
  const creates = [
    create("a", "Mleko", null, "2%"),
    create("b", "Mleko", null, "bez laktozy"),
    create("c", "Mleko", null, "bez laktozy"),
  ];
  assert.deepEqual(ids(excludeRepeatedCreates(creates, onList)), ["b"]);
});

test("nothing to add gives an empty list", () => {
  assert.deepEqual(excludeRepeatedCreates([], [item("Mleko")]), []);
});
