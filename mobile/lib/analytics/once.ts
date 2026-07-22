import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "kangur.analytics.once.";

/** Fire-and-forget once-per-user local gate for first_* events. */
export async function oncePerUser(
  key: string,
  emit: () => void,
): Promise<void> {
  try {
    const storageKey = PREFIX + key;
    const existing = await AsyncStorage.getItem(storageKey);
    if (existing) return;
    emit();
    await AsyncStorage.setItem(storageKey, "1");
  } catch {
    // still emit if storage fails? prefer skip to avoid spam — emit once best-effort
    emit();
  }
}
