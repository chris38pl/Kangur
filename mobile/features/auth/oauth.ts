import * as Linking from "expo-linking";
import type { useOAuth } from "@clerk/clerk-expo";

type StartOAuthFlow = ReturnType<typeof useOAuth>["startOAuthFlow"];

export type ClerkOAuthProvider = "google" | "apple";

export type RunClerkOAuthResult = {
  createdSessionId: string | null;
};

/**
 * Shared Clerk OAuth start for sign-in / sign-up / account linking.
 * Does not activate the session — caller decides setActive + logging.
 */
export async function runClerkOAuth(input: {
  startOAuthFlow: StartOAuthFlow;
  redirectPath?: string;
}): Promise<RunClerkOAuthResult> {
  const { createdSessionId } = await input.startOAuthFlow({
    redirectUrl: Linking.createURL(input.redirectPath ?? "/"),
  });
  return { createdSessionId: createdSessionId ?? null };
}

/** DEV-only diagnostic (no tokens). Private Relay is logged, never branched on. */
export function logAuthSuccess(input: {
  event: "SignIn" | "SignUp" | "LinkProvider";
  provider: ClerkOAuthProvider | "email";
  email?: string | null;
  userId?: string | null;
  createdSession?: boolean;
}): void {
  if (!__DEV__) return;
  const email = input.email?.trim() ?? null;
  const isPrivateRelay =
    typeof email === "string" &&
    email.toLowerCase().endsWith("@privaterelay.appleid.com");
  console.info("[auth]", input.event, {
    provider: input.provider,
    email,
    isPrivateRelay,
    userId: input.userId ?? null,
    createdSession: Boolean(input.createdSession),
  });
}
