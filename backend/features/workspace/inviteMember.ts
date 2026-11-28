import type { User, WorkspaceRole } from "@prisma/client";

import { canCreateInvitation } from "@/features/workspace/canCreateInvitation";
import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import {
  clerkDirectory,
  type ClerkDirectory,
} from "@/lib/auth/clerkDirectory";
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
import { resolveDisplayName } from "@/lib/names/displayName";
import { prisma } from "@/lib/prisma";

import type { InviteMemberResult } from "./schemas";

const INVITE_ROLES = new Set<WorkspaceRole>(["admin", "member"]);

export type InviteMemberInput = {
  workspaceId: string;
  actor: Pick<User, "id" | "email" | "locale" | "displayName">;
  email: string;
  role?: WorkspaceRole;
};

/**
 * The Kangur account behind an address: any address verified in Clerk, not only the main
 * one, then the address Kangur keeps. Clerk out of reach is not fatal: the invitation still
 * goes out by e-mail.
 */
export async function findAccountByEmail(
  email: string,
  directory: ClerkDirectory = clerkDirectory,
): Promise<User | null> {
  try {
    const clerkIds = await directory.usersWithVerifiedEmail(email);
    if (clerkIds.length > 0) {
      const user = await prisma.user.findFirst({
        where: { clerkId: { in: clerkIds } },
        orderBy: { createdAt: "asc" },
      });
      if (user) return user;
    }
  } catch (error) {
    console.warn("[invite]", "ClerkLookupFailed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

export async function inviteMember(
  input: InviteMemberInput,
  directory: ClerkDirectory = clerkDirectory,
): Promise<InviteMemberResult> {
  const { workspace, membership } = await authorize(
    input.workspaceId,
    input.actor.id,
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

  if (email === normalizeEmail(input.actor.email)) {
    throw validationError("You cannot invite yourself.");
  }

  const role: WorkspaceRole = input.role ?? "member";
  if (!INVITE_ROLES.has(role)) {
    throw validationError("Unknown role.");
  }

  const existingUser = await findAccountByEmail(email, directory);
  if (existingUser?.id === input.actor.id) {
    throw validationError("You cannot invite yourself.");
  }

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
      kind: "email",
      email,
      status: "pending",
    },
  });

  const rawToken = generateInviteRawToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = inviteExpiresAt();
  // Null: the e-mail says "an invitation to …" instead of "Kasia invites you to …".
  const inviterName = resolveDisplayName(input.actor);
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
        invitedByUserId: input.actor.id,
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
        kind: "email",
        email,
        role,
        tokenHash,
        status: "pending",
        expiresAt,
        invitedByUserId: input.actor.id,
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
    locale: input.actor.locale,
  });

  ensureNotificationHandlersRegistered();
  await domainEventBus.publish({
    type: "InvitationCreated",
    workspaceId: input.workspaceId,
    workspaceName: workspace.name,
    workspaceIcon: workspace.icon,
    invitationId,
    inviteeUserId: existingUser?.id ?? null,
    actorUserId: input.actor.id,
  });

  const { Analytics } = await import("@/lib/analytics");
  Analytics.track(
    "invitation_sent",
    { workspace_id: input.workspaceId },
    input.actor.id,
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
