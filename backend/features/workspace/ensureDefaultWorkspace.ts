import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { defaultHomeName, settingsLanguageFromUserLocale } from "./locale";

/** Idempotent: if user already has any membership, no-op. */
export async function ensureDefaultWorkspace(user: {
  id: string;
  locale: string | null;
}): Promise<void> {
  const existing = await prisma.workspaceMember.count({
    where: { userId: user.id },
  });
  if (existing > 0) return;

  const language = settingsLanguageFromUserLocale(user.locale);
  const name = defaultHomeName(language);

  await prisma.$transaction(async (tx) => {
    // Serialize concurrent first-login /me calls for this user (READ COMMITTED).
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`,
    );

    const again = await tx.workspaceMember.count({
      where: { userId: user.id },
    });
    if (again > 0) return;

    await tx.workspace.create({
      data: {
        name,
        icon: "home",
        createdByUserId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
        settings: {
          create: {
            language,
          },
        },
      },
    });
  });
}
