import type { AppLocale } from "@/lib/marketing/locale";
import { routeHref } from "@/lib/marketing/routes";
import { absoluteUrl } from "@/lib/marketing/site";

/**
 * An invitation goes from the e-mail to the app through a page of this site. The token rides
 * after "#": browsers keep that part to themselves, so it never reaches a server, a log, a
 * proxy or a Referer. The page takes it out of the address before any other script starts.
 */
const MARK = "#t=";

/** Same as INVITE_RAW_TOKEN_RE in lib/invite/token.ts, which needs node:crypto. */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The token survives a reload in this tab, for instance after a trip to the store. */
export const INVITE_STORAGE_KEY = "kangur_invite";

/**
 * The app's own link. E-mails sent before this page carried it, and the app opens
 * /invite/<token> from it, so it stays as it is.
 */
export const APP_INVITE_BASE = "kangur://invite";

export const isInviteToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN.test(value);

export const inviteHash = (token: string): string => `${MARK}${token}`;

/** The address in the e-mail: the page in the e-mail's language, with the token after "#". */
export function invitePageUrl(locale: AppLocale, token: string): string {
  return absoluteUrl(routeHref("invite", locale)) + inviteHash(token);
}

export function readInviteHash(hash: string): string | null {
  if (!hash.startsWith(MARK)) return null;
  const token = hash.slice(MARK.length);
  return isInviteToken(token) ? token : null;
}

/**
 * Where the page's button leads: `kangur://invite`, or `kangur-dev://invite` for the
 * development build. Anything else, an https address included, is not an app and gets the
 * store app's link.
 */
export function appInviteBase(raw: string | undefined): string {
  const value = raw?.trim().replace(/\/+$/, "");
  return value && /^kangur(-[a-z]+)?:\/\/invite$/.test(value) ? value : APP_INVITE_BASE;
}

export const appInviteLink = (base: string, token: string): string => `${base}/${token}`;

/**
 * Runs before Next.js reads the address, on the invitation page only. Otherwise the router
 * keeps the token and puts it back into the address, where anything that records URLs sees
 * it. `__kangurInvite` covers a browser that refuses sessionStorage.
 */
export const TAKE_INVITE_EARLY = String.raw`(function(){var h=location.hash;if(!/\/invite\/?$/.test(location.pathname)||!/^#t=[A-Za-z0-9_-]{43}$/.test(h))return;var t=h.slice(3);window.__kangurInvite=t;try{sessionStorage.setItem("${INVITE_STORAGE_KEY}",t)}catch(e){}history.replaceState(history.state,"",location.pathname+location.search)})()`;
