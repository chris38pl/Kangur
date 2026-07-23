import { type ReactNode, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionEasing, resolveDuration } from "@/design-system/motion";

import { useReducedMotion } from "./useReducedMotion";

type Props = {
  visible: boolean;
  children: ReactNode;
  style?: object;
  onExited?: () => void;
};

/**
 * Toast / banner enter + exit. Schedule after LoadingTransition (Motion Budget).
 */
export function ToastMotion({ visible, children, style, onExited }: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (visible) {
      const duration = resolveDuration("enter", { reduceMotion });
      opacity.value = withTiming(1, {
        duration,
        easing: motionEasing.outCubic,
      });
      translateY.value = withTiming(0, {
        duration,
        easing: motionEasing.outCubic,
      });
      return;
    }

    const duration = resolveDuration("exit", { reduceMotion });
    opacity.value = withTiming(0, {
      duration,
      easing: motionEasing.outCubic,
    });
    translateY.value = withTiming(reduceMotion ? 0 : 8, {
      duration,
      easing: motionEasing.outCubic,
    });
    const t = setTimeout(() => onExited?.(), duration);
    return () => clearTimeout(t);
  }, [visible, opacity, translateY, reduceMotion, onExited]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
