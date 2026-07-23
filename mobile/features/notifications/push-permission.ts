import AsyncStorage from "@react-native-async-storage/async-storage";

export type PushPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

const STORAGE_KEY = "kangur.push.permissionStatus";

export async function getStoredPushPermissionStatus(): Promise<PushPermissionStatus | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === "granted" || raw === "denied" || raw === "undetermined") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setStoredPushPermissionStatus(
  status: PushPermissionStatus,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Best-effort — never block registration path.
  }
}

/** Clear stored status so the next register cycle may prompt again (Settings CTA). */
export async function clearStoredPushPermissionStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function normalizePermissionStatus(
  status: string,
): PushPermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}
