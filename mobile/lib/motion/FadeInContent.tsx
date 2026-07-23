import { type ReactNode, useEffect, useRef, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionEasing, resolveDuration } from "@/design-system/motion";

import { useReducedMotion } from "./useReducedMotion";

type Props = {
  /** When true, run first-show enter once. */
  visible: boolean;
  children: ReactNode;
  style?: object;
};

/**
 * First-show content enter only. Revisits (empty↔list toggles) are instant.
 * Motion Budget: do not stack with LoadingTransition.
 */
export function FadeInContent({ visible, children, style }: Props) {
  const reduceMotion = useReducedMotion();
  const hasEntered = useRef(false);
  const [mounted, setMounted] = useState(visible);
  const opacity = useSharedValue(visible && !hasEntered.current ? 0 : 1);
  const translateY = useSharedValue(visible && !hasEntered.current ? 6 : 0);

  useEffect(() => {
    if (!visible) {
      setMounted(false);
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    setMounted(true);

    if (hasEntered.current) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    hasEntered.current = true;
    const duration = resolveDuration("enter", { reduceMotion });
    if (duration === 0) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = reduceMotion ? 0 : 6;
    opacity.value = withTiming(1, {
      duration,
      easing: motionEasing.outCubic,
    });
    translateY.value = withTiming(0, {
      duration,
      easing: motionEasing.outCubic,
    });
  }, [visible, opacity, translateY, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
