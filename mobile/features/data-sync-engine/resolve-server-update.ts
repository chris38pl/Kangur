import type { ShoppingItem } from "../shopping-item/schemas";

/**
 * Conflict resolution: server wins only when strictly newer than cache.
 * Equal timestamps keep the local (optimistic) row.
 */
export function resolveServerUpdate(
  cache: ShoppingItem | undefined,
  server: ShoppingItem,
): ShoppingItem {
  const serverTs = Date.parse(server.updatedAt);
  const cacheTs = cache ? Date.parse(cache.updatedAt) : NaN;
  if (!Number.isFinite(serverTs)) return cache ?? server;
  if (!cache || !Number.isFinite(cacheTs) || serverTs > cacheTs) {
    return { ...cache, ...server };
  }
  return cache;
}
