import { z } from "zod";

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  isOwner: z.boolean(),
  memberCount: z.number().int().nonnegative(),
  plan: z.enum(["free", "premium"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const WorkspaceListSchema = z.object({
  workspaces: z.array(WorkspaceSchema),
});

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  joinedAt: z.string(),
});

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

export const WorkspaceMemberListSchema = z.object({
  members: z.array(WorkspaceMemberSchema),
});

export const InvitationSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
  status: z.enum(["pending", "accepted", "revoked"]),
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

export const InvitationListSchema = z.object({
  invitations: z.array(InvitationSchema),
});

export const InviteMemberResultSchema = z.object({
  status: z.enum(["created", "resent"]),
  invitation: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(["owner", "admin", "member"]),
    expiresAt: z.string(),
  }),
  token: z.string(),
  acceptUrl: z.string(),
  emailDelivered: z.boolean(),
});

export type InviteMemberResult = z.infer<typeof InviteMemberResultSchema>;

export const AcceptInvitationResultSchema = z.object({
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  role: z.enum(["owner", "admin", "member"]),
  alreadyMember: z.boolean(),
});

export type AcceptInvitationResult = z.infer<
  typeof AcceptInvitationResultSchema
>;

export const InvitationPreviewSchema = z.object({
  invitationId: z.string(),
  createdAt: z.string(),
  inviterDisplayName: z.string(),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  memberCount: z.number().int().nonnegative(),
  members: z.array(
    z.object({
      userId: z.string(),
      displayName: z.string(),
    }),
  ),
  alreadyMember: z.boolean(),
});

export type InvitationPreview = z.infer<typeof InvitationPreviewSchema>;
