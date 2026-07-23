import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

import { bootLog } from "@/lib/boot-diagnostics";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    bootLog(
      "first_screen",
      `auth/_layout isLoaded=${String(isLoaded)} isSignedIn=${String(isSignedIn)}`,
    );
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={"/(tabs)" as never} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
