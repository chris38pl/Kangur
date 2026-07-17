import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
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
  const headerShown = useClientOnlyValue(false, true);
  const { openCreateList } = useCreateList();

  return (
    <Tabs
      tabBar={(props) => (
        <KangurTabBar {...props} onCreatePress={openCreateList} />
      )}
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown,
        headerStyle: {
          backgroundColor: theme.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          ...typography.headline,
          color: theme.text,
        },
      }}
    >
      {/* Order: Home | Lists | [FAB] | Archive | Profile */}
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home") }}
      />
      <Tabs.Screen
        name="workspace"
        options={{ title: t("tabs.lists") }}
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
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (me.isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
          padding: spacing[6],
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
      </View>
    );
  }

  if (me.isError) {
    const code =
      me.error instanceof ApiClientError ? me.error.code : "UNKNOWN";
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: theme.bg,
          padding: spacing[6],
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
      </View>
    );
  }

  return (
    <CreateListProvider>
      <TabsWithBar />
    </CreateListProvider>
  );
}
