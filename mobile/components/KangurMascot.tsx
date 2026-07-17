import { Image, type ImageStyle, type StyleProp, View } from "react-native";

import { brandAssets } from "@/design-system/brand-assets";

type Props = {
  variant?: "hero" | "icon";
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function KangurMascot({
  variant = "hero",
  width,
  height,
  style,
}: Props) {
  const source = variant === "icon" ? brandAssets.icon : brandAssets.hero;
  const w = width ?? (variant === "icon" ? 96 : 280);
  const h = height ?? (variant === "icon" ? 96 : 220);

  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={source}
        style={[{ width: w, height: h, resizeMode: "contain" }, style]}
        accessibilityLabel="Kangur"
      />
    </View>
  );
}
