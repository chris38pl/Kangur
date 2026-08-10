/** Max source lists selected for history-merge (preferred first, then fill). */
export const HISTORY_LIST_TAKE = 5;

/**
 * Safety cap only — not an AI prompt budget.
 * Typical weekly lists stay well under this.
 */
export const MAX_HISTORY_MERGE_ITEMS = 300;

/** Max lists a user can star as preferred history-merge sources. */
export const MAX_PREFERRED_FOR_HISTORY_LISTS = 5;

/** @deprecated Prefer MAX_PREFERRED_FOR_HISTORY_LISTS */
export const MAX_PREFERRED_FOR_AI_LISTS = MAX_PREFERRED_FOR_HISTORY_LISTS;
