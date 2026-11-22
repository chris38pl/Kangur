import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";

import { Analytics } from "./index";
import { installSetOnce, parseInstallReferrer } from "./install-referrer-parse";
import { isAnalyticsEnabled } from "./posthog";

const STORAGE_KEY = "kangur.analytics.installReferrer.v1";

/**
 * Android only: reads the Play install referrer once per install and records
 * the campaign as `install_attributed` plus person properties set once.
 * Links from the landing and bio pass `referrer=utm_source%3D...` to Play.
 * iOS has no install referrer; App Store campaigns are measured in App Analytics.
 */
export async function captureInstallReferrerOnce(): Promise<void> {
  if (Platform.OS !== "android" || !isAnalyticsEnabled()) return;
  try {
    if (await AsyncStorage.getItem(STORAGE_KEY)) return;
    const raw = await Application.getInstallReferrerAsync();
    const attribution = parseInstallReferrer(raw);
    const setOnce = installSetOnce(attribution);
    Analytics.track("install_attributed", {
      referrer_present: Boolean(raw),
      ...attribution,
      ...(Object.keys(setOnce).length > 0 ? { $set_once: setOnce } : {}),
    });
    await AsyncStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // Play service unavailable (emulator, sideload): try again next launch.
  }
}
