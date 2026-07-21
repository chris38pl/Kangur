/**
 * Clerk logs a noisy development-keys warning on every load.
 * Official `unsafe_disableDevelopmentModeConsoleWarning` is not in
 * `@clerk/clerk-expo@2.19` yet - filter it in __DEV__ only.
 */
export function suppressClerkDevKeysWarning(): void {
  if (!__DEV__) return;

  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (
      typeof first === "string" &&
      first.includes("Clerk has been loaded with development keys")
    ) {
      return;
    }
    originalWarn(...args);
  };
}
