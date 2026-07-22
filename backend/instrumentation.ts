/**
 * Sentry bootstrap for Next.js (M13.11).
 * Soft-fail when DSN / package missing.
 */
export async function register() {
  try {
    const { initSentry } = await import("@/lib/sentry");
    initSentry();
  } catch {
    // noop
  }
}
