export type ListEntryFocus = "ai" | "meal" | "manual";

let pending: { listId: string; focus: ListEntryFocus } | null = null;

export function setPendingListFocus(
  listId: string,
  focus: ListEntryFocus,
): void {
  pending = { listId, focus };
}

export function takePendingListFocus(listId: string): ListEntryFocus | null {
  if (!pending || pending.listId !== listId) return null;
  const { focus } = pending;
  pending = null;
  return focus;
}
