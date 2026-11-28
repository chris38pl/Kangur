import type { Prisma, PrismaClient } from "@prisma/client";

import { clerkDirectory, type ClerkDirectory } from "@/lib/auth/clerkDirectory";
import { notFound, validationError } from "@/lib/auth/errors";
import {
  resolveAuthProvider,
  type AuthProvider,
} from "@/lib/auth/resolveAuthProvider";
import { hashInviteToken, isValidInviteRawToken } from "@/lib/invite/token";

import {
  invitationGoneError,
  ownsInvitedAddress,
  type InvitationVia,
} from "./invitationAccess";

/** Everything invitation logic asks outside the database, replaceable in tests. */
export type InvitationDeps = {
  directory: ClerkDirectory;
  authProvider: (clerkId: string) => Promise<AuthProvider>;
  now: () => Date;
};

export const defaultInvitationDeps: InvitationDeps = {
  directory: clerkDirectory,
  authProvider: resolveAuthProvider,
  now: () => new Date(),
};

export type InvitationCapability = {
  rawToken?: string;
  invitationId?: string;
};

type Db = PrismaClient | Prisma.TransactionClient;

/** The secret from the link, or the id from a notification. Exactly one. */
export function capabilityOf(input: InvitationCapability): {
  via: InvitationVia;
  where: Prisma.InvitationWhereUniqueInput;
} {
  const token = input.rawToken?.trim();
  const id = input.invitationId?.trim();
  if (token) {
    if (!isValidInviteRawToken(token)) throw invitationGoneError("expired");
    return { via: "token", where: { tokenHash: hashInviteToken(token) } };
  }
  if (id) return { via: "invitationId", where: { id } };
  throw validationError("Provide exactly one of token or invitationId.");
}

export async function findInvitation<T extends Prisma.InvitationInclude>(
  db: Db,
  where: Prisma.InvitationWhereUniqueInput,
  include: T,
) {
  const invitation = await db.invitation.findUnique({ where, include });
  if (!invitation) throw notFound("Invitation expired.", { reason: "expired" });
  return invitation as Prisma.InvitationGetPayload<{ include: T }>;
}

/**
 * The invitation opened by id belongs to this account: its address is the account's Kangur
 * address, or one of the addresses verified in Clerk.
 */
export async function accountOwnsAddress(
  invitedEmail: string | null,
  account: { email: string; clerkId: string },
  deps: InvitationDeps,
): Promise<boolean> {
  if (ownsInvitedAddress(invitedEmail, [account.email])) return true;
  if (!invitedEmail) return false;
  try {
    return ownsInvitedAddress(invitedEmail, await deps.directory.verifiedEmails(account.clerkId));
  } catch (error) {
    console.warn("[invite]", "VerifiedEmailsUnavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
