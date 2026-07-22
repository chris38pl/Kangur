import { prisma } from "@/lib/prisma";
import { validationError } from "@/lib/auth/errors";
import { isWorkspaceIconId } from "@shared/workspace-icons";

import { settingsLanguageFromUserLocale } from "./locale";
import { normalizeWorkspaceName } from "./normalizeName";
import { toWorkspaceDto, workspaceSubscriptionSelect } from "./toWorkspaceDto";
import type { WorkspaceDTO } from "./schemas";

export type CreateWorkspaceInput = {
  userId: string;
  name: string;
  icon: string;
  userLocale: string | null;
};

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<WorkspaceDTO> {
  const name = normalizeWorkspaceName(input.name);
  if (name.length < 1 || name.length > 64) {
    throw validationError("Name must be between 1 and 64 characters.");
  }
  if (!isWorkspaceIconId(input.icon)) {
    throw validationError("Invalid workspace icon id.");
  }

  const language = settingsLanguageFromUserLocale(input.userLocale);

  const workspace = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        name,
        icon: input.icon,
        createdByUserId: input.userId,
        members: {
          create: {
            userId: input.userId,
            role: "owner",
          },
        },
        settings: {
          create: {
            language,
          },
        },
      },
      include: {
        subscription: { select: workspaceSubscriptionSelect },
        _count: { select: { members: true } },
      },
    });
    return created;
  });

  const { Analytics } = await import("@/lib/analytics");
  Analytics.track(
    "workspace_created",
    {
      workspace_id: workspace.id,
      is_default_home: false,
    },
    input.userId,
  );

  return toWorkspaceDto(workspace, "owner");
}
