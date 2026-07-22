import { Stack, useLocalSearchParams } from "expo-router";

import { MealProposalReviewScreen } from "@/features/ai/meal-proposal-review-screen";

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

export default function MealProposalReviewRoute() {
  const params = useLocalSearchParams<{ listId: string }>();
  const listId = paramString(params.listId);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {listId ? <MealProposalReviewScreen listId={listId} /> : null}
    </>
  );
}
