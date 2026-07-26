/**
 * Create-list overlay → /list/:id handoff.
 * Overlay stays up until the list screen paints, so goRoot/Home never flashes.
 */

let dismiss: (() => void) | null = null;
let pending = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

export function beginCreateListHandoff(onDismiss: () => void): void {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  pending = true;
  dismiss = onDismiss;
  // Safety: never leave the overlay stuck if list fails to mount.
  fallbackTimer = setTimeout(() => {
    completeCreateListHandoff();
  }, 4000);
}

export function completeCreateListHandoff(): void {
  if (!pending) return;
  pending = false;
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  const fn = dismiss;
  dismiss = null;
  fn?.();
}

export function cancelCreateListHandoff(): void {
  pending = false;
  dismiss = null;
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
}
