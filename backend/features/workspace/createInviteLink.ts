import type { WorkspaceRole } from "@prisma/client";

import { canCreateInvitation } from "@/features/workspace/canCreateInvitation";
import { validationError } from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import {
  generateInviteRawToken,
  hashInviteToken,
  inviteExpiresAt,
} from "@/lib/invite/token";
import { inviteLinkUrl } from "@/lib/marketing/invite";
import { prisma } from "@/lib/prisma";
import { rateLimitExceeded } from "@/lib/rateLimit";

import type { InviteLinkResult } from "./schemas";

/** Links one workspace may make in 24 hours, whoever makes them. */
export const INVITE_LINKS_PER_DAY = 20;

const LINK_ROLES = new Set<WorkspaceRole>(["admin", "member"]);

/**
 * An invitation without an address: one secret link, shown as a code on the screen of the
 * person inviting, or handed to the share sheet. Works once and for 7 days, like an e-mail
 * invitation, and the same people may make it. The raw token leaves the server only in this
 * answer.
 */
export async function createInviteLink(input: {
  workspaceId: string;
  actorUserId: string;
  channel?: "code" | "share";
  role?: WorkspaceRole;
}): Promise<InviteLinkResult> {
  const { workspace, membership } = await authorize(
    input.workspaceId,
    input.actorUserId,
  );
  requireRole(
    membership,
    ["owner", "admin"],
    "Only owners and admins can invite members.",
  );
  await canCreateInvitation(workspace);

  const role: WorkspaceRole = input.role ?? "member";
  if (!LINK_ROLES.has(role)) throw validationError("Unknown role.");

  const madeToday = await prisma.invitation.count({
    where: {
      workspaceId: input.workspaceId,
      kind: "link",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (madeToday >= INVITE_LINKS_PER_DAY) {
    throw rateLimitExceeded("Too many invitation links today. Try again tomorrow.");
  }

  const rawToken = generateInviteRawToken();
  const created = await prisma.invitation.create({
    data: {
      workspaceId: input.workspaceId,
      kind: "link",
      email: null,
      role,
      tokenHash: hashInviteToken(rawToken),
      status: "pending",
      expiresAt: inviteExpiresAt(),
      invitedByUserId: input.actorUserId,
    },
  });

  console.info("[invite]", "INVITE_LINK_CREATED", {
    invitationId: created.id,
    workspaceId: input.workspaceId,
    channel: input.channel ?? null,
  });

  const { Analytics } = await import("@/lib/analytics");
  Analytics.track(
    "invite_link_created",
    { workspace_id: input.workspaceId, channel: input.channel ?? "share" },
    input.actorUserId,
  );

  return {
    invitation: {
      id: created.id,
      kind: "link",
      role: created.role,
      expiresAt: created.expiresAt.toISOString(),
    },
    url: inviteLinkUrl(rawToken),
  };
}
