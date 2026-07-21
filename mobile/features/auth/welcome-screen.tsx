import { Link } from "expo-router";
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

const TERMS_PLACEHOLDER_URL = "https://getkangur.com/terms";
const PRIVACY_PLACEHOLDER_URL = "https://getkangur.com/privacy";

export function WelcomeScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

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

        <View style={{ marginTop: spacing[8], gap: spacing[3] }}>
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
                      console.info("[auth]", "OpenTerms", {
                        url: TERMS_PLACEHOLDER_URL,
                      });
                    }}
                  />
                ),
                privacy: (
                  <Text
                    accessibilityRole="link"
                    style={legalLinkStyle}
                    onPress={() => {
                      console.info("[auth]", "OpenPrivacy", {
                        url: PRIVACY_PLACEHOLDER_URL,
                      });
                    }}
                  />
                ),
              }}
            />
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
