import type { WorkspaceRole } from "@prisma/client";

import { canCreateInvitation } from "@/features/workspace/canCreateInvitation";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import {
  conflict,
  validationError,
} from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import {
  generateInviteRawToken,
  hashInviteToken,
  inviteExpiresAt,
} from "@/lib/invite/token";
import { prisma } from "@/lib/prisma";

import type { InviteMemberResult } from "./schemas";

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || email;
  if (!local) return email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

const INVITE_ROLES = new Set<WorkspaceRole>(["admin", "member"]);

export type InviteMemberInput = {
  workspaceId: string;
  actorUserId: string;
  actorEmail: string;
  actorLocale: string | null;
  email: string;
  role?: WorkspaceRole;
};

export async function inviteMember(
  input: InviteMemberInput,
): Promise<InviteMemberResult> {
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

  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw validationError("Enter a valid email address.");
  }

  if (email === normalizeEmail(input.actorEmail)) {
    throw validationError("You cannot invite yourself.");
  }

  const role: WorkspaceRole = input.role ?? "member";
  if (!INVITE_ROLES.has(role)) {
    throw validationError("Unknown role.");
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: existingUser.id,
        },
      },
    });
    if (alreadyMember) {
      throw conflict("Already a member of this workspace.", {
        reason: "already_member",
      });
    }
  }

  const pending = await prisma.invitation.findFirst({
    where: {
      workspaceId: input.workspaceId,
      email,
      status: "pending",
    },
  });

  const rawToken = generateInviteRawToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = inviteExpiresAt();
  const inviterName = displayNameFromEmail(input.actorEmail);
  const variant = existingUser ? "existing_user" : "new_user";

  let invitationId: string;
  let status: "created" | "resent";

  if (pending) {
    const updated = await prisma.invitation.update({
      where: { id: pending.id },
      data: {
        tokenHash,
        expiresAt,
        role,
        invitedByUserId: input.actorUserId,
      },
    });
    invitationId = updated.id;
    status = "resent";
    console.info("[invite]", "INVITE_RESENT", {
      invitationId,
      workspaceId: input.workspaceId,
      email,
    });
  } else {
    const created = await prisma.invitation.create({
      data: {
        workspaceId: input.workspaceId,
        email,
        role,
        tokenHash,
        status: "pending",
        expiresAt,
        invitedByUserId: input.actorUserId,
      },
    });
    invitationId = created.id;
    status = "created";
    console.info("[invite]", "INVITE_CREATED", {
      invitationId,
      workspaceId: input.workspaceId,
      email,
    });
  }

  const { delivered } = await sendInviteEmail({
    to: email,
    inviterName,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    rawToken,
    variant,
    locale: input.actorLocale,
  });

  ensureNotificationHandlersRegistered();
  await domainEventBus.publish({
    type: "InvitationCreated",
    workspaceId: input.workspaceId,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    invitationId,
    inviteeEmail: email,
    actorUserId: input.actorUserId,
    actorDisplayName: inviterName,
  });

  const { Analytics } = await import("@/lib/analytics");
  Analytics.track(
    "invitation_sent",
    { workspace_id: input.workspaceId },
    input.actorUserId,
  );

  return {
    status,
    invitation: {
      id: invitationId,
      email,
      role,
      expiresAt: expiresAt.toISOString(),
    },
    emailDelivered: delivered,
  };
}
