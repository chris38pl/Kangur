import { isValidInviteRawToken } from "./token";

/** The invitation page of the site: `/invite`, or `/en/invite` and the other languages. */
const INVITE_PAGE = /^\/(?:[a-z]{2}\/)?invite\/?$/;

/**
 * The token of a site invitation link, https://www.getkangur.com/invite#t=<token>. With
 * Universal Links and App Links the phone hands such a link to the app instead of the
 * browser. The token rides after "#" (it never reaches a server), and routes ignore that
 * part, so it has to be read here. Accepts the full URL or the path with its hash.
 */
export function inviteTokenFromUrl(url: string): string | null {
  const hashAt = url.indexOf("#");
  if (hashAt < 0) return null;
  const hash = url.slice(hashAt + 1);
  const beforeHash = url.slice(0, hashAt).split("?")[0] ?? "";
  const path = beforeHash.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "") || "/";
  if (!INVITE_PAGE.test(path)) return null;
  const token = /^t=([^&]+)$/.exec(hash)?.[1] ?? "";
  return isValidInviteRawToken(token) ? token : null;
}
