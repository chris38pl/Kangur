import { prisma } from "@/lib/prisma";

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
  const existing = await prisma.user.findUnique({ where: { clerkId } });

  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      locale: existing?.locale ?? deviceLocale,
    },
    update: {
      email,
      ...(existing?.locale == null && deviceLocale
        ? { locale: deviceLocale }
        : {}),
      updatedAt: new Date(),
    },
  });
}
