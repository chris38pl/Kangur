import { useEffect, type ReactNode } from "react";
import { type StyleProp, type ViewStyle, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius } from "@/design-system/tokens";

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

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [pulse]);

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
