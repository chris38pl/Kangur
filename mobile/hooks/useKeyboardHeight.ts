import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Keyboard height for lifting bottom sheets / forms above the soft keyboard.
 * Prefer this inside Modal — KeyboardAvoidingView is unreliable on Android there.
 */
export function useKeyboardHeight(enabled = true): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [enabled]);

  return height;
}
