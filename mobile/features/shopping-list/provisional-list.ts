/** Lists created via FAB that should be archived if the user leaves with 0 items. */
const provisionalIds = new Set<string>();

export function markListProvisional(listId: string): void {
  provisionalIds.add(listId);
}

export function clearListProvisional(listId: string): void {
  provisionalIds.delete(listId);
}

export function isListProvisional(listId: string): boolean {
  return provisionalIds.has(listId);
}
