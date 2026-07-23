import { createHash, randomBytes } from "node:crypto";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 32 bytes → 43 chars base64url (A-Za-z0-9_-). */
const INVITE_RAW_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function generateInviteRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidInviteRawToken(rawToken: string): boolean {
  return INVITE_RAW_TOKEN_RE.test(rawToken);
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function inviteExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_MS);
}
