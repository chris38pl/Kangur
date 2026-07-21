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

export type ListShoppingProgress = {
  bought: number;
  unavailable: number;
  pending: number;
  total: number;
  /** 0–1 - bought / total (matches “X z Y produktów” copy) */
  progress: number;
};

function collectByCategory(items: ShoppingItem[]) {
  const byCat = new Map<ShoppingCategory, ShoppingItem[]>();
  for (const item of items) {
    if (item.status === "removed") continue;
    const list = byCat.get(item.category) ?? [];
    list.push(item);
    byCat.set(item.category, list);
  }
  return byCat;
}

function toCategoryProgress(
  category: ShoppingCategory,
  catItems: ShoppingItem[],
): CategoryProgress {
  const activeCount = catItems.filter(isActiveItem).length;
  const purchasedCount = catItems.filter((i) => i.status === "bought").length;
  const unavailableCount = catItems.filter(
    (i) => i.status === "unavailable",
  ).length;
  const totalTracked = activeCount + purchasedCount + unavailableCount;
  const done = purchasedCount + unavailableCount;

  return {
    category,
    activeCount,
    purchasedCount,
    unavailableCount,
    totalTracked,
    progress: totalTracked === 0 ? 0 : done / totalTracked,
  };
}

/**
 * Categories that still have ACTIVE items, ordered by Store Flow SSOT.
 */
export function getActiveCategoryProgress(
  items: ShoppingItem[],
): CategoryProgress[] {
  const order = getShoppingCategoryOrder();
  const byCat = collectByCategory(items);
  const result: CategoryProgress[] = [];

  for (const category of order) {
    const catItems = byCat.get(category);
    if (!catItems?.length) continue;
    const progress = toCategoryProgress(category, catItems);
    if (progress.activeCount === 0) continue;
    result.push(progress);
  }

  return result;
}

/**
 * Categories fully resolved (no pending items), still with tracked products.
 */
export function getCompletedCategoryProgress(
  items: ShoppingItem[],
): CategoryProgress[] {
  const order = getShoppingCategoryOrder();
  const byCat = collectByCategory(items);
  const result: CategoryProgress[] = [];

  for (const category of order) {
    const catItems = byCat.get(category);
    if (!catItems?.length) continue;
    const progress = toCategoryProgress(category, catItems);
    if (progress.activeCount > 0 || progress.totalTracked === 0) continue;
    result.push({ ...progress, progress: 1 });
  }

  return result;
}

/** List-level bought / total for the shopping-mode summary banner. */
export function getListShoppingProgress(
  items: ShoppingItem[],
): ListShoppingProgress {
  let bought = 0;
  let unavailable = 0;
  let pending = 0;

  for (const item of items) {
    if (item.status === "removed") continue;
    if (item.status === "bought") bought += 1;
    else if (item.status === "unavailable") unavailable += 1;
    else if (item.status === "pending") pending += 1;
  }

  const total = bought + unavailable + pending;
  return {
    bought,
    unavailable,
    pending,
    total,
    progress: total === 0 ? 0 : bought / total,
  };
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

/** Position of this aisle among categories that have items on the list. */
export function getCategoryTripPosition(
  items: ShoppingItem[],
  category: ShoppingCategory,
): { current: number; total: number } | null {
  const order = getShoppingCategoryOrder();
  const tracked = order.filter((cat) =>
    items.some((i) => i.category === cat && i.status !== "removed"),
  );
  const idx = tracked.indexOf(category);
  if (idx < 0 || tracked.length === 0) return null;
  return { current: idx + 1, total: tracked.length };
}
