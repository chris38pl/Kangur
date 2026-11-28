import type {
  InvitationKind,
  InvitationStatus,
  WorkspaceRole,
} from "@prisma/client";

import { clientSupports, type ClientVersion } from "@/lib/clientVersion";

import type { InvitationDTO } from "./schemas";

export type InvitationRow = {
  id: string;
  kind: InvitationKind;
  email: string | null;
  role: WorkspaceRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
};

/**
 * Pending invitations for the owner's list. App 1.0.8 requires an address on every row, so
 * link invitations reach only apps that know them (one bad row breaks the whole list there).
 */
export function presentInvitations(
  rows: readonly InvitationRow[],
  client: ClientVersion,
): InvitationDTO[] {
  const withLinks = clientSupports(client, "linkInvitations");
  return rows
    .filter((row) => withLinks || (row.kind === "email" && row.email))
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));
}
