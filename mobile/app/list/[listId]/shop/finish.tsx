import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { FinishSummaryScreen } from "@/features/shopping-list/shopping-mode/finish-summary-screen";

export default function ShopFinishRoute() {
  const { t } = useTranslation();
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return (
    <>
      <Stack.Screen options={{ title: t("shoppingMode.finishTitle") }} />
      {typeof listId === "string" ? <FinishSummaryScreen listId={listId} /> : null}
    </>
  );
}
