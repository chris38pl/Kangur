import { Linking, Platform } from "react-native";

const DEFAULT_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.kangur";

/**
 * Store listing URLs live on the client only — never from the version API.
 */
export function getStoreUpdateUrl(): string | null {
  if (Platform.OS === "android") {
    const fromEnv = process.env.EXPO_PUBLIC_PLAY_STORE_URL?.trim();
    return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_PLAY_STORE_URL;
  }

  if (Platform.OS === "ios") {
    const fromEnv = process.env.EXPO_PUBLIC_APP_STORE_URL?.trim();
    return fromEnv && fromEnv.length > 0 ? fromEnv : null;
  }

  return null;
}

export async function openStoreUpdate(): Promise<void> {
  const url = getStoreUpdateUrl();
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    // Best-effort — never surface store open failures to the user.
  }
}
