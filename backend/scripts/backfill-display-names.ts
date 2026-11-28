/**
 * One-off: copy names from Clerk to Kangur for accounts made before Kangur kept them
 * (User.displayName). New accounts get the name at the first sign-in (lib/auth/requireUser.ts).
 * Touches only users whose displayNameSource is null and never a name typed in Kangur.
 * Prints counts only, never names or addresses.
 *
 * Dry run (default, writes nothing):
 *   DATABASE_URL=… CLERK_SECRET_KEY=… pnpm exec tsx scripts/backfill-display-names.ts
 * Write:
 *   DATABASE_URL=… CLERK_SECRET_KEY=… pnpm exec tsx scripts/backfill-display-names.ts --apply
 *
 * The database and the Clerk key must belong to the same environment. Production only with
 * the owner's approval.
 */
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

import {
  BACKFILL_BATCH,
  backfillDisplayNames,
  type BackfillDeps,
} from "../lib/names/backfill";

async function main() {
  const apply = process.argv.includes("--apply");
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!process.env.DATABASE_URL || !secretKey) {
    console.error("Set DATABASE_URL and CLERK_SECRET_KEY of one environment.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const clerk = createClerkClient({ secretKey });

  const deps: BackfillDeps = {
    usersWithoutSource: (afterId, take) =>
      prisma.user.findMany({
        where: {
          displayNameSource: null,
          ...(afterId ? { id: { gt: afterId } } : {}),
        },
        orderBy: { id: "asc" },
        take,
        select: { id: true, clerkId: true },
      }),
    clerkNames: async (clerkIds) => {
      const { data } = await clerk.users.getUserList({
        userId: clerkIds,
        limit: BACKFILL_BATCH,
      });
      return data.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName }));
    },
    saveName: async (userId, fields) => {
      const { count } = await prisma.user.updateMany({
        where: { id: userId, displayNameSource: null },
        data: { ...fields, displayNameSource: "provider" },
      });
      return count === 1;
    },
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log: (line) => console.info(line),
  };

  try {
    const report = await backfillDisplayNames(deps, { apply });
    console.info(apply ? "Written." : "Dry run, nothing written. Add --apply to write.");
    console.info(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
