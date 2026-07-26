/**
 * Gate for first-boot workspace fetch: only after /me has succeeded.
 * Prevents GET /workspaces from racing ahead of X-Device-Locale seeding,
 * which would create a default "Home" workspace in English.
 */
export function canLoadWorkspaces(input: {
  isSignedIn: boolean;
  meStatus: "pending" | "error" | "success";
}): boolean {
  return input.isSignedIn && input.meStatus === "success";
}
