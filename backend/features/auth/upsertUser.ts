import type { AppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { isPlatformAdminEmail } from "@/lib/platform/isPlatformAdminEmail";

export type UpsertUserInput = {
  clerkId: string;
  email: string;
  deviceLocale: AppLocale | null;
};

/**
 * Upsert Clerk identity into User.
 * One-way Platform Admin bootstrap: if email is on PLATFORM_ADMIN_EMAILS
 * and role is not already ADMIN, promote to ADMIN. Never auto-demotes.
 */
export async function upsertUser({
  clerkId,
  email,
  deviceLocale,
}: UpsertUserInput) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  const shouldPromote =
    existing?.platformRole !== "ADMIN" &&
    isPlatformAdminEmail(normalizedEmail);

  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email: normalizedEmail,
      locale: existing?.locale ?? deviceLocale,
      ...(isPlatformAdminEmail(normalizedEmail)
        ? { platformRole: "ADMIN" as const }
        : {}),
    },
    update: {
      email: normalizedEmail,
      ...(deviceLocale ? { locale: deviceLocale } : {}),
      ...(shouldPromote ? { platformRole: "ADMIN" as const } : {}),
      updatedAt: new Date(),
    },
  });
}
