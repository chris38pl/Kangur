import { DataSyncEngine } from "@/features/data-sync-engine";

/**
 * @deprecated Prefer DataSyncEngine.requestItemsRefresh — kept as a thin facade
 * for callers that still pass a QueryClient (ignored; adapter owns invalidate).
 */
export function scheduleItemsRefresh(
  _queryClient: unknown,
  listId: string,
): void {
  DataSyncEngine.requestItemsRefresh(listId);
}

export function cancelItemsRefresh(): void {
  DataSyncEngine.cancelItemsRefresh();
}
