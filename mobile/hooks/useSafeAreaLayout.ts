import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Matches `KangurTabBar` min content height (excluding safe inset). */
export const TAB_BAR_BASE_HEIGHT = 56;

/** Center FAB hangs above the tab bar. */
export const TAB_FAB_OVERHANG = 22;

/** Extra gap so last scroll items clear the bar comfortably. */
export const TAB_BAR_SCROLL_GAP = 16;

/**
 * Bottom padding so tab-screen scroll/content clears the custom tab bar +
 * Android gesture / iOS home indicator.
 */
export function useTabBarClearance(extraGap = TAB_BAR_SCROLL_GAP): number {
  const insets = useSafeAreaInsets();
  return (
    TAB_BAR_BASE_HEIGHT +
    Math.max(insets.bottom, 8) +
    TAB_FAB_OVERHANG +
    extraGap
  );
}

/**
 * Bottom padding for bottom sheets / sticky footers pinned to the screen edge.
 * When the keyboard is open, pass `keyboardHeight > 0` and use a smaller pad
 * (keyboard already clears the system nav).
 */
export function useSheetBottomPadding(
  basePadding: number,
  keyboardHeight = 0,
): number {
  const insets = useSafeAreaInsets();
  if (keyboardHeight > 0) return basePadding;
  return basePadding + insets.bottom;
}
