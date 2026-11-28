import { isValidInviteRawToken } from "./token";

/**
 * The invitation someone was opening when the app sent them to sign in. After sign-in the
 * auth layout leads back to it instead of Home, through sign-up, a forgotten password or
 * Google / Apple. Kept in memory: the app stays open while they sign in. It is forgotten
 * when they go back to the welcome screen (app/(auth)/index.tsx), once they are back on
 * the invitation, and after half an hour, so a later ordinary sign-in leads Home.
 */
export const PENDING_INVITE_MAX_AGE_MS = 30 * 60 * 1000;

let pending: { path: string; at: number } | null = null;

const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** `/invite/<token>` or `/invite/id/<invitationId>`; anything else is not a way back. */
export function isInviteReturnPath(path: string): boolean {
  const byToken = /^\/invite\/([^/?#]+)$/.exec(path);
  if (byToken) return isValidInviteRawToken(byToken[1] ?? "");
  const byId = /^\/invite\/id\/([^/?#]+)$/.exec(path);
  return Boolean(byId && ID.test(byId[1] ?? ""));
}

export function rememberInviteForSignIn(path: string, now: number = Date.now()): void {
  pending = isInviteReturnPath(path) ? { path, at: now } : null;
}

/** Read while rendering, so it never changes anything: an old one simply reads as none. */
export function pendingInvitePath(now: number = Date.now()): string | null {
  if (!pending || now - pending.at > PENDING_INVITE_MAX_AGE_MS) return null;
  return pending.path;
}

/** The secret of an invitation link waiting for sign-in, for filling in its address. */
export function pendingInviteToken(now: number = Date.now()): string | null {
  const path = pendingInvitePath(now);
  const match = path ? /^\/invite\/([^/?#]+)$/.exec(path) : null;
  const token = match?.[1] ?? "";
  return isValidInviteRawToken(token) ? token : null;
}

export function clearPendingInvite(): void {
  pending = null;
}
