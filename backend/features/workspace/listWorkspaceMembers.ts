import { authorize } from "@/lib/authorize";
import type { ClientVersion } from "@/lib/clientVersion";
import { resolveAppLocale } from "@/lib/locale";
import { nameWords } from "@/lib/names/words";
import { prisma } from "@/lib/prisma";

import { presentMembers } from "./presentMembers";
import type { WorkspaceMemberDTO } from "./schemas";

export const MEMBER_USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  lastNameInitial: true,
} as const;

export async function listWorkspaceMembers(
  workspaceId: string,
  viewer: { id: string; locale: string | null },
  client: ClientVersion,
): Promise<WorkspaceMemberDTO[]> {
  await authorize(workspaceId, viewer.id);

  const rows = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: MEMBER_USER_SELECT } },
  });

  return presentMembers(rows, {
    words: nameWords(resolveAppLocale(viewer.locale)),
    client,
  });
}
