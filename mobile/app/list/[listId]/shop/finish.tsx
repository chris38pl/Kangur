import { Stack, useLocalSearchParams } from "expo-router";

import { FinishSummaryScreen } from "@/features/shopping-list/shopping-mode/finish-summary-screen";

export default function ShopFinishRoute() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {typeof listId === "string" ? (
        <FinishSummaryScreen listId={listId} />
      ) : null}
    </>
  );
}
