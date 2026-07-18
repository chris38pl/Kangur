import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email/normalizeEmail";

export type UpsertUserInput = {
  clerkId: string;
  email: string;
  deviceLocale: "pl" | "en" | null;
};

export async function upsertUser({
  clerkId,
  email,
  deviceLocale,
}: UpsertUserInput) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { clerkId } });

  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email: normalizedEmail,
      locale: existing?.locale ?? deviceLocale,
    },
    update: {
      email: normalizedEmail,
      ...(existing?.locale == null && deviceLocale
        ? { locale: deviceLocale }
        : {}),
      updatedAt: new Date(),
    },
  });
}
