import { createClerkClient, type User as ClerkUser } from "@clerk/backend";

import { normalizeEmail } from "@/lib/email/normalizeEmail";

/**
 * What Kangur asks Clerk about people, behind one seam so invitation logic can be tested
 * without Clerk. Only on rare paths: the first sign-in, an invitation opened from a
 * notification, an invitation sent by e-mail. Never on the hot path of every request.
 */
export type ClerkDirectory = {
  /** Every verified address of one Clerk user, lowercased. */
  verifiedEmails(clerkId: string): Promise<string[]>;
  /** Clerk users who have this address verified (main or extra address). */
  usersWithVerifiedEmail(email: string): Promise<string[]>;
};

export function verifiedAddressesOf(user: Pick<ClerkUser, "emailAddresses">): string[] {
  return (user.emailAddresses ?? [])
    .filter((address) => address.verification?.status === "verified")
    .map((address) => normalizeEmail(address.emailAddress))
    .filter(Boolean);
}

function clerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured");
  return createClerkClient({ secretKey });
}

export const clerkDirectory: ClerkDirectory = {
  async verifiedEmails(clerkId) {
    const user = await clerkClient().users.getUser(clerkId);
    return verifiedAddressesOf(user);
  },

  async usersWithVerifiedEmail(email) {
    const wanted = normalizeEmail(email);
    if (!wanted) return [];
    const { data } = await clerkClient().users.getUserList({
      emailAddress: [wanted],
      limit: 10,
    });
    return data
      .filter((user) => verifiedAddressesOf(user).includes(wanted))
      .map((user) => user.id);
  },
};
