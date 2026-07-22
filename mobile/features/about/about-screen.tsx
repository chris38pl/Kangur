import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { ProfileIconChevronRight } from "@/features/profile/profile-icons";
import {
  getAppBuildInfo,
  type AppEnvironment,
} from "@/lib/app-build-info";

const LANDING_BASE = "https://getkangur.com";

const LEGAL_URLS = {
  privacy: `${LANDING_BASE}/privacy`,
  terms: `${LANDING_BASE}/terms`,
} as const;

function envBadgeColors(
  environment: AppEnvironment,
  theme: (typeof colors)["light"],
): { bg: string; text: string } {
  switch (environment) {
    case "development":
      return { bg: `${theme.success}22`, text: theme.success };
    case "preview":
      return { bg: `${theme.warning}22`, text: theme.warning };
    case "production":
      return { bg: `${theme.primary}22`, text: theme.primary };
  }
}

function LegalRow({
  title,
  showDivider,
  onPress,
}: {
  title: string;
  showDivider?: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {({ pressed }) => (
        <View
          style={{
            opacity: pressed ? 0.7 : 1,
            minHeight: 56,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing[4],
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: theme.border,
          }}
        >
          <Text
            style={{
              ...typography.body,
              color: theme.text,
              fontWeight: "600",
              flex: 1,
              marginRight: spacing[2],
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <ProfileIconChevronRight color={theme.textMuted} size={16} />
        </View>
      )}
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  showDivider,
  onPress,
  trailing,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const body = (
    <View
      style={{
        minHeight: 64,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {label}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.text,
            fontWeight: "600",
            marginTop: 2,
          }}
          selectable={!onPress}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.7 : 1 }}>{body}</View>
      )}
    </Pressable>
  );
}

function EnvironmentBadge({ environment }: { environment: AppEnvironment }) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = envBadgeColors(environment, theme);
  const label = t(`about.env.${environment}`);

  return (
    <View
      style={{
        alignSelf: "flex-start",
        marginTop: 4,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.full,
        backgroundColor: badge.bg,
      }}
      accessibilityRole="text"
      accessibilityLabel={`${t("about.environment")}: ${label}`}
    >
      <Text
        style={{
          ...typography.caption,
          color: badge.text,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function AboutScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const info = getAppBuildInfo();
  const copyrightYear = new Date().getFullYear();
  const [commitCopied, setCommitCopied] = useState(false);

  const headerSubtitle = info.isDevelopment
    ? t("about.developmentBuild")
    : info.build !== "-"
      ? t("about.versionWithBuild", {
          version: info.version,
          build: info.build,
        })
      : t("about.versionLine", { version: info.version });

  const copyCommit = async () => {
    if (!info.commit) return;
    await Clipboard.setStringAsync(info.commit);
    setCommitCopied(true);
    setTimeout(() => setCommitCopied(false), 2000);
  };

  return (
    <Screen edges={["top"]} style={{ backgroundColor: theme.bg }}>
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
          {t("about.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[6],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={brandAssets.icon}
            style={{ width: 128, height: 128, borderRadius: 64 }}
            accessibilityIgnoresInvertColors
            accessibilityLabel={t("about.appName")}
          />
          <Text
            style={{
              ...typography.title,
              fontSize: 28,
              lineHeight: 34,
              color: theme.text,
              fontWeight: "700",
              marginTop: spacing[5],
              textAlign: "center",
            }}
          >
            {t("about.appName")}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              marginTop: spacing[2],
              textAlign: "center",
            }}
          >
            {headerSubtitle}
          </Text>
          <View style={{ marginTop: spacing[3] }}>
            <EnvironmentBadge environment={info.environment} />
          </View>
        </View>

        <View
          style={{
            marginTop: spacing[8],
            backgroundColor: theme.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <LegalRow
            title={t("about.privacy")}
            showDivider
            onPress={() => void WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
          />
          <LegalRow
            title={t("about.terms")}
            showDivider
            onPress={() => void WebBrowser.openBrowserAsync(LEGAL_URLS.terms)}
          />
          {!info.isDevelopment ? (
            <>
              <InfoRow
                label={t("about.version")}
                value={info.version}
                showDivider
              />
              <InfoRow
                label={t("about.build")}
                value={info.build}
                showDivider
              />
            </>
          ) : null}
          <View
            style={{
              minHeight: 64,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ ...typography.caption, color: theme.textMuted }}>
              {t("about.environment")}
            </Text>
            <EnvironmentBadge environment={info.environment} />
          </View>
          {info.commit ? (
            <InfoRow
              label={t("about.commit")}
              value={commitCopied ? t("about.commitCopied") : info.commit}
              showDivider
              onPress={() => void copyCommit()}
            />
          ) : (
            <InfoRow
              label={t("about.commit")}
              value="-"
              showDivider
            />
          )}
          <InfoRow label={t("about.api")} value={info.apiHost} />
        </View>

        <View style={{ flex: 1, minHeight: spacing[10] }} />

        <View style={{ paddingHorizontal: spacing[1] }}>
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
            }}
          >
            {t("about.copyrightLine", { year: copyrightYear })}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 2,
            }}
          >
            {t("about.rightsReserved")}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
