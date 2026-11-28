import type { InvitationKind, WorkspaceRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { ensureNotificationHandlersRegistered } from "@/features/notifications/registerHandlers";
import { canCreateInvitation } from "@/features/workspace/canCreateInvitation";
import { conflict, notFound } from "@/lib/auth/errors";
import type { AuthProvider } from "@/lib/auth/resolveAuthProvider";
import { normalizeEmail } from "@/lib/email/normalizeEmail";
import { domainEventBus } from "@/lib/events/DomainEventBus";
import { isPrivateRelayEmail } from "@/lib/names/displayName";
import { prisma } from "@/lib/prisma";

import {
  invitationGate,
  invitationGoneError,
  needsAddressCheck,
  wrongAccountError,
} from "./invitationAccess";
import {
  accountOwnsAddress,
  capabilityOf,
  defaultInvitationDeps,
  findInvitation,
  type InvitationCapability,
  type InvitationDeps,
} from "./invitationDeps";
import type { InvitationViewer } from "./previewInvitation";

export type AcceptInvitationResult = {
  workspace: {
    id: string;
    name: string;
    icon: string;
  };
  role: WorkspaceRole;
  alreadyMember: boolean;
};

export type AcceptInvitationInput = InvitationCapability & {
  viewer: InvitationViewer;
};

export type { AuthProvider };

/** A serializable transaction that lost a race is tried again; the second try sees the winner. */
const MAX_ATTEMPTS = 3;

type Joined = AcceptInvitationResult & {
  invitation: {
    id: string;
    kind: InvitationKind;
    email: string | null;
    invitedByUserId: string;
  };
};

function isSerializationFailure(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}

/**
 * Joins the workspace with a one-time invitation (see invitationAccess.ts). Two people with
 * one link at the same moment: the status flips pending → accepted once, under a
 * serializable transaction, so exactly one of them gets in.
 */
export async function acceptInvitation(
  input: AcceptInvitationInput,
  deps: InvitationDeps = defaultInvitationDeps,
): Promise<AcceptInvitationResult> {
  if (!input.rawToken?.trim() && !input.invitationId?.trim()) {
    throw notFound("Invitation expired.", { reason: "expired" });
  }
  const { via, where } = capabilityOf(input);
  const viewer = input.viewer;

  // Clerk is asked outside the transaction; the transaction re-checks the state itself.
  if (needsAddressCheck(via)) {
    const invitation = await findInvitation(prisma, where, {});
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invitation.workspaceId, userId: viewer.id },
      },
      select: { id: true },
    });
    const gate = invitationGate({
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      isMember: Boolean(membership),
      now: deps.now(),
    });
    if (
      gate.kind === "open" &&
      !(await accountOwnsAddress(invitation.email, viewer, deps))
    ) {
      throw wrongAccountError({
        email: viewer.email,
        provider: await deps.authProvider(viewer.clerkId),
      });
    }
  }

  let joined: Joined | null = null;
  for (let attempt = 1; !joined; attempt += 1) {
    try {
      joined = await joinOnce(where, viewer.id, deps.now());
    } catch (error) {
      if (isSerializationFailure(error) && attempt < MAX_ATTEMPTS) continue;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const invitation = await prisma.invitation.findUnique({
          where,
          include: { workspace: true },
        });
        throw conflict("You already belong to this workspace.", {
          reason: "already_member",
          workspaceId: invitation?.workspaceId,
          workspaceName: invitation?.workspace.name,
          workspaceIcon: invitation?.workspace.icon,
        });
      }
      throw error;
    }
  }

  if (!joined.alreadyMember) {
    await afterJoin(joined, viewer);
  }

  return {
    workspace: joined.workspace,
    role: joined.role,
    alreadyMember: joined.alreadyMember,
  };
}

async function joinOnce(
  where: Prisma.InvitationWhereUniqueInput,
  userId: string,
  now: Date,
): Promise<Joined> {
  return prisma.$transaction(
    async (tx) => {
      const invitation = await findInvitation(tx, where, { workspace: true });
      const workspace = {
        id: invitation.workspace.id,
        name: invitation.workspace.name,
        icon: invitation.workspace.icon,
      };
      const meta = {
        id: invitation.id,
        kind: invitation.kind,
        email: invitation.email,
        invitedByUserId: invitation.invitedByUserId,
      };

      const membership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
        },
      });

      const gate = invitationGate({
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        isMember: Boolean(membership),
        now,
      });
      if (gate.kind === "gone") throw invitationGoneError(gate.reason);

      if (gate.kind === "already_member" && membership) {
        // An address invitation is done once its person is in. A link stays for whoever it
        // was meant for, even when a member opens it.
        if (invitation.kind === "email" && invitation.status === "pending") {
          await tx.invitation.updateMany({
            where: { id: invitation.id, status: "pending" },
            data: { status: "accepted", acceptedAt: now },
          });
        }
        return { workspace, role: membership.role, alreadyMember: true, invitation: meta };
      }

      // The same limits as for sending it (Premium caps later), checked again on joining.
      await canCreateInvitation(invitation.workspace);

      const accepted = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          status: "pending",
          expiresAt: { gte: now },
        },
        data: { status: "accepted", acceptedAt: now },
      });
      if (accepted.count === 0) {
        const current = await tx.invitation.findUnique({
          where: { id: invitation.id },
          select: { status: true },
        });
        throw invitationGoneError(current?.status === "revoked" ? "revoked" : "used");
      }

      const role: WorkspaceRole = invitation.role === "owner" ? "member" : invitation.role;
      await tx.workspaceMember.create({
        data: { workspaceId: invitation.workspaceId, userId, role },
      });

      console.info("[invite]", "INVITE_ACCEPTED", {
        invitationId: invitation.id,
        workspaceId: invitation.workspaceId,
        userId,
        kind: invitation.kind,
      });

      return { workspace, role, alreadyMember: false, invitation: meta };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function afterJoin(joined: Joined, viewer: InvitationViewer): Promise<void> {
  const { Analytics } = await import("@/lib/analytics");
  const workspaceId = joined.workspace.id;
  Analytics.track("invitation_accepted", { workspace_id: workspaceId }, viewer.id);
  if (joined.invitation.kind === "link") {
    Analytics.track("invite_link_joined", { workspace_id: workspaceId }, viewer.id);
  } else if (
    joined.invitation.email &&
    normalizeEmail(joined.invitation.email) !== normalizeEmail(viewer.email)
  ) {
    Analytics.track(
      "invite_joined_other_email",
      { workspace_id: workspaceId, relay: isPrivateRelayEmail(viewer.email) },
      viewer.id,
    );
  }

  ensureNotificationHandlersRegistered();
  await domainEventBus.publish({
    type: "WorkspaceMemberJoined",
    workspaceId,
    workspaceName: joined.workspace.name,
    workspaceIcon: joined.workspace.icon,
    invitationId: joined.invitation.id,
    inviterUserId: joined.invitation.invitedByUserId,
    memberUserId: viewer.id,
  });
}
