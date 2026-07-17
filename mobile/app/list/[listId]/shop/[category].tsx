import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ShoppingCategoryScreen } from "@/features/shopping-list/shopping-mode/category-screen";

export default function ShopCategoryRoute() {
  const { t } = useTranslation();
  const { listId, category } = useLocalSearchParams<{
    listId: string;
    category: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ title: t("shoppingMode.categoryTitle"), gestureEnabled: false }} />
      {typeof listId === "string" && typeof category === "string" ? (
        <ShoppingCategoryScreen listId={listId} category={category} />
      ) : null}
    </>
  );
}
