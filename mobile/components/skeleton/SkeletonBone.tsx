import { useEffect, type ReactNode } from "react";
import { type StyleProp, type ViewStyle, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { motionEasing } from "@/design-system/motion";
import { colors, radius } from "@/design-system/tokens";
import { useReducedMotion } from "@/lib/motion";

type BoneProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft pulsing bone for skeleton screens.
 * Opacity-only animation - cheap and calm (not a harsh shimmer sweep).
 */
export function SkeletonBone({
  width = "100%",
  height,
  borderRadius = radius.sm,
  style,
}: BoneProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const pulse = useSharedValue(0.55);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.75;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1100,
        easing: motionEasing.inOutEase,
      }),
      -1,
      true,
    );
  }, [pulse, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
        },
        animStyle,
        style,
      ]}
    />
  );
}

type BlockProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Neutral layout wrapper - no pulse of its own. */
export function SkeletonBlock({ children, style }: BlockProps) {
  return <View style={style}>{children}</View>;
}
