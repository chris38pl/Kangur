import { isRecord } from "@/lib/marketing/lists/stored";

/**
 * A list goes from a computer to a phone inside the end of an address, after "#". Browsers
 * keep that part to themselves, so no server ever sees it. What comes out is as untrusted as
 * anything found in the browser: the tools read it with the same functions as their own notes.
 */
const MARK = "#k=";
/** Far more than fits a code. Somebody has to have written it by hand. */
const LONGEST = 6000;

export function packList(list: Record<string, unknown>): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(list))) binary += String.fromCharCode(byte);
  return MARK + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function unpackList(hash: string): Record<string, unknown> | null {
  if (!hash.startsWith(MARK) || hash.length > LONGEST) return null;
  try {
    const binary = atob(hash.slice(MARK.length).replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const list: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isRecord(list) ? list : null;
  } catch {
    return null;
  }
}

/** Ticks as places on the list. Both sides build the same list, and numbers are short. */
export const packTicks = (ids: readonly string[], done: ReadonlySet<string>): number[] =>
  ids.flatMap((id, place) => (done.has(id) ? [place] : []));

export const unpackTicks = (places: unknown, ids: readonly string[]): string[] =>
  Array.isArray(places) ? ids.filter((_, place) => places.includes(place)) : [];
