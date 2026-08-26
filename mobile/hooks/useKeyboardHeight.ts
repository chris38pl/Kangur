import { useEffect, useState } from "react";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Keyboard height for lifting bottom sheets / forms above the soft keyboard.
 * Prefer this inside Modal - KeyboardAvoidingView is unreliable on Android there.
 *
 * On Android, `keyboardDidShow` fires after the keyboard is up; LayoutAnimation
 * softens the sheet lift so it does not hard-jump after the Modal slide.
 */
export function useKeyboardHeight(enabled = true): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const animateLayout = (durationMs: number) => {
      LayoutAnimation.configureNext({
        duration: Math.max(120, Math.min(durationMs, 280)),
        update: {
          type:
            Platform.OS === "ios"
              ? LayoutAnimation.Types.keyboard
              : LayoutAnimation.Types.easeInEaseOut,
        },
      });
    };

    const onShow = Keyboard.addListener(showEvent, (event) => {
      animateLayout(
        Platform.OS === "ios" ? event.duration || 250 : 220,
      );
      setHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, (event) => {
      animateLayout(
        Platform.OS === "ios" ? event.duration || 200 : 180,
      );
      setHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [enabled]);

  return enabled ? height : 0;
}
