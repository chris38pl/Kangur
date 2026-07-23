import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import { motionSpring } from "@/design-system/motion";
import { colors, typography } from "@/design-system/tokens";

type Props = {
  visible: boolean;
  expanded: boolean;
  onPress: () => void;
};

export function ShoppingFab({ visible, expanded, onPress }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const size = useSharedValue<number>(shoppingDensity.fabSize);
  const width = useSharedValue<number>(shoppingDensity.fabSize);
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSpring(visible ? 1 : 0, motionSpring.soft);
  }, [visible, opacity]);

  useEffect(() => {
    width.value = withSpring(
      expanded ? 140 : shoppingDensity.fabSize,
      motionSpring.soft,
    );
  }, [expanded, width]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    height: size.value,
    opacity: opacity.value,
    borderRadius: size.value / 2,
  }));

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        style,
        {
          position: "absolute",
          right: 20,
          bottom: 28 + insets.bottom,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ ...typography.label, color: "#fff" }} numberOfLines={1}>
          {expanded ? t("shoppingMode.addItem") : "+"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
