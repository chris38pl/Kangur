import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import {
  ProfileIconBell,
  ProfileIconChevronRight,
  ProfileIconContact,
  ProfileIconDiscord,
  ProfileIconFeedback,
  ProfileIconHelp,
} from "@/features/profile/profile-icons";

const LANDING_BASE = "https://getkangur.com";
const CONTACT_EMAIL =
  process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim() || "contact@getkangur.com";
const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "support@getkangur.com";

const HELP_URLS = {
  faq: `${LANDING_BASE}/faq`,
} as const;

async function openExternalUrl(url: string) {
  await WebBrowser.openBrowserAsync(url);
}

async function openMailto(email: string, subject?: string) {
  const query = subject
    ? `?subject=${encodeURIComponent(subject)}`
    : "";
  await Linking.openURL(`mailto:${email}${query}`);
}

function HelpRow({
  icon,
  title,
  subtitle,
  value,
  showDivider,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value?: string;
  showDivider?: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}. ${subtitle}. ${value}` : `${title}. ${subtitle}`}
    >
      {({ pressed }) => (
        <View
          style={{
            opacity: pressed ? 0.7 : 1,
            minHeight: 72,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: theme.border,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              marginRight: spacing[3],
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </View>

          <View style={{ flex: 1, marginRight: spacing[2] }}>
            <Text
              style={{
                ...typography.body,
                color: theme.text,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          </View>

          {value ? (
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginRight: spacing[2],
                flexShrink: 0,
              }}
              numberOfLines={1}
            >
              {value}
            </Text>
          ) : null}

          <View
            style={{
              width: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ProfileIconChevronRight color={theme.textMuted} size={16} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function HelpSupportScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const openDiscord = () => {
    setComingSoonOpen(true);
  };

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.section }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing[2],
          paddingBottom: spacing[2],
          minHeight: 52,
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
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackIcon color={theme.text} size={22} />
        </Pressable>
        <Text
          style={{
            ...typography.title,
            color: theme.text,
            flex: 1,
            marginRight: 44,
            textAlign: "center",
          }}
        >
          {t("helpSupport.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <HelpRow
            icon={<ProfileIconHelp color={theme.primary} />}
            title={t("helpSupport.faq")}
            subtitle={t("helpSupport.faqSubtitle")}
            showDivider
            onPress={() => void openExternalUrl(HELP_URLS.faq)}
          />
          <HelpRow
            icon={<ProfileIconContact color={theme.primary} />}
            title={t("helpSupport.contact")}
            subtitle={CONTACT_EMAIL}
            showDivider
            onPress={() => void openMailto(CONTACT_EMAIL)}
          />
          <HelpRow
            icon={<ProfileIconDiscord color={theme.primary} />}
            title={t("helpSupport.discord")}
            subtitle={t("helpSupport.discordSubtitle")}
            value={`(${t("home.comingSoonBadge")})`}
            showDivider
            onPress={openDiscord}
          />
          <HelpRow
            icon={<ProfileIconBell color={theme.primary} />}
            title={t("helpSupport.reportBug")}
            subtitle={SUPPORT_EMAIL}
            showDivider
            onPress={() =>
              void openMailto(SUPPORT_EMAIL, t("helpSupport.reportBug"))
            }
          />
          <HelpRow
            icon={<ProfileIconFeedback color={theme.primary} />}
            title={t("helpSupport.sendFeedback")}
            subtitle={SUPPORT_EMAIL}
            onPress={() =>
              void openMailto(SUPPORT_EMAIL, t("helpSupport.sendFeedback"))
            }
          />
        </View>
      </ScrollView>

      <FeedbackSheet
        visible={comingSoonOpen}
        image={brandAssets.createListMascot}
        title={t("profile.comingSoon")}
        body={t("profile.comingSoonBody")}
        primaryLabel={t("common.return")}
        onPrimary={() => setComingSoonOpen(false)}
      />
    </Screen>
  );
}
