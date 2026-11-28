import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  detailFieldAfterPick,
  editNameAfterPick,
  pickCatalogProduct,
  type CatalogPick,
} from "./catalog-pick.ts";

describe("pickCatalogProduct", () => {
  it("writes the catalog name and category and keeps the old chip", () => {
    assert.deepEqual(pickCatalogProduct("Pomidory", "vegetables", "dairy"), {
      name: "Pomidory",
      category: "vegetables",
      pick: { name: "Pomidory", previousCategory: "dairy" },
    });
  });
});

describe("editNameAfterPick", () => {
  const pick: CatalogPick = { name: "Pomidory", previousCategory: "other" };

  it("keeps the catalog category while the name stays", () => {
    assert.deepEqual(editNameAfterPick(pick, "Pomidory ", "vegetables"), {
      category: "vegetables",
      pick,
    });
  });

  it("gives the old chip back when the name changes", () => {
    assert.deepEqual(
      editNameAfterPick(pick, "Pomidory malinowe", "vegetables"),
      { category: "other", pick: null },
    );
  });

  it("gives the old chip back when the name is cleared", () => {
    assert.deepEqual(editNameAfterPick(pick, "", "vegetables"), {
      category: "other",
      pick: null,
    });
  });

  it("leaves a typed name alone", () => {
    assert.deepEqual(editNameAfterPick(null, "Mydło", "household"), {
      category: "household",
      pick: null,
    });
  });
});

describe("detailFieldAfterPick", () => {
  it("starts with the amount", () => {
    assert.equal(detailFieldAfterPick("", ""), "amount");
    assert.equal(detailFieldAfterPick("  ", "na sałatkę"), "amount");
  });

  it("goes to the note when the amount is already typed", () => {
    assert.equal(detailFieldAfterPick("2 kg", ""), "note");
  });

  it("stays on the amount when both are typed", () => {
    assert.equal(detailFieldAfterPick("2 kg", "malinowe"), "amount");
  });
});
