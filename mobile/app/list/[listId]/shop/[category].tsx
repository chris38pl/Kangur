import { Stack, useLocalSearchParams } from "expo-router";

import { ShoppingCategoryScreen } from "@/features/shopping-list/shopping-mode/category-screen";

export default function ShopCategoryRoute() {
  const { listId, category } = useLocalSearchParams<{
    listId: string;
    category: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {typeof listId === "string" && typeof category === "string" ? (
        <ShoppingCategoryScreen listId={listId} category={category} />
      ) : null}
    </>
  );
}
