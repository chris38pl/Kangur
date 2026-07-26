import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SEEN_KEY = "kangur.whatsNew.lastSeenReleaseVersion";

export async function getLastSeenReleaseVersion(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_SEEN_KEY);
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}

export async function setLastSeenReleaseVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SEEN_KEY, version.trim());
  } catch {
    // Best-effort local gate — never block UI on storage failure.
  }
}
