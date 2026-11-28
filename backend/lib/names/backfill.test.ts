import assert from "node:assert/strict";
import test from "node:test";

import { backfillDisplayNames, type BackfillDeps } from "@/lib/names/backfill";

type Row = { id: string; clerkId: string; source: "provider" | "user" | null; displayName: string | null };

function fakeWorld(rows: Row[], clerk: Record<string, { firstName: string | null; lastName: string | null }>) {
  const calls = { clerk: 0, sleeps: [] as number[], failNext: 0 };
  const deps: BackfillDeps = {
    usersWithoutSource: async (afterId, take) =>
      rows
        .filter((r) => r.source === null && (!afterId || r.id > afterId))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, take)
        .map(({ id, clerkId }) => ({ id, clerkId })),
    clerkNames: async (ids) => {
      calls.clerk += 1;
      if (calls.failNext > 0) {
        calls.failNext -= 1;
        throw Object.assign(new Error("Too Many Requests"), { status: 429 });
      }
      return ids.filter((id) => clerk[id]).map((id) => ({ id, ...clerk[id]! }));
    },
    saveName: async (userId, fields) => {
      const row = rows.find((r) => r.id === userId);
      if (!row || row.source !== null) return false;
      row.displayName = fields.displayName;
      row.source = "provider";
      return true;
    },
    sleep: async (ms) => {
      calls.sleeps.push(ms);
    },
  };
  return { deps, calls };
}

test("a dry run counts and writes nothing", async () => {
  const rows: Row[] = [
    { id: "1", clerkId: "c1", source: null, displayName: null },
    { id: "2", clerkId: "c2", source: null, displayName: null },
  ];
  const { deps } = fakeWorld(rows, { c1: { firstName: "Kasia", lastName: "Nowak" }, c2: { firstName: null, lastName: null } });
  const report = await backfillDisplayNames(deps, { apply: false });
  assert.deepEqual(report, { scanned: 2, named: 1, withoutName: 1, missingInClerk: 0, written: 0 });
  assert.equal(rows[0]!.source, null);
});

test("apply copies Clerk names, in batches, and never a typed one", async () => {
  const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    clerkId: `c${i + 1}`,
    source: null,
    displayName: null,
  }));
  rows.push({ id: "9", clerkId: "c9", source: "user", displayName: "Moje imię" });
  const { deps, calls } = fakeWorld(rows, {
    c1: { firstName: "Kasia", lastName: "Nowak" },
    c2: { firstName: "Jan", lastName: null },
    c3: { firstName: null, lastName: null },
    c4: { firstName: "Ola", lastName: null },
    c9: { firstName: "Clerk", lastName: null },
  });
  const report = await backfillDisplayNames(deps, { apply: true, batchSize: 2 });
  assert.deepEqual(report, { scanned: 5, named: 3, withoutName: 1, missingInClerk: 1, written: 4 });
  assert.equal(calls.clerk, 3);
  assert.equal(rows.find((r) => r.id === "1")!.displayName, "Kasia");
  assert.equal(rows.find((r) => r.id === "5")!.source, null);
  assert.equal(rows.find((r) => r.id === "9")!.displayName, "Moje imię");
});

test("Clerk's rate limit: wait and try again", async () => {
  const rows: Row[] = [{ id: "1", clerkId: "c1", source: null, displayName: null }];
  const { deps, calls } = fakeWorld(rows, { c1: { firstName: "Kasia", lastName: null } });
  calls.failNext = 2;
  const report = await backfillDisplayNames(deps, { apply: true });
  assert.equal(report.written, 1);
  assert.deepEqual(calls.sleeps, [1000, 2000]);
});
