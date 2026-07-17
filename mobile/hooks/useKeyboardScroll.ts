import { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { spacing } from "@/design-system/tokens";

const TOP_CLEARANCE = 16;
const BOTTOM_CLEARANCE = 64;

type MeasureInWindowView = {
  measureInWindow: (
    cb: (x: number, y: number, w: number, h: number) => void,
  ) => void;
};

function measureInWindow(
  target: MeasureInWindowView,
): Promise<{ y: number; h: number }> {
  return new Promise((resolve) => {
    target.measureInWindow((_x, y, _w, h) => resolve({ y, h }));
  });
}

/**
 * Auth forms: keep email/password + primary CTA visible above the keyboard.
 * Uses a form-block ref (fields → CTA). If the block is taller than the
 * viewport, the focused field wins so it is never covered.
 */
export function useKeyboardScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const focusedFieldRef = useRef<View | null>(null);
  const formBlockRef = useRef<View | null>(null);
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  const setFormBlockRef = useCallback((node: View | null) => {
    formBlockRef.current = node;
  }, []);

  const scrollFormIntoView = useCallback(() => {
    const scroll = scrollRef.current;
    const field = focusedFieldRef.current;
    if (!scroll || !field) return;

    const run = () => {
      void (async () => {
        const scrollBox = await measureInWindow(
          scroll as unknown as MeasureInWindowView,
        );
        const visibleTop = scrollBox.y + TOP_CLEARANCE;
        const visibleBottom = scrollBox.y + scrollBox.h - BOTTOM_CLEARANCE;
        const available = visibleBottom - visibleTop;
        if (available <= 0) return;

        const scrollBy = (delta: number) => {
          if (Math.abs(delta) < 2) return;
          scroll.scrollTo({
            y: Math.max(0, scrollYRef.current + delta),
            animated: true,
          });
        };

        const form = formBlockRef.current;
        if (form) {
          const formBox = await measureInWindow(
            form as unknown as MeasureInWindowView,
          );
          const formTop = formBox.y;
          const formBottom = formBox.y + formBox.h;

          // Whole form (email → CTA) fits: pin it above the keyboard with margin.
          if (formBox.h <= available) {
            if (formBottom > visibleBottom) {
              scrollBy(formBottom - visibleBottom);
            } else if (formTop < visibleTop) {
              scrollBy(formTop - visibleTop);
            }
            return;
          }
        }

        // Form taller than viewport: never cover the focused field.
        const fieldBox = await measureInWindow(
          field as unknown as MeasureInWindowView,
        );
        const fieldTop = fieldBox.y;
        const fieldBottom = fieldBox.y + fieldBox.h;

        if (fieldBottom > visibleBottom) {
          scrollBy(fieldBottom - visibleBottom);
          return;
        }
        if (fieldTop < visibleTop) {
          scrollBy(fieldTop - visibleTop);
        }
      })();
    };

    const delay = Platform.OS === "ios" ? 90 : 160;
    setTimeout(run, delay);
    setTimeout(run, delay + 220);
  }, []);

  useEffect(() => {
    if (keyboardHeight <= 0) return;
    scrollFormIntoView();
  }, [keyboardHeight, scrollFormIntoView]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const bindFieldFocus = useCallback(
    (fieldRef: React.RefObject<View | null>) => ({
      onFocus: () => {
        focusedFieldRef.current = fieldRef.current;
        scrollFormIntoView();
      },
      onBlur: () => {
        if (focusedFieldRef.current === fieldRef.current) {
          focusedFieldRef.current = null;
        }
      },
    }),
    [scrollFormIntoView],
  );

  const contentPaddingBottom =
    spacing[10] +
    BOTTOM_CLEARANCE +
    (keyboardHeight > 0
      ? keyboardHeight + Math.max(insets.bottom, 0)
      : spacing[6] + insets.bottom);

  return {
    scrollRef,
    onScroll,
    bindFieldFocus,
    setFormBlockRef,
    contentPaddingBottom,
    keyboardHeight,
  };
}
