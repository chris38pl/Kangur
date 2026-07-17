import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

type Props = {
  visible: boolean;
  onContinue: () => void;
  onDiscard: () => void;
};

export function ResumeShoppingDialog({
  visible,
  onContinue,
  onDiscard,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          padding: spacing[6],
        }}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: radius.lg,
            padding: spacing[6],
          }}
        >
          <Text style={{ ...typography.headline, color: theme.text }}>
            {t("shoppingMode.resumeTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              marginTop: spacing[2],
            }}
          >
            {t("shoppingMode.resumeBody")}
          </Text>
          <Pressable
            onPress={onContinue}
            style={{
              marginTop: spacing[6],
              backgroundColor: theme.primary,
              borderRadius: radius.md,
              paddingVertical: spacing[4],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.label, color: "#fff" }}>
              {t("shoppingMode.resumeContinue")}
            </Text>
          </Pressable>
          <Pressable
            onPress={onDiscard}
            style={{ marginTop: spacing[3], alignItems: "center" }}
          >
            <Text style={{ ...typography.label, color: theme.danger }}>
              {t("shoppingMode.resumeDiscard")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
