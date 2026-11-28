import type { AppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { isPlatformAdminEmail } from "@/lib/platform/isPlatformAdminEmail";
import { Analytics } from "@/lib/analytics";
import { nameFromProvider } from "@/lib/names/displayName";

export type UpsertUserInput = {
  clerkId: string;
  email: string;
  /** Only promote PLATFORM_ADMIN_EMAILS when Clerk primary email is verified. */
  emailVerified: boolean;
  deviceLocale: AppLocale | null;
  /**
   * The name Clerk holds, read at the first sign-in (Apple gives it only then). Omitted on
   * the hot path, where Clerk is not asked.
   */
  providerName?: { firstName: string | null; lastName: string | null };
};

/**
 * Upsert Clerk identity into User.
 * One-way Platform Admin bootstrap: if email is on PLATFORM_ADMIN_EMAILS,
 * email is verified, and role is not already ADMIN, promote to ADMIN.
 * Never auto-demotes.
 * The Clerk name is copied once (displayNameSource null → provider) and never replaces a
 * name typed in Kangur.
 */
export async function upsertUser({
  clerkId,
  email,
  emailVerified,
  deviceLocale,
  providerName,
}: UpsertUserInput) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  const isNew = !existing;
  const allowPromote =
    emailVerified && isPlatformAdminEmail(normalizedEmail);
  const shouldPromote =
    existing?.platformRole !== "ADMIN" && allowPromote;

  const name =
    providerName && !existing?.displayNameSource
      ? nameFromProvider(providerName.firstName, providerName.lastName)
      : null;
  const nameFields = name
    ? {
        displayName: name.displayName,
        displayNameSource: "provider" as const,
        lastNameInitial: name.lastNameInitial,
      }
    : {};

  const user = await prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email: normalizedEmail,
      locale: deviceLocale,
      ...nameFields,
      ...(allowPromote ? { platformRole: "ADMIN" as const } : {}),
    },
    update: {
      email: normalizedEmail,
      // Seed locale only when missing — never overwrite an explicit preference
      // with X-Device-Locale from the current app boot (web often starts as "en").
      ...(deviceLocale && !existing?.locale ? { locale: deviceLocale } : {}),
      ...nameFields,
      ...(shouldPromote ? { platformRole: "ADMIN" as const } : {}),
      updatedAt: new Date(),
    },
  });

  if (isNew) {
    Analytics.track("account_created", {}, user.id);
  }

  return user;
}
