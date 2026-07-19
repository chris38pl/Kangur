import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import {
  SUPPORTED_LOCALES,
  type AppLocale,
  resolveAppLocale,
} from "@/lib/i18n/locales";

function FlagBadge({ emoji }: { emoji: string }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
      }}
    >
      <Text style={{ fontSize: 22, lineHeight: 26 }}>{emoji}</Text>
    </View>
  );
}

function CheckMark({ color }: { color: string }) {
  return (
    <Text
      style={{
        fontSize: 20,
        lineHeight: 22,
        color,
        fontWeight: "700",
      }}
      accessibilityElementsHidden
    >
      ✓
    </Text>
  );
}

export function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const current = resolveAppLocale(i18n.language);

  const select = (locale: AppLocale) => {
    if (locale === current) return;
    void i18n.changeLanguage(locale).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    });
  };

  return (
    <Screen edges={["top", "bottom"]} style={{ backgroundColor: theme.section }}>
      <View
        style={{
          paddingHorizontal: spacing[4],
          paddingBottom: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 40,
          }}
        >
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/profile" as never);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <BackIcon size={20} />
          </Pressable>

          <Text
            numberOfLines={1}
            style={{
              ...typography.headline,
              color: theme.text,
              position: "absolute",
              left: 48,
              right: 48,
              textAlign: "center",
            }}
          >
            {t("profile.appLanguage")}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing[6], paddingTop: spacing[6] }}>
        <View
          style={{
            backgroundColor: theme.surface,
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
                  minHeight: 64,
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
                {selected ? <CheckMark color={theme.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          textAlign: "center",
          paddingHorizontal: spacing[6],
          paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[2],
        }}
      >
        {t("profile.languageHint")}
      </Text>
    </Screen>
  );
}
