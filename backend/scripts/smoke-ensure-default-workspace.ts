/**
 * Smoke: ensureDefaultWorkspace locale contract.
 * 1) locale=pl → exactly one Dom (settings=pl), concurrent-safe
 * 2) locale=null → no workspace (fail-closed; never accidental English Home)
 *
 * Usage: DATABASE_URL=... pnpm exec tsx scripts/smoke-ensure-default-workspace.ts
 * Deletes throwaway users afterwards.
 */
import { PrismaClient } from "@prisma/client";

import { ensureDefaultWorkspace } from "../features/workspace/ensureDefaultWorkspace";

const prisma = new PrismaClient();

async function cleanupUser(userId: string) {
  const ownedIds = (
    await prisma.workspace.findMany({
      where: { createdByUserId: userId },
      select: { id: true },
    })
  ).map((w) => w.id);
  if (ownedIds.length > 0) {
    await prisma.workspace.deleteMany({ where: { id: { in: ownedIds } } });
  }
  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

async function smokePlCreatesDom() {
  const clerkId = `smoke_ensure_pl_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      clerkId,
      email: `${clerkId}@example.com`,
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
    const owned = await prisma.workspace.findMany({
      where: { createdByUserId: user.id },
      include: { settings: true },
    });

    if (memberships !== 1 || owned.length !== 1) {
      throw new Error(
        `Expected 1 membership and 1 workspace, got memberships=${memberships} owned=${owned.length}`,
      );
    }

    const workspace = owned[0]!;
    if (workspace.name !== "Dom") {
      throw new Error(
        `Expected default workspace name "Dom" for locale=pl, got "${workspace.name}"`,
      );
    }
    if (workspace.settings?.language !== "pl") {
      throw new Error(
        `Expected workspace settings language "pl", got "${workspace.settings?.language ?? "null"}"`,
      );
    }

    console.log(
      "OK: concurrent ensureDefaultWorkspace created exactly 1 Dom (settings=pl)",
    );
  } finally {
    await cleanupUser(user.id);
  }
}

async function smokeNullSkipsWorkspace() {
  const clerkId = `smoke_ensure_null_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      clerkId,
      email: `${clerkId}@example.com`,
      locale: null,
    },
  });

  try {
    await ensureDefaultWorkspace({ id: user.id, locale: user.locale });

    const owned = await prisma.workspace.count({
      where: { createdByUserId: user.id },
    });
    const memberships = await prisma.workspaceMember.count({
      where: { userId: user.id },
    });

    if (owned !== 0 || memberships !== 0) {
      throw new Error(
        `Expected no workspace when locale=null, got owned=${owned} memberships=${memberships}`,
      );
    }

    console.log("OK: ensureDefaultWorkspace skipped when locale=null");
  } finally {
    await cleanupUser(user.id);
  }
}

async function main() {
  await smokePlCreatesDom();
  await smokeNullSkipsWorkspace();
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
