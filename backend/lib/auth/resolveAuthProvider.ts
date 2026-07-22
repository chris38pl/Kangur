import { createClerkClient } from "@clerk/backend";

export type AuthProvider = "google" | "apple" | "email";

/**
 * Best-effort primary auth provider for UX copy (invites mismatch, etc.).
 * Not used for authorization — membership uses clerkId; invites use primary email.
 */
export async function resolveAuthProvider(
  clerkId: string,
): Promise<AuthProvider> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return "email";

  try {
    const clerk = createClerkClient({ secretKey });
    const clerkUser = await clerk.users.getUser(clerkId);
    const providers = (clerkUser.externalAccounts ?? []).map((a) =>
      a.provider.toLowerCase(),
    );
    if (providers.some((p) => p.includes("google"))) return "google";
    if (providers.some((p) => p.includes("apple"))) return "apple";
  } catch {
    // fall through
  }
  return "email";
}
