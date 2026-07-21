import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { isWorkspaceIconId } from "@shared/workspace-icons";

extendZodWithOpenApi(z);

export const WorkspaceRoleSchema = z
  .enum(["owner", "admin", "member"])
  .openapi("WorkspaceRole");

export const WorkspacePlanSchema = z
  .enum(["free", "premium"])
  .openapi("WorkspacePlan");

export const WorkspaceBillingStatusSchema = z
  .enum(["none", "active", "trialing", "past_due", "cancelled", "expired"])
  .openapi("WorkspaceBillingStatus");

export const WorkspaceDTOSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    role: WorkspaceRoleSchema,
    isOwner: z.boolean(),
    memberCount: z.number().int().nonnegative(),
    plan: WorkspacePlanSchema,
    billingStatus: WorkspaceBillingStatusSchema,
    currentPeriodEnd: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("WorkspaceDTO");

export type WorkspaceDTO = z.infer<typeof WorkspaceDTOSchema>;

export const CreateWorkspaceBodySchema = z
  .object({
    name: z.string().min(1).max(64),
    icon: z.string().refine(isWorkspaceIconId, {
      message: "Invalid workspace icon id.",
    }),
  })
  .openapi("CreateWorkspaceBody");

export type CreateWorkspaceBody = z.infer<typeof CreateWorkspaceBodySchema>;

export const UpdateWorkspaceBodySchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    icon: z
      .string()
      .refine(isWorkspaceIconId, {
        message: "Invalid workspace icon id.",
      })
      .optional(),
  })
  .refine((body) => body.name !== undefined || body.icon !== undefined, {
    message: "Provide name and/or icon.",
  })
  .openapi("UpdateWorkspaceBody");

export type UpdateWorkspaceBody = z.infer<typeof UpdateWorkspaceBodySchema>;

export const WorkspaceListResponseSchema = z
  .object({
    workspaces: z.array(WorkspaceDTOSchema),
  })
  .openapi("WorkspaceListResponse");

export const WorkspaceMemberDTOSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    email: z.string().email(),
    displayName: z.string(),
    role: WorkspaceRoleSchema,
    joinedAt: z.string().datetime(),
  })
  .openapi("WorkspaceMemberDTO");

export type WorkspaceMemberDTO = z.infer<typeof WorkspaceMemberDTOSchema>;

export const WorkspaceMemberListResponseSchema = z
  .object({
    members: z.array(WorkspaceMemberDTOSchema),
  })
  .openapi("WorkspaceMemberListResponse");

export const InviteRoleSchema = z
  .enum(["admin", "member"])
  .openapi("InviteRole");

export const CreateInvitationBodySchema = z
  .object({
    email: z.string().email(),
    role: InviteRoleSchema.optional(),
  })
  .openapi("CreateInvitationBody");

export type CreateInvitationBody = z.infer<typeof CreateInvitationBodySchema>;

export const InvitationDTOSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    role: WorkspaceRoleSchema,
    status: z.enum(["pending", "accepted", "revoked"]),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime(),
  })
  .openapi("InvitationDTO");

export type InvitationDTO = z.infer<typeof InvitationDTOSchema>;

export const InvitationListResponseSchema = z
  .object({
    invitations: z.array(InvitationDTOSchema),
  })
  .openapi("InvitationListResponse");

export const InviteMemberResultSchema = z
  .object({
    status: z.enum(["created", "resent"]),
    invitation: z.object({
      id: z.string(),
      email: z.string().email(),
      role: WorkspaceRoleSchema,
      expiresAt: z.string().datetime(),
    }),
    token: z.string(),
    acceptUrl: z.string(),
    emailDelivered: z.boolean(),
  })
  .openapi("InviteMemberResult");

export type InviteMemberResult = z.infer<typeof InviteMemberResultSchema>;

export const AcceptInvitationBodySchema = z
  .object({
    token: z.string().min(1),
  })
  .openapi("AcceptInvitationBody");

export type AcceptInvitationBody = z.infer<typeof AcceptInvitationBodySchema>;

export const AcceptInvitationResponseSchema = z
  .object({
    workspace: z.object({
      id: z.string(),
      name: z.string(),
      icon: z.string(),
    }),
    role: WorkspaceRoleSchema,
    alreadyMember: z.boolean(),
  })
  .openapi("AcceptInvitationResponse");

export const InvitationPreviewQuerySchema = z
  .object({
    token: z.string().min(1),
  })
  .openapi("InvitationPreviewQuery");

export const InvitationPreviewResponseSchema = z
  .object({
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
  })
  .openapi("InvitationPreviewResponse");

export type InvitationPreviewResponse = z.infer<
  typeof InvitationPreviewResponseSchema
>;

export const UpdateMemberRoleBodySchema = z
  .object({
    role: InviteRoleSchema,
  })
  .openapi("UpdateMemberRoleBody");

export type UpdateMemberRoleBody = z.infer<typeof UpdateMemberRoleBodySchema>;
