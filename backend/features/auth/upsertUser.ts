import type { AppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { isPlatformAdminEmail } from "@/lib/platform/isPlatformAdminEmail";
import { Analytics } from "@/lib/analytics";

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
  const isNew = !existing;
  const shouldPromote =
    existing?.platformRole !== "ADMIN" &&
    isPlatformAdminEmail(normalizedEmail);

  const user = await prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email: normalizedEmail,
      locale: deviceLocale,
      ...(isPlatformAdminEmail(normalizedEmail)
        ? { platformRole: "ADMIN" as const }
        : {}),
    },
    update: {
      email: normalizedEmail,
      // Seed locale only when missing — never overwrite an explicit preference
      // with X-Device-Locale from the current app boot (web often starts as "en").
      ...(deviceLocale && !existing?.locale ? { locale: deviceLocale } : {}),
      ...(shouldPromote ? { platformRole: "ADMIN" as const } : {}),
      updatedAt: new Date(),
    },
  });

  if (isNew) {
    Analytics.track("account_created", {}, user.id);
  }

  return user;
}
