import { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { motionDuration, motionEasing } from "@/design-system/motion";
import { colors } from "@/design-system/tokens";
import { useReducedMotion } from "@/lib/motion";

type Props = {
  progress: number;
  style?: StyleProp<ViewStyle>;
};

export function CategoryProgressBar({ progress, style }: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(Math.max(0, Math.min(1, progress)));

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: reduceMotion ? 0 : motionDuration.emphasis,
      easing: motionEasing.outCubic,
    });
  }, [progress, width, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={[
        {
          height: shoppingDensity.progressBarHeight,
          borderRadius: shoppingDensity.progressBarHeight,
          backgroundColor: theme.border,
          overflow: "hidden",
          marginTop: 6,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          fillStyle,
          {
            height: "100%",
            backgroundColor: shoppingDensity.purchasedColor,
            borderRadius: shoppingDensity.progressBarHeight,
          },
        ]}
      />
    </View>
  );
}
