import { Stack, useLocalSearchParams } from "expo-router";

import { FinishSummaryScreen } from "@/features/shopping-list/shopping-mode/finish-summary-screen";

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}

export default function ShopFinishRoute() {
  const params = useLocalSearchParams<{
    listId: string;
    viewer?: string | string[];
    actor?: string | string[];
  }>();
  const listId = paramString(params.listId);
  const isViewer = paramString(params.viewer) === "1";
  const actorDisplayName = paramString(params.actor) || undefined;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {listId ? (
        <FinishSummaryScreen
          listId={listId}
          viewer={isViewer}
          actorDisplayName={actorDisplayName}
        />
      ) : null}
    </>
  );
}
