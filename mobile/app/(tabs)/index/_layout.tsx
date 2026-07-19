import { Stack } from "expo-router";

/**
 * Home tab stack — keeps Bottom Tabs visible while pushing Menu (and future home-level screens).
 */
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="menu" />
    </Stack>
  );
}
