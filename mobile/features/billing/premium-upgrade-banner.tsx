import { Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { brandAssets } from "@/design-system/brand-assets";
import { radius, shadows, spacing, typography } from "@/design-system/tokens";

type Props = {
  onPress?: () => void;
};

export function PremiumUpgradeBanner({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("billing.upgradeCta")}
      style={{
        marginTop: spacing[6],
        backgroundColor: "#FFF9F2",
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        paddingLeft: spacing[4],
        paddingRight: spacing[2],
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        ...shadows.soft,
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing[2], zIndex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: spacing[2],
          }}
        >
          <Text style={{ fontSize: 16, lineHeight: 22, marginTop: 1 }}>👑</Text>
          <Text
            style={{
              ...typography.headline,
              flex: 1,
              color: "#A65E2E",
              fontSize: 16,
              lineHeight: 22,
            }}
          >
            {t("billing.upgradeTitle")}
          </Text>
        </View>
        <Text
          style={{
            ...typography.caption,
            color: "#3C4858",
            marginTop: spacing[2],
            lineHeight: 18,
          }}
        >
          {t("billing.upgradeBody")}
        </Text>
        <View
          style={{
            marginTop: spacing[3],
            alignSelf: "flex-start",
            backgroundColor: "#007D69",
            borderRadius: radius.full,
            paddingVertical: spacing[2] + 2,
            paddingHorizontal: spacing[4],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
          }}
        >
          <Text style={{ ...typography.label, color: "#fff", fontSize: 13 }}>
            {t("billing.upgradeCta")}
          </Text>
          <Text style={{ color: "#fff", fontSize: 16, lineHeight: 18, fontWeight: "300" }}>
            ›
          </Text>
        </View>
      </View>

      <Image
        source={brandAssets.premiumUpgrade}
        style={{
          width: 96,
          height: 96,
          resizeMode: "contain",
          marginRight: -spacing[1],
        }}
        accessibilityLabel=""
      />
    </Pressable>
  );
}
