import { isValidInviteRawToken } from "./token";

/**
 * The invitation someone was opening when the app sent them to sign in. After sign-in the
 * auth layout leads back to it instead of Home, through sign-up, a forgotten password or
 * Google / Apple. Kept in memory: the app stays open while they sign in.
 */
let pendingPath: string | null = null;

const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** `/invite/<token>` or `/invite/id/<invitationId>`; anything else is not a way back. */
export function isInviteReturnPath(path: string): boolean {
  const byToken = /^\/invite\/([^/?#]+)$/.exec(path);
  if (byToken) return isValidInviteRawToken(byToken[1] ?? "");
  const byId = /^\/invite\/id\/([^/?#]+)$/.exec(path);
  return Boolean(byId && ID.test(byId[1] ?? ""));
}

export function rememberInviteForSignIn(path: string): void {
  pendingPath = isInviteReturnPath(path) ? path : null;
}

export function pendingInvitePath(): string | null {
  return pendingPath;
}

/** The secret of an invitation link waiting for sign-in, for filling in its address. */
export function pendingInviteToken(): string | null {
  const match = pendingPath ? /^\/invite\/([^/?#]+)$/.exec(pendingPath) : null;
  const token = match?.[1] ?? "";
  return isValidInviteRawToken(token) ? token : null;
}

export function clearPendingInvite(): void {
  pendingPath = null;
}
