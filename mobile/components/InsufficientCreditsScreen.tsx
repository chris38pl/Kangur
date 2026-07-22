import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

export type InsufficientCreditsScreenProps = {
  visible: boolean;
  needed: number;
  remaining: number;
  /** Override default body copy (e.g. meal-proposal specific). */
  description?: string;
  onPremium: () => void;
  onBack: () => void;
};

/**
 * Full-screen “no AI credits” gate: mascot · title · need/have · Premium CTA · back.
 */
export function InsufficientCreditsScreen({
  visible,
  needed,
  remaining,
  description,
  onPremium,
  onBack,
}: InsufficientCreditsScreenProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const body =
    description ?? t("ai.insufficientCreditsBody");
  const neededLabel = t("ai.insufficientCreditsAmount", { count: needed });
  const remainingLabel = t("ai.insufficientCreditsAmount", {
    count: remaining,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onBack}
    >
      <Screen
        style={{ backgroundColor: theme.bg }}
        edges={["top", "bottom"]}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: spacing[8],
            paddingBottom: spacing[6] + insets.bottom,
            alignItems: "center",
            flexGrow: 1,
            justifyContent: "center",
          }}
          bounces={false}
        >
          <Image
            source={brandAssets.noCredits}
            style={{ width: 220, height: 220, resizeMode: "contain" }}
            accessibilityLabel=""
          />

          <Text
            style={{
              ...typography.title,
              fontSize: 22,
              lineHeight: 30,
              color: theme.text,
              textAlign: "center",
              marginTop: spacing[5],
            }}
          >
            {t("ai.insufficientCreditsTitle")}
          </Text>

          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              textAlign: "center",
              marginTop: spacing[3],
              paddingHorizontal: spacing[2],
            }}
          >
            {body}
          </Text>

          <View
            style={{
              marginTop: spacing[6],
              alignSelf: "stretch",
              flexDirection: "row",
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: radius.lg,
              backgroundColor: theme.surface,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flex: 1,
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[3],
                alignItems: "center",
                gap: spacing[1],
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  textAlign: "center",
                }}
              >
                {t("ai.insufficientCreditsNeed")}
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {neededLabel}
              </Text>
            </View>

            <View
              style={{
                width: 1,
                alignSelf: "stretch",
                backgroundColor: theme.border,
              }}
            />

            <View
              style={{
                flex: 1,
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[3],
                alignItems: "center",
                gap: spacing[1],
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  textAlign: "center",
                }}
              >
                {t("ai.insufficientCreditsHave")}
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {remainingLabel}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: spacing[8],
              alignSelf: "stretch",
              gap: spacing[3],
            }}
          >
            <Pressable
              onPress={onPremium}
              accessibilityRole="button"
              accessibilityLabel={t("billing.upgradeCta")}
              style={{
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("billing.upgradeCta")}
              </Text>
            </Pressable>

            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t("common.return")}
              style={{
                paddingVertical: spacing[3],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.primary }}>
                {t("common.return")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Screen>
    </Modal>
  );
}
