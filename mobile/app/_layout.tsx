import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import {
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "@/design-system/tokens";
import { useDataSyncEngineBootstrap } from "@/features/data-sync-engine/useBootstrap";
import { usePushRegistration } from "@/features/notifications/usePushRegistration";
import { AppQueryProvider } from "@/lib/query/client";
import { suppressClerkDevKeysWarning } from "@/lib/suppress-clerk-dev-warning";

import "../global.css";
import "@/lib/i18n";

suppressClerkDevKeysWarning();

export { ErrorBoundary } from "expo-router";

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

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  useDataSyncEngineBootstrap();
  usePushRegistration(Boolean(isSignedIn));

  useEffect(() => {
    if (isLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.light.bg,
        }}
      >
        <ActivityIndicator color={colors.light.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  if (!publishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <AppQueryProvider>
              <ThemeProvider value={lightTheme}>
                <AuthGate>
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
                    <Stack.Screen name="privacy" options={{ headerShown: false }} />
                    <Stack.Screen name="language" options={{ headerShown: false }} />
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
                </AuthGate>
              </ThemeProvider>
            </AppQueryProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
