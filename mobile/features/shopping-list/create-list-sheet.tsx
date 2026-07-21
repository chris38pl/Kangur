import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { CreateListOptionRow } from "@/features/shopping-list/create-list-option-row";

export type CreateListPath =
  | "empty"
  | "screenshot"
  | "clipboard"
  | "photo"
  | "describe"
  | "voice"
  | "fromHistory";

type Props = {
  visible: boolean;
  busy?: boolean;
  showFromHistory?: boolean;
  onClose: () => void;
  onSelect: (path: CreateListPath) => void;
};

export function CreateListSheet({
  visible,
  busy,
  showFromHistory = false,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("workspace.cancel")}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(31, 43, 69, 0.32)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            maxHeight: "92%",
            paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[3],
            ...shadows.soft,
          }}
        >
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: spacing[6],
              paddingTop: spacing[5],
              paddingBottom: spacing[2],
            }}
          >
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("workspace.cancel")}
              style={{
                alignSelf: "flex-end",
                width: 36,
                height: 36,
                borderRadius: radius.full,
                backgroundColor: theme.section,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  lineHeight: 20,
                  color: theme.textMuted,
                  fontWeight: "600",
                }}
              >
                ×
              </Text>
            </Pressable>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing[3],
                marginTop: -spacing[2],
                marginBottom: spacing[5],
                paddingRight: spacing[2],
              }}
            >
              <View style={{ flex: 1, paddingTop: spacing[2] }}>
                <Text style={{ ...typography.title, color: theme.text }}>
                  {t("home.createSheetTitle")}
                </Text>
                <Text
                  style={{
                    ...typography.body,
                    color: theme.textBody,
                    marginTop: spacing[2],
                  }}
                >
                  {t("home.createSheetSubtitle")}
                </Text>
              </View>

              <Image
                source={brandAssets.createListMascot}
                style={{
                  width: 140,
                  height: 168,
                  marginTop: spacing[2],
                  resizeMode: "contain",
                }}
                accessibilityLabel=""
              />
            </View>

            {busy ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginVertical: spacing[10] }}
              />
            ) : (
              <>
                <CreateListOptionRow
                  icon="📷"
                  title={t("home.createImage")}
                  subtitle={t("home.createImageHint")}
                  onPress={() => onSelect("photo")}
                />
                <CreateListOptionRow
                  icon="🛒"
                  title={t("home.createClipboard")}
                  subtitle={t("home.createClipboardHint")}
                  onPress={() => onSelect("clipboard")}
                />
                <CreateListOptionRow
                  icon="✏️"
                  title={t("home.createDescribe")}
                  subtitle={t("home.createDescribeHint")}
                  onPress={() => onSelect("describe")}
                />
                {showFromHistory ? (
                  <CreateListOptionRow
                    icon="✨"
                    title={t("home.createFromHistory")}
                    subtitle={t("home.createFromHistoryHint")}
                    onPress={() => onSelect("fromHistory")}
                  />
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing[3],
                    marginVertical: spacing[4],
                  }}
                >
                  <View
                    style={{ flex: 1, height: 1, backgroundColor: theme.border }}
                  />
                  <Text
                    style={{
                      ...typography.caption,
                      color: theme.textMuted,
                      fontWeight: "700",
                      letterSpacing: 1,
                    }}
                  >
                    {t("home.createOr")}
                  </Text>
                  <View
                    style={{ flex: 1, height: 1, backgroundColor: theme.border }}
                  />
                </View>

                <CreateListOptionRow
                  icon="☰"
                  title={t("home.createEmpty")}
                  subtitle={t("home.createEmptyHint")}
                  onPress={() => onSelect("empty")}
                />
                <CreateListOptionRow
                  icon="🎤"
                  title={t("home.createVoice")}
                  subtitle={t("home.createVoiceHint")}
                  disabled
                  soon
                  soonLabel={t("home.comingSoonBadge")}
                  onPress={() => {}}
                />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
