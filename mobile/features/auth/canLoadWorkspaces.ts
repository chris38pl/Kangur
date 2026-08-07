/**
 * Gate for first-boot workspace fetch: only after /me has succeeded
 * for the **current** Clerk session.
 *
 * Prevents GET /workspaces from racing ahead of X-Device-Locale seeding
 * (which would create a default "Home" workspace in English), and blocks
 * warm-cache `/me` from a previous account after sign-in switch.
 */
export function canLoadWorkspaces(input: {
  isSignedIn: boolean;
  meStatus: "pending" | "error" | "success";
  /** Clerk user id from the current session (`useAuth().userId`). */
  sessionClerkId?: string | null;
  /** `me.clerkId` from React Query (may be warm-cache from another account). */
  meClerkId?: string | null;
}): boolean {
  if (!input.isSignedIn || input.meStatus !== "success") return false;
  const session = input.sessionClerkId?.trim() || "";
  const me = input.meClerkId?.trim() || "";
  if (!session || !me) return false;
  return session === me;
}
