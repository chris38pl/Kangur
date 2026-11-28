import { nameFromProvider } from "./displayName";

/**
 * Names for accounts made before Kangur kept them: copied from Clerk once, for users whose
 * displayNameSource is still null. A name typed in Kangur is never touched. Only accounts
 * Clerk has a name for are written: the rest keep a null source, so a name that appears in
 * Clerk later still comes with the next run. Pure, with every outside call passed in, so
 * the test needs neither a database nor Clerk.
 */

export type BackfillUser = { id: string; clerkId: string };
export type ClerkName = { id: string; firstName: string | null; lastName: string | null };

export type BackfillDeps = {
  /** Users still without a source, after `afterId`, in id order. */
  usersWithoutSource(afterId: string | null, take: number): Promise<BackfillUser[]>;
  /** Clerk users by id; at most `take` ids per call. */
  clerkNames(clerkIds: string[]): Promise<ClerkName[]>;
  /** Writes only while the source is still null; false when someone was faster. */
  saveName(
    userId: string,
    fields: { displayName: string; lastNameInitial: string | null },
  ): Promise<boolean>;
  sleep(ms: number): Promise<void>;
  log?(line: string): void;
};

export type BackfillReport = {
  scanned: number;
  /** Clerk has a usable name. */
  named: number;
  /** Clerk has the user but no usable name: left as it is, for a later run. */
  withoutName: number;
  /** Not in Clerk any more: left as it is. */
  missingInClerk: number;
  /** Rows written (0 in a dry run). */
  written: number;
};

/** Clerk production allows 1000 requests per 10 s; a 429 still makes us wait and retry. */
export const BACKFILL_BATCH = 100;
const MAX_RETRIES = 6;

function retryDelayMs(error: unknown, attempt: number): number | null {
  const e = error as { status?: number; retryAfter?: number; errors?: Array<{ code?: string }> };
  const limited =
    e?.status === 429 || Boolean(e?.errors?.some((x) => x.code === "too_many_requests"));
  if (!limited) return null;
  if (typeof e.retryAfter === "number" && e.retryAfter > 0) return e.retryAfter * 1000;
  return Math.min(60_000, 1000 * 2 ** attempt);
}

async function withRetry<T>(deps: BackfillDeps, call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      const wait = retryDelayMs(error, attempt);
      if (wait === null || attempt >= MAX_RETRIES) throw error;
      deps.log?.(`Clerk asked to slow down, waiting ${Math.round(wait / 1000)} s`);
      await deps.sleep(wait);
    }
  }
}

export async function backfillDisplayNames(
  deps: BackfillDeps,
  options: { apply: boolean; batchSize?: number },
): Promise<BackfillReport> {
  const take = Math.min(options.batchSize ?? BACKFILL_BATCH, BACKFILL_BATCH);
  const report: BackfillReport = {
    scanned: 0,
    named: 0,
    withoutName: 0,
    missingInClerk: 0,
    written: 0,
  };

  let afterId: string | null = null;
  for (;;) {
    const users = await deps.usersWithoutSource(afterId, take);
    if (users.length === 0) break;
    afterId = users[users.length - 1]!.id;
    report.scanned += users.length;

    const clerk = await withRetry(deps, () => deps.clerkNames(users.map((u) => u.clerkId)));
    const byClerkId = new Map(clerk.map((c) => [c.id, c]));

    for (const user of users) {
      const found = byClerkId.get(user.clerkId);
      if (!found) {
        report.missingInClerk += 1;
        continue;
      }
      const { displayName, lastNameInitial } = nameFromProvider(found.firstName, found.lastName);
      if (!displayName) {
        report.withoutName += 1;
        continue;
      }
      report.named += 1;
      if (options.apply && (await deps.saveName(user.id, { displayName, lastNameInitial }))) {
        report.written += 1;
      }
    }
    deps.log?.(`${report.scanned} accounts checked`);
    if (users.length < take) break;
  }
  return report;
}
