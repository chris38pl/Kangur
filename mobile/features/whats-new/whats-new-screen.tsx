import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";
import { BackIcon } from "@/features/auth/auth-icons";

import { loadReleases } from "./load-releases";
import { ReleaseVersionBlock } from "./release-version-block";

export function WhatsNewScreen() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const releases = loadReleases();
  const locale = i18n.language;

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
            else router.replace("/about" as never);
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
          {t("whatsNew.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {releases.length === 0 ? (
          <Text
            style={{
              ...typography.body,
              color: theme.textMuted,
              textAlign: "center",
              marginTop: spacing[8],
            }}
          >
            {t("whatsNew.empty")}
          </Text>
        ) : (
          releases.map((release, index) => (
            <ReleaseVersionBlock
              key={release.version}
              release={release}
              locale={locale}
              showDivider={index < releases.length - 1}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
