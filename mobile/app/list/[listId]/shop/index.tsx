import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ShoppingModeScreen } from "@/features/shopping-list/shopping-mode/shopping-mode-screen";

export default function ShopHomeRoute() {
  const { t } = useTranslation();
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return (
    <>
      <Stack.Screen options={{ title: t("shoppingMode.title"), gestureEnabled: false }} />
      {typeof listId === "string" ? <ShoppingModeScreen listId={listId} /> : null}
    </>
  );
}
