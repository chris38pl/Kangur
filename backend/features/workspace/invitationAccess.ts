import type { InvitationStatus } from "@prisma/client";

import { forbidden, notFound, type ApiError } from "@/lib/auth/errors";
import type { AuthProvider } from "@/lib/auth/resolveAuthProvider";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { isPrivateRelayEmail } from "@/lib/names/displayName";

/**
 * An invitation is a one-time key. Whoever opens its secret link while signed in may join,
 * whatever address the account has: an account whose address Apple hides would never match
 * one. It works once, for 7 days, until revoked; the inviter sees who joined and can remove
 * them. Only an invitation opened from an in-app notification (by id, without the secret)
 * still has to belong to one of the account's verified addresses.
 */

/** How the invitation was opened: the secret from the link, or its id from a notification. */
export type InvitationVia = "token" | "invitationId";

/** `used`: someone already joined with this one-time link. */
export type InvitationGoneReason = "expired" | "revoked" | "used";

export type InvitationGate =
  | { kind: "open" }
  | { kind: "already_member" }
  | { kind: "gone"; reason: InvitationGoneReason };

export function invitationGate(input: {
  status: InvitationStatus;
  expiresAt: Date;
  isMember: boolean;
  now: Date;
}): InvitationGate {
  if (input.status === "revoked") return { kind: "gone", reason: "revoked" };
  if (input.status === "accepted") {
    // Not "you are already here" for someone else holding a used link.
    return input.isMember ? { kind: "already_member" } : { kind: "gone", reason: "used" };
  }
  if (input.expiresAt < input.now) return { kind: "gone", reason: "expired" };
  if (input.isMember) return { kind: "already_member" };
  return { kind: "open" };
}

export const needsAddressCheck = (via: InvitationVia): boolean => via === "invitationId";

export function ownsInvitedAddress(
  invitedEmail: string | null,
  accountEmails: readonly string[],
): boolean {
  if (!invitedEmail) return false;
  const wanted = normalizeEmail(invitedEmail);
  return accountEmails.some((email) => normalizeEmail(email) === wanted);
}

/** 404 with a reason the apps read: 1.0.8 shows "this link is no longer valid" for any 404. */
export function invitationGoneError(reason: InvitationGoneReason): ApiError {
  return notFound("Invitation expired.", { reason });
}

/** Never carries an Apple relay address: the person would see it on the screen. */
export function wrongAccountError(account: {
  email: string;
  provider: AuthProvider;
}): ApiError {
  return forbidden("Invitation belongs to a different email.", {
    reason: "email_mismatch",
    provider: account.provider,
    ...(isPrivateRelayEmail(account.email) ? {} : { currentEmail: account.email }),
  });
}
