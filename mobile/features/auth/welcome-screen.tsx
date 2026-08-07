import * as WebBrowser from "expo-web-browser";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Trans, useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { AuthBrandHero } from "@/features/auth/auth-brand-hero";
import { LanguagePickerSheet } from "@/features/auth/language-picker-sheet";
import {
  localeMeta,
  resolveAppLocale,
} from "@/lib/i18n/locales";

const LEGAL_URLS = {
  terms: "https://getkangur.com/terms",
  privacy: "https://getkangur.com/privacy",
} as const;

export function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [languageOpen, setLanguageOpen] = useState(false);
  const currentLocale = resolveAppLocale(i18n.language);
  const currentMeta = localeMeta(currentLocale);

  const pillPrimary = {
    ...primaryButtonStyle(theme),
    borderRadius: radius.full,
  };

  const pillSecondary = {
    ...secondaryButtonStyle(theme),
    borderRadius: radius.full,
  };

  const legalLinkStyle = {
    ...typography.caption,
    color: theme.primary,
    fontWeight: "600" as const,
  };

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing[6],
          paddingTop: spacing[4],
          paddingBottom: spacing[6],
        }}
      >
        <AuthBrandHero />

        <Text
          style={{
            ...typography.title,
            color: theme.text,
            textAlign: "center",
            marginTop: spacing[6],
          }}
        >
          {t("auth.welcomeGreeting")}{" "}
          <Text style={{ color: theme.primary }}>{t("auth.welcomeBrand")}</Text>
        </Text>

        <Text
          style={{
            ...typography.body,
            color: theme.textBody,
            textAlign: "center",
            marginTop: spacing[2],
            paddingHorizontal: spacing[2],
          }}
        >
          {t("auth.welcomeTagline")}
        </Text>

        <View style={{ marginTop: spacing[8], gap: spacing[3], flexGrow: 1 }}>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={pillPrimary}>
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("auth.welcomeSignUp")}
              </Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={pillSecondary}>
              <Text style={{ ...typography.label, color: theme.text }}>
                {t("auth.welcomeSignIn")}
              </Text>
            </Pressable>
          </Link>

          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              textAlign: "center",
              marginTop: spacing[2],
              paddingHorizontal: spacing[2],
            }}
          >
            <Trans
              i18nKey="auth.legalNotice"
              components={{
                terms: (
                  <Text
                    accessibilityRole="link"
                    style={legalLinkStyle}
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(LEGAL_URLS.terms);
                    }}
                  />
                ),
                privacy: (
                  <Text
                    accessibilityRole="link"
                    style={legalLinkStyle}
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(LEGAL_URLS.privacy);
                    }}
                  />
                ),
              }}
            />
          </Text>

          <View style={{ flex: 1, minHeight: spacing[6] }} />

          <Pressable
            onPress={() => setLanguageOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("auth.chooseLanguage")}
            hitSlop={8}
            style={{
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[2],
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[3],
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
            }}
          >
            <Text style={{ fontSize: 16, lineHeight: 20 }}>
              {currentMeta.emoji}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.text,
                fontWeight: "600",
              }}
            >
              {currentMeta.nativeName}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                fontSize: 11,
              }}
            >
              ▾
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <LanguagePickerSheet
        visible={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />
    </Screen>
  );
}
