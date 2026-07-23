import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
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
import { bootLog } from "@/lib/boot-diagnostics";
import { perfEnd, perfStart } from "@/lib/performance";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/design-system/shopping-density";
import { RootBackToast, useRootBackHandler } from "@/lib/navigation";
import { useQueryClient } from "@tanstack/react-query";

function TabsWithBar() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const { t } = useTranslation();
  const { openCreateList } = useCreateList();
  useRootBackHandler(true);

  useEffect(() => {
    bootLog("first_screen", "TabsWithBar (tab navigator) mounted");
  }, []);

  return (
    <View style={{ flex: 1 }}>
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
      <RootBackToast />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const { t } = useTranslation();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { notifyBootReady } = useAppStartup();
  const queryClient = useQueryClient();

  useEffect(() => {
    bootLog(
      "tabs_layout",
      `TabLayout mount isLoaded=${String(isLoaded)} isSignedIn=${String(isSignedIn)}`,
    );
  }, [isLoaded, isSignedIn]);

  const me = useMe(Boolean(isSignedIn));
  // Parallel with /me — do not wait for me.data before workspaces (eliminates boot waterfall).
  const workspacesQuery = useWorkspaces(Boolean(isSignedIn));
  const { activeWorkspace, hydrated, storedId } = useActiveWorkspace(
    workspacesQuery.data,
  );
  const listsWorkspaceId = activeWorkspace?.id ?? storedId ?? null;
  const listsQuery = useShoppingLists(
    listsWorkspaceId,
    Boolean(isSignedIn) && (hydrated || Boolean(storedId)),
  );

  const bootPerfEndedRef = useRef(false);
  const bootHadPersistedCacheRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;
    const listsId =
      (queryClient.getQueryData<string | null>(["active-workspace-id"]) as
        | string
        | null) ?? null;
    bootHadPersistedCacheRef.current =
      queryClient.getQueryData(["me"]) != null ||
      queryClient.getQueryData(["workspaces"]) != null ||
      (listsId != null &&
        queryClient.getQueryData(["shopping-lists", listsId]) != null);
    perfStart("boot.cold", { id: "app-boot" });
  }, [isSignedIn, isLoaded, queryClient]);

  // Keep full HomeSkeleton until Home data is ready - avoids skeleton → tab bar → spinner.
  const homeBootPending =
    (workspacesQuery.isPending && !workspacesQuery.data) ||
    !hydrated ||
    (Boolean(listsWorkspaceId) &&
      listsQuery.isPending &&
      !listsQuery.data);

  const homeReady =
    isLoaded &&
    isSignedIn &&
    !(me.isPending && !me.data) &&
    !me.isError &&
    !homeBootPending;

  useEffect(() => {
    if (homeReady || me.isError) {
      notifyBootReady();
    }
  }, [homeReady, me.isError, notifyBootReady]);

  useEffect(() => {
    if (!homeReady || bootPerfEndedRef.current) return;
    bootPerfEndedRef.current = true;
    const as = bootHadPersistedCacheRef.current ? "boot.warm" : "boot.cold";
    perfEnd("boot.cold", {
      id: "app-boot",
      as,
      labels: {
        listsCached: Boolean(listsQuery.data),
        meCached: Boolean(me.data),
      },
    });
  }, [homeReady, listsQuery.data, me.data]);

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
