import { useNavigation, usePathname, useSegments } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { goRoot, navigateBack } from "./navigation";
import { ROOT_TAB_TO_KEY, RootScreens } from "./root-screens";
import { showRootBackToast } from "./root-back-toast";

const EXIT_WINDOW_MS = 2_000;

/**
 * Android hardware back on Root tabs.
 * Policy from RootScreens; nested Details under a tab use stack back first.
 */
export function useRootBackHandler(enabled: boolean): void {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const segments = useSegments();
  const pathname = usePathname();
  const lastExitPressRef = useRef(0);

  const onHardwareBack = useCallback(() => {
    if (!enabled || Platform.OS !== "android") return false;

    // segments e.g. ["(tabs)", "index"] or ["(tabs)", "index", "menu"]
    const tabsIdx = (segments as string[]).indexOf("(tabs)");
    if (tabsIdx < 0) return false;

    const tabSegment = segments[tabsIdx + 1];
    if (!tabSegment || typeof tabSegment !== "string") return false;

    const rootKey = ROOT_TAB_TO_KEY[tabSegment];
    if (!rootKey) return false;

    const nestedUnderTab = segments.length > tabsIdx + 2;
    if (nestedUnderTab) {
      if (navigation.canGoBack()) {
        navigateBack();
        return true;
      }
      // Fall through to root policy
    }

    // Path-only nested (some expo-router builds): e.g. /menu under home
    if (
      rootKey === "home" &&
      (pathname.includes("/menu") || pathname.endsWith("/menu"))
    ) {
      if (navigation.canGoBack()) {
        navigateBack();
        return true;
      }
    }

    const policy = RootScreens[rootKey].back;

    if (policy === "home") {
      goRoot();
      return true;
    }

    // policy === "exit"
    const now = Date.now();
    if (now - lastExitPressRef.current <= EXIT_WINDOW_MS) {
      lastExitPressRef.current = 0;
      return false; // let system exit
    }
    lastExitPressRef.current = now;
    showRootBackToast(t("navigation.pressAgainToExit"));
    return true;
  }, [enabled, navigation, pathname, segments, t]);

  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );
    return () => sub.remove();
  }, [enabled, onHardwareBack]);
}
