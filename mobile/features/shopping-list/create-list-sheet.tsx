import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { shoppingDensity } from "@/design-system/shopping-density";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";

export type CreateListPath =
  | "empty"
  | "screenshot"
  | "clipboard"
  | "photo"
  | "voice";

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onSelect: (path: CreateListPath) => void;
};

type RowProps = {
  icon: string;
  title: string;
  subtitle?: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function SheetRow({
  icon,
  title,
  subtitle,
  primary,
  disabled,
  onPress,
}: RowProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        borderRadius: radius.lg,
        backgroundColor: primary ? theme.accent : theme.surface,
        borderWidth: 1,
        borderColor: primary ? theme.primaryLight : theme.border,
        opacity: disabled ? 0.4 : 1,
        minHeight: shoppingDensity.primaryCtaMinHeight,
        marginBottom: spacing[2],
      }}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.headline, color: theme.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...typography.caption, color: theme.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function CreateListSheet({ visible, busy, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(31,43,69,0.28)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            padding: spacing[6],
            paddingBottom: spacing[12],
            ...shadows.soft,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              marginBottom: spacing[5],
            }}
          />
          <Text style={{ ...typography.title, color: theme.text }}>
            {t("home.createSheetTitle")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textBody,
              marginTop: spacing[2],
              marginBottom: spacing[6],
            }}
          >
            {t("home.createSheetSubtitle")}
          </Text>

          {busy ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ marginVertical: spacing[6] }}
            />
          ) : (
            <>
              <Text
                style={{
                  ...typography.label,
                  color: theme.primary,
                  marginBottom: spacing[2],
                }}
              >
                {t("home.createAiSection")}
              </Text>
              <SheetRow
                icon="📷"
                title={t("home.createScreenshot")}
                subtitle={t("home.createScreenshotHint")}
                primary
                onPress={() => onSelect("screenshot")}
              />
              <SheetRow
                icon="📋"
                title={t("home.createClipboard")}
                subtitle={t("home.createClipboardHint")}
                primary
                onPress={() => onSelect("clipboard")}
              />
              <SheetRow
                icon="🖼️"
                title={t("home.createPhoto")}
                subtitle={t("home.createPhotoHint")}
                primary
                onPress={() => onSelect("photo")}
              />

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.border,
                  marginVertical: spacing[4],
                }}
              />

              <SheetRow
                icon="✏️"
                title={t("home.createEmpty")}
                subtitle={t("home.createEmptyHint")}
                onPress={() => onSelect("empty")}
              />
              <SheetRow
                icon="🎤"
                title={t("home.createVoice")}
                subtitle={t("home.comingSoon")}
                disabled
                onPress={() => {}}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
