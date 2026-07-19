import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";

function resolveAboutInfo() {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "—";
  const extra = Constants.expoConfig?.extra as
    | { appEnv?: string; gitCommit?: string; apiLabel?: string }
    | undefined;
  const environment =
    extra?.appEnv ??
    process.env.EXPO_PUBLIC_APP_ENV?.trim() ??
    (__DEV__ ? "development" : "production");
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  let api = extra?.apiLabel ?? "—";
  if (apiUrl) {
    try {
      api = new URL(apiUrl).host;
    } catch {
      api = apiUrl;
    }
  }
  const commit =
    extra?.gitCommit ??
    process.env.EXPO_PUBLIC_GIT_COMMIT?.trim() ??
    "—";

  return {
    version: build !== "—" ? `${version} (${build})` : version,
    environment,
    api,
    build,
    commit,
  };
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
          onPress={() => router.back()}
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
          <InfoRow
            label={t("about.version")}
            value={info.version}
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
      </ScrollView>
    </Screen>
  );
}
