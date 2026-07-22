import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { HomeSkeleton } from "@/components/skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { KangurTabBar } from "@/components/tab-bar/kangur-tab-bar";
import { colors, spacing, typography } from "@/design-system/tokens";
import { useMe } from "@/features/auth/useMe";
import { CreateListProvider, useCreateList } from "@/features/shopping-list/create-list-provider";
import { useShoppingLists } from "@/features/shopping-list/useShoppingLists";
import { useAppStartup } from "@/features/startup/AppStartupController";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { ApiClientError } from "@/lib/api/client";
import { Analytics } from "@/lib/analytics";
import { getAppBuildInfo } from "@/lib/app-build-info";
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
      {/* Order: Home | Spaces | [FAB] | Lists | Profile */}
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
        options={{ title: t("tabs.history") }}
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
  const { notifyBootReady } = useAppStartup();
  const me = useMe(Boolean(isSignedIn));
  const workspacesQuery = useWorkspaces(Boolean(isSignedIn) && Boolean(me.data));
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const listsQuery = useShoppingLists(
    activeWorkspace?.id ?? null,
    Boolean(isSignedIn) && hydrated,
  );

  // Keep full HomeSkeleton until Home data is ready - avoids skeleton → tab bar → spinner.
  const homeBootPending =
    workspacesQuery.isPending ||
    !hydrated ||
    (Boolean(activeWorkspace?.id) && listsQuery.isPending);

  const homeReady =
    isLoaded &&
    isSignedIn &&
    !me.isPending &&
    !me.isError &&
    !homeBootPending;

  useEffect(() => {
    if (homeReady || me.isError) {
      notifyBootReady();
    }
  }, [homeReady, me.isError, notifyBootReady]);

  useEffect(() => {
    if (!homeReady || !me.data || !activeWorkspace) return;
    const build = getAppBuildInfo();
    Analytics.identify(me.data.id, {
      appVersion: build.version,
      build: build.build,
      environment:
        build.environment === "preview" ? "staging" : build.environment,
      platform: "mobile",
      language: me.data.locale ?? undefined,
      workspaceRole: activeWorkspace.role,
      subscriptionPlan: activeWorkspace.plan === "premium" ? "premium" : "free",
    });
    Analytics.groupWorkspace(activeWorkspace.id, {
      workspacePlan: activeWorkspace.plan === "premium" ? "premium" : "free",
      memberCount: activeWorkspace.memberCount,
    });
    void import("@/lib/sentry/init").then(
      ({ setSentryUser, setSentryWorkspace }) => {
        setSentryUser(me.data.id);
        setSentryWorkspace(activeWorkspace.id);
      },
    );
  }, [homeReady, me.data, activeWorkspace]);

  if (!isLoaded) {
    return <HomeSkeleton />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (me.isPending) {
    return <HomeSkeleton />;
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

  if (homeBootPending) {
    return <HomeSkeleton />;
  }

  return (
    <CreateListProvider>
      <TabsWithBar />
    </CreateListProvider>
  );
}
