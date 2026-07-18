import type { Workspace } from "@prisma/client";

/**
 * Stub for future Premium / member-cap checks.
 * Keep naming aligned with canRemoveMember / canEditRole / canDeleteWorkspace.
 */
export async function canCreateInvitation(
  _workspace: Workspace,
): Promise<true> {
  return true;
}
