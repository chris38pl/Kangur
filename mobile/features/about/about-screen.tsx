import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";
import { ProfileIconChevronRight } from "@/features/profile/profile-icons";

const LANDING_BASE = "https://getkangur.com";

const LEGAL_URLS = {
  privacy: `${LANDING_BASE}/privacy`,
  terms: `${LANDING_BASE}/terms`,
} as const;

function resolveAboutInfo() {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "-";
  const extra = Constants.expoConfig?.extra as
    | { appEnv?: string; gitCommit?: string; apiLabel?: string }
    | undefined;
  const environment =
    extra?.appEnv ??
    process.env.EXPO_PUBLIC_APP_ENV?.trim() ??
    (__DEV__ ? "development" : "production");
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  let api = extra?.apiLabel ?? "-";
  if (apiUrl) {
    try {
      api = new URL(apiUrl).host;
    } catch {
      api = apiUrl;
    }
  }
  const commit =
    extra?.gitCommit ?? process.env.EXPO_PUBLIC_GIT_COMMIT?.trim() ?? "-";

  return {
    versionLine: build !== "-" ? `${version} (${build})` : version,
    environment,
    api,
    build,
    commit,
  };
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
}: {
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View
      style={{
        minHeight: 64,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
      }}
    >
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
        selectable
      >
        {value}
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
  const info = resolveAboutInfo();
  const copyrightYear = new Date().getFullYear();

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
            {t("about.versionLine", { version: info.versionLine })}
          </Text>
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
          <InfoRow
            label={t("about.version")}
            value={info.versionLine}
            showDivider
          />
          <InfoRow
            label={t("about.environment")}
            value={info.environment}
            showDivider
          />
          <InfoRow label={t("about.api")} value={info.api} showDivider />
          <InfoRow label={t("about.build")} value={info.build} showDivider />
          <InfoRow label={t("about.commit")} value={info.commit} />
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
