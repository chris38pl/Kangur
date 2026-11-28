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
    /**
     * Null when Apple hides the address (app 1.0.9 and newer). Older apps require an
     * address and never show it, so they get a reserved one instead of the relay address.
     */
    email: z.string().email().nullable(),
    /** The name, "Kasia N." or "Kasia · od 12 listopada" for two of one name, or the fallback word. */
    displayName: z.string(),
    /** False when displayName is the fallback word ("Domownik"). */
    hasName: z.boolean(),
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

export const InvitationKindSchema = z
  .enum(["email", "link"])
  .openapi("InvitationKind");

export const InvitationDTOSchema = z
  .object({
    id: z.string(),
    /** Apps before 1.0.9 get only `email` invitations (lib/clientVersion.ts). */
    kind: InvitationKindSchema,
    /** Null for `link` invitations. */
    email: z.string().email().nullable(),
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
    emailDelivered: z.boolean(),
  })
  .openapi("InviteMemberResult");

export type InviteMemberResult = z.infer<typeof InviteMemberResultSchema>;

/** Where the link goes: shown as a code, or handed to the system share sheet. */
export const InviteLinkChannelSchema = z
  .enum(["code", "share"])
  .openapi("InviteLinkChannel");

export const CreateInviteLinkBodySchema = z
  .object({
    channel: InviteLinkChannelSchema.optional(),
    role: InviteRoleSchema.optional(),
  })
  .openapi("CreateInviteLinkBody");

export type CreateInviteLinkBody = z.infer<typeof CreateInviteLinkBodySchema>;

export const InviteLinkResultSchema = z
  .object({
    invitation: z.object({
      id: z.string(),
      kind: z.literal("link"),
      role: WorkspaceRoleSchema,
      expiresAt: z.string().datetime(),
    }),
    /**
     * https://…/invite#t=<token>. Works once, for 7 days. The token rides after "#", so no
     * server or log on the way sees it. Returned only here, to the person who made it.
     */
    url: z.string().url(),
  })
  .openapi("InviteLinkResult");

export type InviteLinkResult = z.infer<typeof InviteLinkResultSchema>;

/** Deep-link token XOR invitationId (in-app notification for existing users). */
export const AcceptInvitationBodySchema = z
  .object({
    token: z.string().min(1).optional(),
    invitationId: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.token) !== Boolean(v.invitationId), {
    message: "Provide exactly one of token or invitationId.",
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

/** Unauthenticated: the address an e-mail invitation went to, to fill in the sign-in form. */
export const InvitationPeekBodySchema = z
  .object({
    token: z.string().min(1),
  })
  .openapi("InvitationPeekBody");

export const InvitationPeekResponseSchema = z
  .object({
    /** Null for a link, an invitation that no longer works, or an Apple relay address. */
    invitedEmail: z.string().email().nullable(),
  })
  .openapi("InvitationPeekResponse");

export const InvitationPreviewBodySchema = z
  .object({
    token: z.string().min(1).optional(),
    invitationId: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.token) !== Boolean(v.invitationId), {
    message: "Provide exactly one of token or invitationId.",
  })
  .openapi("InvitationPreviewBody");

export const InvitationPreviewResponseSchema = z
  .object({
    invitationId: z.string(),
    kind: InvitationKindSchema,
    createdAt: z.string(),
    /** The inviter's name, or the fallback word when inviterHasName is false. */
    inviterDisplayName: z.string(),
    inviterHasName: z.boolean(),
    /**
     * The invitation went to another real address than the one this account uses. Null for a
     * link, for the same address, and for an account whose address Apple hides.
     */
    differentEmail: z
      .object({
        invitedEmail: z.string().email(),
        accountEmail: z.string().email(),
      })
      .nullable(),
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
