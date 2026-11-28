import { hashInviteToken, isValidInviteRawToken } from "@/lib/invite/token";
import { isPrivateRelayEmail } from "@/lib/names/displayName";
import { prisma } from "@/lib/prisma";

/**
 * The address an e-mail invitation went to, so the sign-in form on the invitation path can
 * have it filled in. Before sign-in, so it answers only to the secret token, which came in
 * that very e-mail. Nothing for a link, an invitation that no longer works, or an Apple
 * relay address.
 */
export async function peekInvitation(
  rawToken: string,
  now: Date = new Date(),
): Promise<{ invitedEmail: string | null }> {
  const token = rawToken.trim();
  if (!isValidInviteRawToken(token)) return { invitedEmail: null };

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    select: { kind: true, email: true, status: true, expiresAt: true },
  });
  if (
    !invitation ||
    invitation.kind !== "email" ||
    !invitation.email ||
    invitation.status !== "pending" ||
    invitation.expiresAt < now ||
    isPrivateRelayEmail(invitation.email)
  ) {
    return { invitedEmail: null };
  }
  return { invitedEmail: invitation.email };
}
