import type { WorkspaceRole } from "@prisma/client";

import { clientSupports, type ClientVersion } from "@/lib/clientVersion";
import {
  isPrivateRelayEmail,
  labelPeople,
  resolveDisplayName,
  type NameWords,
} from "@/lib/names/displayName";

import type { WorkspaceMemberDTO } from "./schemas";

/**
 * App 1.0.8 requires an address for every member and never shows it. A member whose address
 * Apple hides gets this one: reserved by RFC 2606, it can reach nobody.
 */
export const LEGACY_HIDDEN_EMAIL = "hidden@email.invalid";

export type MemberRow = {
  id: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  user: {
    email: string;
    displayName: string | null;
    lastNameInitial: string | null;
  };
};

const ROLE_RANK: Record<WorkspaceRole, number> = { owner: 0, admin: 1, member: 2 };

/** owner → admin → member, then by the day they joined. */
export function sortMembers<T extends Pick<MemberRow, "role" | "joinedAt">>(rows: readonly T[]): T[] {
  return rows
    .slice()
    .sort(
      (a, b) =>
        (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9) ||
        a.joinedAt.getTime() - b.joinedAt.getTime(),
    );
}

/** Names of everyone in one workspace, told apart when two share a name. */
export function memberLabels(rows: readonly MemberRow[], words: NameWords): Map<string, string> {
  return labelPeople(
    rows.map((row) => ({
      userId: row.userId,
      name: resolveDisplayName(row.user),
      lastNameInitial: row.user.lastNameInitial,
      joinedAt: row.joinedAt,
    })),
    words,
  );
}

export function presentMembers(
  rows: readonly MemberRow[],
  ctx: { words: NameWords; client: ClientVersion },
): WorkspaceMemberDTO[] {
  const labels = memberLabels(rows, ctx.words);
  const hiddenEmail = clientSupports(ctx.client, "hiddenMemberEmail") ? null : LEGACY_HIDDEN_EMAIL;

  return sortMembers(rows).map((row) => ({
    id: row.id,
    userId: row.userId,
    email: isPrivateRelayEmail(row.user.email) ? hiddenEmail : row.user.email,
    displayName: labels.get(row.userId) ?? ctx.words.fallback,
    hasName: resolveDisplayName(row.user) !== null,
    role: row.role,
    joinedAt: row.joinedAt.toISOString(),
  }));
}
