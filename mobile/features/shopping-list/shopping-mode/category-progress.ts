import {
  getShoppingCategoryOrder,
  type ShoppingCategory,
} from "@shared/shopping-categories";

import type { ShoppingItem } from "@/features/shopping-item/schemas";

import { isActiveItem } from "./buckets";

export type CategoryProgress = {
  category: ShoppingCategory;
  activeCount: number;
  purchasedCount: number;
  unavailableCount: number;
  totalTracked: number;
  /** 0–1 fraction completed (purchased + unavailable) / total tracked */
  progress: number;
};

/**
 * Categories that still have ACTIVE items, ordered by Store Flow SSOT.
 */
export function getActiveCategoryProgress(
  items: ShoppingItem[],
): CategoryProgress[] {
  const order = getShoppingCategoryOrder();
  const byCat = new Map<ShoppingCategory, ShoppingItem[]>();

  for (const item of items) {
    if (item.status === "removed") continue;
    const list = byCat.get(item.category) ?? [];
    list.push(item);
    byCat.set(item.category, list);
  }

  const result: CategoryProgress[] = [];
  for (const category of order) {
    const catItems = byCat.get(category);
    if (!catItems?.length) continue;

    const activeCount = catItems.filter(isActiveItem).length;
    if (activeCount === 0) continue;

    const purchasedCount = catItems.filter((i) => i.status === "bought").length;
    const unavailableCount = catItems.filter(
      (i) => i.status === "unavailable",
    ).length;
    const totalTracked = activeCount + purchasedCount + unavailableCount;
    const done = purchasedCount + unavailableCount;

    result.push({
      category,
      activeCount,
      purchasedCount,
      unavailableCount,
      totalTracked,
      progress: totalTracked === 0 ? 0 : done / totalTracked,
    });
  }

  return result;
}

export function sortItemsInCategory(items: ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function nextCategoryWithActive(
  items: ShoppingItem[],
  current: ShoppingCategory,
): CategoryProgress | null {
  const active = getActiveCategoryProgress(items);
  const idx = active.findIndex((c) => c.category === current);
  if (idx < 0) {
    return active[0] ?? null;
  }
  return active[idx + 1] ?? null;
}
