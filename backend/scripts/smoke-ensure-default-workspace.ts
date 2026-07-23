/**
 * One-off smoke: concurrent ensureDefaultWorkspace must create a single Dom.
 * Usage: DATABASE_URL=... pnpm exec tsx scripts/smoke-ensure-default-workspace.ts
 * Deletes the throwaway user afterwards.
 */
import { PrismaClient } from "@prisma/client";

import { ensureDefaultWorkspace } from "../features/workspace/ensureDefaultWorkspace";

const prisma = new PrismaClient();

async function main() {
  const clerkId = `smoke_ensure_${Date.now()}`;
  const email = `${clerkId}@example.com`;

  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      locale: "pl",
    },
  });

  try {
    await Promise.all(
      Array.from({ length: 12 }, () =>
        ensureDefaultWorkspace({ id: user.id, locale: user.locale }),
      ),
    );

    const memberships = await prisma.workspaceMember.count({
      where: { userId: user.id },
    });
    const owned = await prisma.workspace.count({
      where: { createdByUserId: user.id },
    });

    if (memberships !== 1 || owned !== 1) {
      throw new Error(
        `Expected 1 membership and 1 workspace, got memberships=${memberships} owned=${owned}`,
      );
    }

    console.log("OK: concurrent ensureDefaultWorkspace created exactly 1 Dom");
  } finally {
    const ownedIds = (
      await prisma.workspace.findMany({
        where: { createdByUserId: user.id },
        select: { id: true },
      })
    ).map((w) => w.id);
    if (ownedIds.length > 0) {
      await prisma.workspace.deleteMany({ where: { id: { in: ownedIds } } });
    }
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
