/**
 * History product analytics (M11 / M13.11).
 * Emits via Analytics wrapper only.
 */

import { Analytics } from "@/lib/analytics";

export function historyOpened(): void {
  Analytics.track("history_opened", {});
}

export function historySearch(query: string): void {
  if (!query.trim()) return;
  Analytics.track("history_search", { had_query: true });
}

export function historyRepeat(sourceListId: string): void {
  Analytics.track("history_repeat", { source_list_id: sourceListId });
}

export function historyRepeatCompleted(input: {
  sourceListId: string;
  newListId: string;
}): void {
  Analytics.track("history_repeat_completed", {
    source_list_id: input.sourceListId,
    new_list_id: input.newListId,
  });
}

export function historyRestore(listId: string): void {
  Analytics.track("history_restore", { list_id: listId });
}
