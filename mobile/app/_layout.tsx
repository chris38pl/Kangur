import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import {
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppResultProvider } from "@/components/AppResultProvider";
import { colors } from "@/design-system/tokens";
import { useDataSyncEngineBootstrap } from "@/features/data-sync-engine/useBootstrap";
import { usePushRegistration } from "@/features/notifications/usePushRegistration";
import { AppStartupController } from "@/features/startup/AppStartupController";
import {
  bootLog,
  checkRequiredPublicEnv,
  hideNativeSplashLogged,
} from "@/lib/boot-diagnostics";
import { getPostHog, isAnalyticsEnabled } from "@/lib/analytics/posthog";
import { AppQueryProvider } from "@/lib/query/client";
import { SentryErrorBoundary } from "@/lib/sentry/ErrorBoundary";
import { initSentry } from "@/lib/sentry/init";
import { suppressClerkDevKeysWarning } from "@/lib/suppress-clerk-dev-warning";

import "../global.css";
import "@/lib/i18n";

bootLog("root_layout_module", "app/_layout.tsx evaluating");

suppressClerkDevKeysWarning();
initSentry();
bootLog("root_layout_module", "initSentry done");

export { SentryErrorBoundary as ErrorBoundary };

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync().catch((e: unknown) => {
  bootLog(
    "splash_native_hide",
    `preventAutoHideAsync failed: ${e instanceof Error ? e.message : String(e)}`,
  );
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.light.primary,
    background: colors.light.bg,
    card: colors.light.surface,
    text: colors.light.text,
    border: colors.light.border,
    notification: colors.light.primary,
  },
};

/**
 * Side-effects that need Clerk context. Must stay nested under ClerkProvider
 * and must not replace the navigator (Expo Router needs Stack/Slot always mounted).
 * Native splash hide is owned by AppStartupController (brand handoff).
 */
function ClerkEffects({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  useEffect(() => {
    bootLog(
      "clerk_provider",
      `useAuth isLoaded=${String(isLoaded)} isSignedIn=${String(isSignedIn)}`,
    );
  }, [isLoaded, isSignedIn]);
  useDataSyncEngineBootstrap();
  usePushRegistration(Boolean(isSignedIn));
  return <>{children}</>;
}

function PostHogBootProbe() {
  useEffect(() => {
    const enabled = isAnalyticsEnabled();
    bootLog("posthog", `isAnalyticsEnabled=${String(enabled)}`);
    if (enabled) {
      const client = getPostHog();
      bootLog("posthog", `getPostHog client=${client ? "ok" : "null"}`);
    }
  }, []);
  return null;
}

function NavigationBootProbe() {
  useEffect(() => {
    bootLog("navigation_stack", "Stack mounted (ThemeProvider+Stack tree)");
  }, []);
  return null;
}

export default function RootLayout() {
  bootLog("root_layout_render", "RootLayout render()");
  const env = checkRequiredPublicEnv();

  if (!publishableKey) {
    void hideNativeSplashLogged("missing_clerk_key");
    throw new Error(
      `Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (env missing: ${env.missing.join(",") || "none listed"})`,
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <AppQueryProvider>
            <ThemeProvider value={lightTheme}>
              <AppResultProvider>
                <ClerkEffects>
                  <PostHogBootProbe />
                  <AppStartupController>
                    <NavigationBootProbe />
                    <Stack>
                      <Stack.Screen name="index" options={{ headerShown: false }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="account" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="change-password"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="notifications"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="notification-center"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen name="about" options={{ headerShown: false }} />
                      <Stack.Screen name="help" options={{ headerShown: false }} />
                      <Stack.Screen name="privacy" options={{ headerShown: false }} />
                      <Stack.Screen name="language" options={{ headerShown: false }} />
                      <Stack.Screen name="premium" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="platform-console"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="invite/[token]"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="notification/shopping-started"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="notification/shopping-finished"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="notification/list-created"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen name="list/[listId]" />
                    </Stack>
                  </AppStartupController>
                </ClerkEffects>
              </AppResultProvider>
            </ThemeProvider>
          </AppQueryProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
