import { HISTORY_PROPOSAL_TYPE } from "@/lib/openai";

import type {
  HistorySourceList,
  RawSuggestProposal,
} from "./buildSuggestFromHistory";
import type { SuggestFromHistoryItem } from "./schemas";

function normalizeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Polish-ish stemming lite: jabłka→jablk, pomidory→pomidor, banany→banan */
function stemKey(key: string): string {
  if (key.length < 4) return key;
  const stemmed = key.replace(
    /(eczki|uszki|kami|ach|ami|owie|ów|ow|om|ki|ka|y|i)$/u,
    "",
  );
  return stemmed.length >= 3 ? stemmed : key;
}

type CorpusEntry = {
  normalizedName: string;
  stem: string;
  listIds: Set<string>;
  lastSeenAt: Date;
  /** Original names seen (for logging). */
  sampleName: string;
};

function buildCorpus(lists: HistorySourceList[]): CorpusEntry[] {
  const byNorm = new Map<string, CorpusEntry>();

  for (const list of lists) {
    const listUpdated = new Date(list.updatedAt);
    const seenOnList = new Set<string>();

    for (const item of list.items) {
      // Always normalize from display name - DB normalizedName may be inconsistent.
      const key = normalizeKey(item.name);
      if (!key || seenOnList.has(key)) continue;
      seenOnList.add(key);

      const existing = byNorm.get(key);
      if (!existing) {
        byNorm.set(key, {
          normalizedName: key,
          stem: stemKey(key),
          listIds: new Set([list.id]),
          lastSeenAt: listUpdated,
          sampleName: item.name,
        });
      } else {
        existing.listIds.add(list.id);
        if (listUpdated > existing.lastSeenAt) {
          existing.lastSeenAt = listUpdated;
        }
      }
    }
  }

  return [...byNorm.values()];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let prev = i;
    row[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cur = row[j + 1]!;
      const cost = a[i] === b[j] ? 0 : 1;
      row[j + 1] = Math.min(
        row[j + 1]! + 1,
        row[j]! + 1,
        prev + cost,
      );
      prev = cur;
    }
  }
  return row[b.length]!;
}

type ScoredMatch = { entry: CorpusEntry; score: number; kind: string };

/**
 * Score matches; never require "exactly one soft hit".
 * timesSeen=1 (item only on one large list) is a valid match.
 */
function findBestMatch(
  proposalName: string,
  corpus: CorpusEntry[],
): ScoredMatch | null {
  const key = normalizeKey(proposalName);
  if (!key || corpus.length === 0) return null;

  const stem = stemKey(key);
  const scored: ScoredMatch[] = [];

  for (const entry of corpus) {
    if (entry.normalizedName === key) {
      scored.push({ entry, score: 100, kind: "exact" });
      continue;
    }

    if (entry.stem === stem && stem.length >= 3) {
      scored.push({ entry, score: 92, kind: "stem" });
      continue;
    }

    const shorter =
      key.length <= entry.normalizedName.length ? key : entry.normalizedName;
    const longer =
      key.length > entry.normalizedName.length ? key : entry.normalizedName;

    // Containment only when shorter is a meaningful chunk (avoid "ser"→"deser").
    if (
      shorter.length >= 4 &&
      longer.includes(shorter) &&
      shorter.length / longer.length >= 0.55
    ) {
      scored.push({
        entry,
        score: 78 + Math.round(20 * (shorter.length / longer.length)),
        kind: "contain",
      });
      continue;
    }

    const maxLen = Math.max(key.length, entry.normalizedName.length);
    if (maxLen <= 12) {
      const dist = levenshtein(key, entry.normalizedName);
      const similarity = 1 - dist / maxLen;
      if (similarity >= 0.78 && dist <= 3) {
        scored.push({
          entry,
          score: Math.round(60 + similarity * 30),
          kind: "edit",
        });
      }
    }
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  // Accept any scored candidate above a low bar - prefer keeping history products.
  if (best.score < 60) return null;
  return best;
}

/**
 * Attach deterministic timesSeen / lastSeenAt.
 * Prefer matching history; if AI proposed something we can't fuzzy-match,
 * keep it with timesSeen=1 (AI only saw history input - don't throw away
 * one-list grocery staples just because other small lists omitted them).
 */
export function enrichSuggestFromHistory(input: {
  proposal: RawSuggestProposal;
  lists: HistorySourceList[];
}): {
  shoppingContext: RawSuggestProposal["shoppingContext"];
  items: SuggestFromHistoryItem[];
} {
  const sourceListsCount = Math.max(1, input.lists.length);
  const corpus = buildCorpus(input.lists);
  const newestListAt =
    input.lists[0] != null
      ? new Date(input.lists[0].updatedAt)
      : new Date();

  const items: SuggestFromHistoryItem[] = [];

  for (const raw of input.proposal.items) {
    const name = raw.name.trim();
    if (!name) continue;

    const match = findBestMatch(name, corpus);

    let timesSeen: number;
    let lastSeenAt: Date;

    if (match) {
      timesSeen = Math.min(
        Math.max(1, match.entry.listIds.size),
        sourceListsCount,
      );
      lastSeenAt = match.entry.lastSeenAt;
    } else {
      // Keep proposal - do not drop one-off list items the model correctly surfaced.
      timesSeen = 1;
      lastSeenAt = newestListAt;
      console.warn(
        "[ai]",
        "Kept proposal item without corpus match",
        `proposalType=${HISTORY_PROPOSAL_TYPE}`,
        "reason=fallback_timesSeen_1",
        `normalizedName=${normalizeKey(name)}`,
      );
    }

    items.push({
      proposalRowId: raw.proposalRowId!,
      name,
      amount: raw.amount ?? null,
      note: raw.note ?? null,
      category: raw.category,
      reason: raw.reason?.trim() ? raw.reason.trim() : null,
      timesSeen,
      lastSeenAt: lastSeenAt.toISOString(),
    });
  }

  return {
    shoppingContext: input.proposal.shoppingContext,
    items,
  };
}
