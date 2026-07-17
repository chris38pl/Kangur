/** Stable client-side id for shopping items (must be UUID — API validates clientId). */
export function createClientId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** API `clientId` must be UUID. Server item `id` is a cuid — do not use this for that. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Legacy optimistic ids from before UUID clientIds (`local_…`). */
export function isLegacyLocalItemId(value: string): boolean {
  return value.startsWith("local_");
}
