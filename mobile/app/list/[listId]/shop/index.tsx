import { Stack, useLocalSearchParams } from "expo-router";

import { ShoppingModeScreen } from "@/features/shopping-list/shopping-mode/shopping-mode-screen";

export default function ShopHomeRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {typeof listId === "string" ? (
        <ShoppingModeScreen listId={listId} />
      ) : null}
    </>
  );
}
