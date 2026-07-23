import { type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionEasing, resolveDuration } from "@/design-system/motion";

import { useReducedMotion } from "./useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale when pressed (default 0.98). */
  pressedScale?: number;
};

/**
 * Allowlist press scale for primary cards / CTAs.
 * Do NOT use on: checkboxes, list rows, swipe rows, segmented controls, tabs.
 */
export function PressableScale({
  children,
  style,
  pressedScale = 0.98,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, animStyle]}
      onPressIn={(e) => {
        const duration = resolveDuration("press", { reduceMotion });
        scale.value = withTiming(pressedScale, {
          duration,
          easing: motionEasing.outCubic,
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        const duration = resolveDuration("press", { reduceMotion });
        scale.value = withTiming(1, {
          duration,
          easing: motionEasing.outCubic,
        });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
