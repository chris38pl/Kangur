import type { QueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { BackHandler, Platform } from "react-native";

import { clearLocalUserData } from "@/features/profile/clearLocalUserData";
import { withTimeout } from "@/lib/boot/with-timeout";

const CLERK_CLIENT_JWT_KEY = "__clerk_client_jwt";
const SIGN_OUT_TIMEOUT_MS = 4_000;
const CACHE_CHUNK_SLOTS = 32;

const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
} as const;

async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key, secureStoreOptions);
  } catch {
    /* Missing keys are fine. */
  }
}

/** Clerk resource cache lives in SecureStore under these prefixes. */
async function clearClerkSecureSession(): Promise<void> {
  await deleteSecureItem(CLERK_CLIENT_JWT_KEY);
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) return;
  const suffix = publishableKey.slice(-5);
  const bases = [
    `__clerk_cache_client_${suffix}`,
    `__clerk_cache_environment_${suffix}`,
    `__clerk_cache_session_jwt_${suffix}`,
  ];
  const keys: string[] = [];
  for (const base of bases) {
    keys.push(`${base}-latest`);
    for (const slot of ["A", "B"]) {
      keys.push(`${base}-${slot}-complete`, `${base}-${slot}-metadata`);
      for (let i = 0; i < CACHE_CHUNK_SLOTS; i += 1) {
        keys.push(`${base}-${slot}-chunk-${i}`);
      }
    }
  }
  await Promise.all(keys.map((key) => deleteSecureItem(key)));
}

/**
 * Wipe Kangur cache and the stored Clerk session, then sign out.
 * If Clerk never finishes loading, close Android so the next open has no token.
 */
export async function resetStuckSession(
  queryClient: QueryClient,
  signOut: () => Promise<void>,
): Promise<void> {
  await clearLocalUserData(queryClient);
  await clearClerkSecureSession();

  let signedOut = false;
  try {
    await withTimeout(signOut(), SIGN_OUT_TIMEOUT_MS);
    signedOut = true;
  } catch {
    signedOut = false;
  }
  if (!signedOut && Platform.OS === "android") {
    BackHandler.exitApp();
  }
}
