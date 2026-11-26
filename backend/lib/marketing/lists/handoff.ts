import { isRecord } from "@/lib/marketing/lists/stored";

/**
 * A list goes from a computer to a phone inside the end of an address, after "#". Browsers
 * keep that part to themselves, so no server ever sees it. What comes out is as untrusted as
 * anything found in the browser: the tools read it with the same functions as their own notes.
 */
const MARK = "#k=";
/** The longest address that still makes a code a phone reads (version 22, see qr/encode.ts). */
export const QR_LIMIT = 1003;
/** Far more than fits a code. Somebody has to have written it by hand. */
const LONGEST = 6000;

const isEmpty = (value: unknown) =>
  typeof value === "object" && value !== null && Object.keys(value).length === 0;

/**
 * Takes a list out of the address before Next.js starts. Otherwise the router keeps the long
 * address, puts it back on the next link to the same page, and a reload applies the list from
 * the computer again over the changes made on the phone.
 */
export const TAKE_LIST_EARLY = `(function(){var h=location.hash;if(h.slice(0,3)==="#k="){window.__kangurList=h;history.replaceState(history.state,"",location.pathname+location.search)}})()`;

/** Empty parts stay behind: the shorter the code, the easier it is to scan. */
export function packList(list: Record<string, unknown>): string {
  const parts = Object.fromEntries(Object.entries(list).filter(([, value]) => !isEmpty(value)));
  let binary = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(parts))) binary += String.fromCharCode(byte);
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
