import { createHash, randomBytes } from "node:crypto";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateInviteRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function inviteExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_MS);
}
