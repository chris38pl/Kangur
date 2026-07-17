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
    // Re-check inside transaction to reduce double-Home races
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
