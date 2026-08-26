import AsyncStorage from "@react-native-async-storage/async-storage";

export type ShoppingBrowseMode = "aisles" | "list";

const DEFAULT_MODE: ShoppingBrowseMode = "aisles";

function keyFor(userId: string) {
  return `kangur.shoppingBrowseMode.${userId}`;
}

function isShoppingBrowseMode(value: string): value is ShoppingBrowseMode {
  return value === "aisles" || value === "list";
}

export async function readShoppingBrowseMode(
  userId: string,
): Promise<ShoppingBrowseMode> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (raw && isShoppingBrowseMode(raw)) return raw;
  } catch {
    // Best-effort — fall back to aisles.
  }
  return DEFAULT_MODE;
}

export async function writeShoppingBrowseMode(
  userId: string,
  mode: ShoppingBrowseMode,
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), mode);
  } catch {
    // Best-effort — in-memory mode still updates.
  }
}
