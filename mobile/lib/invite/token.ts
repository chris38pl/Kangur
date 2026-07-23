/** Must match backend/lib/invite/token.ts (32 bytes base64url). */
const INVITE_RAW_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function isValidInviteRawToken(rawToken: string): boolean {
  return INVITE_RAW_TOKEN_RE.test(rawToken);
}
