/** Lists created via FAB that should be archived if the user leaves with 0 items. */
const STORAGE_KEY = "kangur:provisional-lists";

function readStored(): Set<string> {
  try {
    if (typeof sessionStorage === "undefined") return new Set();
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeStored(ids: Set<string>): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // private mode / SSR
  }
}

const provisionalIds = readStored();

export function markListProvisional(listId: string): void {
  provisionalIds.add(listId);
  writeStored(provisionalIds);
}

export function clearListProvisional(listId: string): void {
  provisionalIds.delete(listId);
  writeStored(provisionalIds);
}

export function isListProvisional(listId: string): boolean {
  return provisionalIds.has(listId);
}
