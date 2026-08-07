import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { applyAppLocale } from "@/lib/i18n/apply-app-locale";
import {
  SUPPORTED_LOCALES,
  resolveAppLocale,
  type AppLocale,
} from "@/lib/i18n/locales";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Optional extra work after local locale apply (e.g. sync /me when signed in). */
  onLocaleSelected?: (locale: AppLocale) => void | Promise<void>;
};

function FlagBadge({ emoji }: { emoji: string }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
      }}
    >
      <Text style={{ fontSize: 16, lineHeight: 20 }}>{emoji}</Text>
    </View>
  );
}

/**
 * Bottom sheet language picker — welcome / pre-auth and reusable elsewhere.
 */
export function LanguagePickerSheet({
  visible,
  onClose,
  onLocaleSelected,
}: Props) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const current = resolveAppLocale(i18n.language);

  const select = (locale: AppLocale) => {
    void (async () => {
      if (locale !== current) {
        await applyAppLocale(locale);
        await onLocaleSelected?.(locale);
      }
      onClose();
    })();
  };

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
          accessibilityLabel={t("common.cancel")}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(31, 43, 69, 0.4)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: spacing[3],
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            maxHeight: "72%",
            ...shadows.soft,
          }}
        >
          <View style={{ alignItems: "center", paddingBottom: spacing[3] }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.border,
              }}
            />
          </View>

          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              textAlign: "center",
              paddingHorizontal: spacing[6],
              marginBottom: spacing[2],
            }}
          >
            {t("auth.chooseLanguage")}
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[2],
            }}
          >
            <View
              style={{
                backgroundColor: theme.bg,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: "hidden",
              }}
            >
              {SUPPORTED_LOCALES.map((option, index) => {
                const selected = current === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => select(option.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.nativeName}
                    style={{
                      minHeight: 54,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: spacing[4],
                      gap: spacing[3],
                      borderBottomWidth:
                        index < SUPPORTED_LOCALES.length - 1 ? 1 : 0,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <FlagBadge emoji={option.emoji} />
                    <Text
                      style={{
                        ...typography.body,
                        color: theme.text,
                        fontWeight: "600",
                        flex: 1,
                      }}
                    >
                      {option.nativeName}
                    </Text>
                    {selected ? (
                      <Text
                        style={{
                          fontSize: 18,
                          color: theme.primary,
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
