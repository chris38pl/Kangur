import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { useColorScheme } from "@/components/useColorScheme";
import { KangurTabBar } from "@/components/tab-bar/kangur-tab-bar";
import { colors, spacing, typography } from "@/design-system/tokens";
import { useMe } from "@/features/auth/useMe";
import { CreateListProvider, useCreateList } from "@/features/shopping-list/create-list-provider";
import { ApiClientError } from "@/lib/api/client";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/design-system/shopping-density";

function TabsWithBar() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const { t } = useTranslation();
  const { openCreateList } = useCreateList();

  return (
    <Tabs
      tabBar={(props) => (
        <KangurTabBar {...props} onCreatePress={openCreateList} />
      )}
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
      }}
    >
      {/* Order: Home | Spaces | [FAB] | Archive | Profile */}
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home") }}
      />
      <Tabs.Screen
        name="workspace"
        options={{ title: t("tabs.workspace") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t("tabs.archive") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("tabs.profile") }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const { t } = useTranslation();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const me = useMe(Boolean(isSignedIn));

  if (!isLoaded) {
    return (
      <Screen style={{ backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </Screen>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (me.isPending) {
    return (
      <Screen
        style={{
          backgroundColor: theme.bg,
          padding: spacing[6],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} />
        <Text
          style={{
            ...typography.body,
            color: theme.textMuted,
            marginTop: spacing[4],
          }}
        >
          {t("auth.loadingProfile")}
        </Text>
      </Screen>
    );
  }

  if (me.isError) {
    const code =
      me.error instanceof ApiClientError ? me.error.code : "UNKNOWN";
    return (
      <Screen
        style={{
          backgroundColor: theme.bg,
          padding: spacing[6],
          justifyContent: "center",
        }}
      >
        <Text style={{ ...typography.title, color: theme.text }}>
          {t("auth.meFailedTitle")}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: theme.textMuted,
            marginTop: spacing[2],
          }}
        >
          {t(`auth.errors.${code}`, {
            defaultValue: t("auth.errors.UNKNOWN"),
          })}
        </Text>
        <Pressable
          onPress={() => void me.refetch()}
          style={{
            marginTop: spacing[6],
            ...primaryButtonStyle(theme),
          }}
        >
          <Text style={{ ...typography.label, color: theme.onPrimary }}>
            {t("auth.retry")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            console.info("[auth]", "SignOut", { reason: "me_failed" });
            void signOut();
          }}
          style={{
            marginTop: spacing[3],
            ...secondaryButtonStyle(theme),
          }}
        >
          <Text style={{ ...typography.label, color: theme.primary }}>
            {t("auth.signOut")}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <CreateListProvider>
      <TabsWithBar />
    </CreateListProvider>
  );
}
