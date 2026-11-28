import { z } from "zod";

import { lenientArray } from "@/lib/api/lenient";

/**
 * Answers of a server that may be newer than this app: unknown values fall back, unknown
 * rows are skipped (lib/api/lenient.ts), extra fields are ignored.
 */
const RoleSchema = z.enum(["owner", "admin", "member"]).catch("member");

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  isOwner: z.boolean(),
  memberCount: z.number().int().nonnegative(),
  plan: z.enum(["free", "premium"]),
  billingStatus: z
    .enum(["none", "active", "trialing", "past_due", "cancelled", "expired"])
    .default("none"),
  currentPeriodEnd: z.string().nullable().optional().default(null),
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
  /** Null when Apple hides the address. Never shown in the app. */
  email: z.string().nullable().optional().default(null),
  /** The name from the server: "Kasia", "Kasia N." for two of one name, or "Domownik". */
  displayName: z.string(),
  /** False when displayName is the fallback word. */
  hasName: z.boolean().optional().default(true),
  role: RoleSchema,
  joinedAt: z.string(),
});

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

export const WorkspaceMemberListSchema = z.object({
  members: lenientArray(WorkspaceMemberSchema),
});

export const InvitationKindSchema = z.enum(["email", "link"]).catch("email");

export const InvitationSchema = z.object({
  id: z.string(),
  /** `link`: no address, shown as a code or shared. */
  kind: InvitationKindSchema,
  email: z.string().nullable().optional().default(null),
  role: RoleSchema,
  status: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

export const InvitationListSchema = z.object({
  invitations: lenientArray(InvitationSchema),
});

export const InviteMemberResultSchema = z.object({
  status: z.enum(["created", "resent"]).catch("created"),
  invitation: z.object({
    id: z.string(),
    email: z.string(),
    role: RoleSchema,
    expiresAt: z.string(),
  }),
  emailDelivered: z.boolean(),
});

export type InviteMemberResult = z.infer<typeof InviteMemberResultSchema>;

export const InviteLinkResultSchema = z.object({
  invitation: z.object({
    id: z.string(),
    role: RoleSchema,
    expiresAt: z.string(),
  }),
  /** https://…/invite#t=<token>, one use, 7 days. */
  url: z.string(),
});

export type InviteLinkResult = z.infer<typeof InviteLinkResultSchema>;

export const AcceptInvitationResultSchema = z.object({
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  role: RoleSchema,
  alreadyMember: z.boolean(),
});

export type AcceptInvitationResult = z.infer<
  typeof AcceptInvitationResultSchema
>;

export const InvitationPreviewSchema = z.object({
  invitationId: z.string(),
  kind: InvitationKindSchema,
  createdAt: z.string(),
  inviterDisplayName: z.string(),
  inviterHasName: z.boolean().optional().default(true),
  /** The invitation went to another real address than this account's. */
  differentEmail: z
    .object({
      invitedEmail: z.string(),
      accountEmail: z.string(),
    })
    .nullable()
    .optional()
    .default(null),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  memberCount: z.number().int().nonnegative(),
  members: lenientArray(
    z.object({
      userId: z.string(),
      displayName: z.string(),
    }),
  ),
  alreadyMember: z.boolean(),
});

export type InvitationPreview = z.infer<typeof InvitationPreviewSchema>;

export const InvitationPeekSchema = z.object({
  invitedEmail: z.string().nullable().optional().default(null),
});
