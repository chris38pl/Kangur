import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { shoppingDensity } from "@/design-system/shopping-density";
import { colors } from "@/design-system/tokens";
import { useColorScheme } from "@/components/useColorScheme";

type Props = {
  progress: number;
};

export function CategoryProgressBar({ progress }: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const width = useSharedValue(Math.max(0, Math.min(1, progress)));

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 280,
    });
  }, [progress, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={{
        height: shoppingDensity.progressBarHeight,
        borderRadius: shoppingDensity.progressBarHeight,
        backgroundColor: theme.border,
        overflow: "hidden",
        marginTop: 6,
      }}
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
