import type { ItemStatus, ShoppingItem } from "@/features/shopping-item/schemas";

/** UI buckets - map Prisma ItemStatus. */
export type ShoppingBucket = "ACTIVE" | "PURCHASED" | "UNAVAILABLE";

export function statusToBucket(status: ItemStatus): ShoppingBucket | null {
  if (status === "pending") return "ACTIVE";
  if (status === "bought") return "PURCHASED";
  if (status === "unavailable") return "UNAVAILABLE";
  return null;
}

export function bucketToStatus(bucket: Exclude<ShoppingBucket, "ACTIVE">): ItemStatus {
  return bucket === "PURCHASED" ? "bought" : "unavailable";
}

export function isActiveItem(item: ShoppingItem): boolean {
  return item.status === "pending";
}
