/**
 * No-op telemetry hooks for History (M11).
 * Wire to Metrics / analytics later without changing call sites.
 */

export function historyOpened(): void {
  // future: history_opened
}

export function historySearch(query: string): void {
  if (!query.trim()) return;
  // future: history_search
  void query;
}

export function historyRepeat(sourceListId: string): void {
  // future: history_repeat (intent)
  void sourceListId;
}

export function historyRepeatCompleted(input: {
  sourceListId: string;
  newListId: string;
}): void {
  // future: history_repeat_completed
  void input;
}

export function historyRestore(listId: string): void {
  // future: history_restore
  void listId;
}
