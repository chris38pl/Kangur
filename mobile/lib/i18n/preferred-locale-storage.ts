import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  isAppLocale,
  type AppLocale,
} from "@/lib/i18n/locales";

/** Survives logout — device UI preference before / without profile locale. */
export const PREFERRED_LOCALE_STORAGE_KEY = "kangur.preferredLocale";

export async function readPreferredLocale(): Promise<AppLocale | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY);
    if (!raw || !isAppLocale(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function writePreferredLocale(locale: AppLocale): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Best-effort — UI language still updates in-memory via i18n.
  }
}
