import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Tracks OS "Reduce Motion" (iOS) / equivalent accessibility preference.
 * Android animator duration scale is partially reflected via the same RN API.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        setReduceMotion(enabled);
      },
    );

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
