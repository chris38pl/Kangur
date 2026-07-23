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
import { type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppResultProvider } from "@/components/AppResultProvider";
import { colors } from "@/design-system/tokens";
import { AppUpdateGate } from "@/features/app-update/AppUpdateGate";
import { useDataSyncEngineBootstrap } from "@/features/data-sync-engine/useBootstrap";
import { NotificationSyncTrigger } from "@/features/notifications/NotificationSyncTrigger";
import { usePushRegistration } from "@/features/notifications/usePushRegistration";
import { AppStartupController } from "@/features/startup/AppStartupController";
import { AppQueryProvider } from "@/lib/query/client";
import { SentryErrorBoundary } from "@/lib/sentry/ErrorBoundary";
import { initSentry } from "@/lib/sentry/init";
import { suppressClerkDevKeysWarning } from "@/lib/suppress-clerk-dev-warning";

import "../global.css";
import "@/lib/i18n";

suppressClerkDevKeysWarning();
initSentry();

export { SentryErrorBoundary as ErrorBoundary };

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

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
  const { isSignedIn } = useAuth();
  useDataSyncEngineBootstrap();
  usePushRegistration(Boolean(isSignedIn));
  return (
    <>
      <NotificationSyncTrigger enabled={Boolean(isSignedIn)} />
      {children}
    </>
  );
}

export default function RootLayout() {
  if (!publishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <AppQueryProvider>
            <ThemeProvider value={lightTheme}>
              <AppResultProvider>
                <ClerkEffects>
                  <AppStartupController>
                    <AppUpdateGate>
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
                          name="workspace-browser"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="invite/[token]"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="invite/id/[invitationId]"
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
                    </AppUpdateGate>
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
