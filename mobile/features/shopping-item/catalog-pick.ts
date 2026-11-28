import type { ShoppingCategory } from "@shared/shopping-categories";

/**
 * A catalog suggestion the user held instead of tapped. Its name goes into
 * the name field and its category onto the chips, so the product can get an
 * amount or a note before the usual add button adds it.
 *
 * Items store no catalog slug, so the category is the whole catalog link.
 */
export type CatalogPick = {
  /** Catalog name written into the name field. */
  name: string;
  /** Chip selected before the hold, given back when the name changes. */
  previousCategory: ShoppingCategory;
};

export type CatalogPickFields = {
  name: string;
  category: ShoppingCategory;
  pick: CatalogPick | null;
};

/** Name and chip after a hold. Amount and note typed earlier stay. */
export function pickCatalogProduct(
  catalogName: string,
  productCategory: ShoppingCategory,
  currentCategory: ShoppingCategory,
): CatalogPickFields {
  return {
    name: catalogName,
    category: productCategory,
    pick: { name: catalogName, previousCategory: currentCategory },
  };
}

/**
 * The link lasts while the name is still the catalog name. Another name is
 * another product, so the chip goes back to what it was before the hold.
 */
export function editNameAfterPick(
  pick: CatalogPick | null,
  nextName: string,
  currentCategory: ShoppingCategory,
): Omit<CatalogPickFields, "name"> {
  if (!pick || nextName.trim() === pick.name) {
    return { category: currentCategory, pick };
  }
  return { category: pick.previousCategory, pick: null };
}

/** The cursor goes to the amount, or to the note once the amount is typed. */
export function detailFieldAfterPick(
  amount: string,
  note: string,
): "amount" | "note" {
  return amount.trim() !== "" && note.trim() === "" ? "note" : "amount";
}
