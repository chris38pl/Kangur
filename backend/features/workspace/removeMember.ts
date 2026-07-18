import { forbidden, notFound, validationError } from "@/lib/auth/errors";
import { authorize, requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  actorUserId: string,
): Promise<void> {
  const { membership: actor } = await authorize(workspaceId, actorUserId);
  requireRole(
    actor,
    ["owner", "admin"],
    "Only owners and admins can remove members.",
  );

  if (targetUserId === actorUserId) {
    throw forbidden("You cannot remove yourself. Transfer ownership first.");
  }

  const target = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
  });

  if (!target) {
    throw notFound("Member not found.");
  }

  if (target.role === "owner") {
    throw forbidden("Cannot remove the workspace owner.");
  }

  if (actor.role === "admin" && target.role !== "member") {
    throw forbidden("Admins can only remove members.");
  }

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
  });

  console.info("[invite]", "MEMBER_REMOVED", {
    workspaceId,
    targetUserId,
    actorUserId,
  });
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  actorUserId: string,
  role: string,
): Promise<void> {
  if (role !== "admin" && role !== "member") {
    throw validationError("Unknown role.");
  }

  const { membership: actor } = await authorize(workspaceId, actorUserId);

  if (actor.role !== "owner") {
    throw forbidden("Only the owner can change member roles.");
  }

  if (targetUserId === actorUserId) {
    throw forbidden("You cannot change your own role. Transfer ownership first.");
  }

  const target = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
  });

  if (!target) {
    throw notFound("Member not found.");
  }

  if (target.role === "owner") {
    throw forbidden("Cannot change the owner role.");
  }

  await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
    data: { role },
  });

  console.info("[invite]", "ROLE_CHANGED", {
    workspaceId,
    targetUserId,
    role,
    actorUserId,
  });
}
