/** One-shot: after AI apply from another screen, scroll list to items section. */

let pendingListId: string | null = null;

export function setPendingScrollToItems(listId: string): void {
  pendingListId = listId;
}

export function takePendingScrollToItems(listId: string): boolean {
  if (pendingListId !== listId) return false;
  pendingListId = null;
  return true;
}
