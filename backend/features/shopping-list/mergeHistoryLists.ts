import { randomUUID } from "node:crypto";

import { HISTORY_LIST_TAKE, MAX_HISTORY_MERGE_ITEMS } from "@shared/history-merge";
import { toProductIdentityKey } from "@shared/history-product-identity";
import {
  isShoppingCategory,
  type ShoppingCategory,
} from "@shared/shopping-categories";

export { HISTORY_LIST_TAKE, MAX_HISTORY_MERGE_ITEMS };

export type HistorySourceItem = {
  name: string;
  amount: string | null;
  note: string | null;
  category: string;
  normalizedName: string;
};

export type HistorySourceList = {
  id: string;
  name: string;
  updatedAt: string;
  /** Higher = newer position in the selected source set. */
  recencyWeight: number;
  /** User marked this list as a preferred history-merge source. */
  preferredForAi: boolean;
  items: HistorySourceItem[];
};

export type MergedHistoryItem = {
  proposalRowId: string;
  name: string;
  amount: null;
  note: null;
  category: ShoppingCategory;
  reason: null;
  timesSeen: number;
  lastSeenAt: string;
};

export type MergedHistoryProposal = {
  shoppingContext: {
    title: string;
    theme: "generic";
  };
  items: MergedHistoryItem[];
};

type Occurrence = {
  rawName: string;
  category: string;
  listId: string;
  listUpdatedAt: Date;
};

type Cluster = {
  identityKey: string;
  occurrences: Occurrence[];
  listIds: Set<string>;
};

function pickDisplayName(occurrences: Occurrence[]): string {
  // Majority vote on raw spellings (preserve user language). Tie → newest.
  const bySpelling = new Map<
    string,
    { count: number; sample: string; newestAt: number }
  >();

  for (const occ of occurrences) {
    const key = occ.rawName.trim();
    if (!key) continue;
    const existing = bySpelling.get(key.toLowerCase());
    const at = occ.listUpdatedAt.getTime();
    if (!existing) {
      bySpelling.set(key.toLowerCase(), {
        count: 1,
        sample: key,
        newestAt: at,
      });
    } else {
      existing.count += 1;
      if (at >= existing.newestAt) {
        existing.newestAt = at;
        existing.sample = key;
      }
    }
  }

  let best: { count: number; sample: string; newestAt: number } | null = null;
  for (const entry of bySpelling.values()) {
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count && entry.newestAt > best.newestAt)
    ) {
      best = entry;
    }
  }

  return best?.sample?.slice(0, 120) || "Produkt";
}

function pickCategory(occurrences: Occurrence[]): ShoppingCategory {
  // category = latest occurrence; tie → most frequent
  let latest: Occurrence | null = null;
  const freq = new Map<string, number>();

  for (const occ of occurrences) {
    if (!isShoppingCategory(occ.category)) continue;
    freq.set(occ.category, (freq.get(occ.category) ?? 0) + 1);
    if (
      !latest ||
      occ.listUpdatedAt.getTime() > latest.listUpdatedAt.getTime()
    ) {
      latest = occ;
    }
  }

  if (latest && isShoppingCategory(latest.category)) {
    // True timestamp ties are rare; if multiple share the exact latest time,
    // fall through to frequency among those, else latest wins.
    const latestMs = latest.listUpdatedAt.getTime();
    const tied = occurrences.filter(
      (o) =>
        o.listUpdatedAt.getTime() === latestMs &&
        isShoppingCategory(o.category),
    );
    if (tied.length <= 1) {
      return latest.category;
    }
    let bestCat = latest.category;
    let bestCount = -1;
    for (const o of tied) {
      const c = freq.get(o.category) ?? 0;
      if (c > bestCount) {
        bestCount = c;
        bestCat = o.category as ShoppingCategory;
      }
    }
    return bestCat;
  }

  // Frequency fallback if latest had invalid category
  let best: ShoppingCategory = "other";
  let bestCount = -1;
  for (const [cat, count] of freq) {
    if (isShoppingCategory(cat) && count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}

function pickTitle(lists: HistorySourceList[]): string {
  const preferred = lists
    .filter((l) => l.preferredForAi)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const source = preferred[0] ?? [...lists].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];
  const raw = source?.name?.trim() || "Zakupy";
  return raw.slice(0, 32) || "Zakupy";
}

/**
 * Deterministic multi-list merge for create-from-history.
 * Identity ⟂ category. amounts/notes always null in v1.
 */
export function mergeHistoryLists(
  lists: HistorySourceList[],
): MergedHistoryProposal {
  const clusters = new Map<string, Cluster>();

  for (const list of lists) {
    const listUpdatedAt = new Date(list.updatedAt);
    const seenIdentityOnList = new Set<string>();

    for (const item of list.items) {
      const rawName = item.name.trim();
      if (!rawName) continue;

      const identityKey = toProductIdentityKey(rawName);
      if (!identityKey) continue;

      // timesSeen counts unique lists — skip duplicate identity on same list
      // for listIds, but still record occurrence for display-name / category votes.
      let cluster = clusters.get(identityKey);
      if (!cluster) {
        cluster = {
          identityKey,
          occurrences: [],
          listIds: new Set(),
        };
        clusters.set(identityKey, cluster);
      }

      cluster.occurrences.push({
        rawName,
        category: item.category,
        listId: list.id,
        listUpdatedAt,
      });

      if (!seenIdentityOnList.has(identityKey)) {
        seenIdentityOnList.add(identityKey);
        cluster.listIds.add(list.id);
      }
    }
  }

  const items: MergedHistoryItem[] = [];

  for (const cluster of clusters.values()) {
    if (cluster.occurrences.length === 0) continue;

    let lastSeenAt = cluster.occurrences[0]!.listUpdatedAt;
    for (const occ of cluster.occurrences) {
      if (occ.listUpdatedAt > lastSeenAt) lastSeenAt = occ.listUpdatedAt;
    }

    items.push({
      proposalRowId: randomUUID(),
      name: pickDisplayName(cluster.occurrences),
      amount: null,
      note: null,
      category: pickCategory(cluster.occurrences),
      reason: null,
      timesSeen: Math.max(1, Math.min(cluster.listIds.size, HISTORY_LIST_TAKE)),
      lastSeenAt: lastSeenAt.toISOString(),
    });
  }

  items.sort((a, b) => {
    if (b.timesSeen !== a.timesSeen) return b.timesSeen - a.timesSeen;
    return (
      new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );
  });

  return {
    shoppingContext: {
      title: pickTitle(lists),
      theme: "generic",
    },
    items: items.slice(0, MAX_HISTORY_MERGE_ITEMS),
  };
}
