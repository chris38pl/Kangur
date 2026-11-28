import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The quiet "hold to add an amount or a note" line under catalog
 * suggestions. Holding cannot be seen, so the line shows the first few times
 * the suggestions open and goes away for good after the first hold.
 *
 * One "time" is one stay in the name field in which the line was on screen.
 */
export const HOLD_HINT_TIMES = 5;

export const HOLD_HINT_STORAGE_KEY = "kangur.suggestionHoldHint";

/** Stored value -> times shown so far, from 0 to HOLD_HINT_TIMES. */
export function parseHoldHintCount(raw: string | null): number {
  const value = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, HOLD_HINT_TIMES);
}

export function shouldShowHoldHint(count: number): boolean {
  return count < HOLD_HINT_TIMES;
}

let cachedCount: number | null = null;
let loading: Promise<number> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Times shown so far, or null until storage has been read in this app run. */
export function getHoldHintCount(): number | null {
  return cachedCount;
}

export function loadHoldHintCount(): Promise<number> {
  if (cachedCount !== null) return Promise.resolve(cachedCount);
  loading ??= AsyncStorage.getItem(HOLD_HINT_STORAGE_KEY)
    .then(parseHoldHintCount, () => 0)
    .then((stored) => {
      // A count saved while the read was running is newer than the stored one.
      if (cachedCount === null) {
        cachedCount = stored;
        emit();
      }
      return cachedCount;
    });
  return loading;
}

/** For useSyncExternalStore: reads storage on the first subscriber. */
export function subscribeHoldHint(listener: () => void): () => void {
  listeners.add(listener);
  if (cachedCount === null) void loadHoldHintCount();
  return () => {
    listeners.delete(listener);
  };
}

function saveHoldHintCount(count: number) {
  if (cachedCount === count) return;
  cachedCount = count;
  emit();
  void AsyncStorage.setItem(HOLD_HINT_STORAGE_KEY, String(count)).catch(() => {
    // Best effort: at worst the line shows once more after a restart.
  });
}

/** The line was on screen during one more stay in the name field. */
export function noteHoldHintShown() {
  if (cachedCount === null) return;
  saveHoldHintCount(Math.min(cachedCount + 1, HOLD_HINT_TIMES));
}

/** The user held a suggestion, so the line has done its job. */
export function noteSuggestionHeld() {
  saveHoldHintCount(HOLD_HINT_TIMES);
}

/** Tests only: forget what this app run has read. */
export function resetHoldHintForTests() {
  cachedCount = null;
  loading = null;
  listeners.clear();
}
