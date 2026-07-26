/**
 * Session flag so What's New waits while soft-update sheet is visible.
 * Module-level (not React context) keeps AppUpdateGate / WhatsNewGate decoupled.
 */

type Listener = () => void;

let softUpdateSheetVisible = false;
const listeners = new Set<Listener>();

export function setSoftUpdateSheetVisible(visible: boolean): void {
  if (softUpdateSheetVisible === visible) return;
  softUpdateSheetVisible = visible;
  for (const listener of listeners) {
    listener();
  }
}

export function getSoftUpdateSheetVisible(): boolean {
  return softUpdateSheetVisible;
}

export function subscribeSoftUpdateSheetVisible(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
