/**
 * The response schemas of app 1.0.8, copied without a change from origin/release/1.0.8
 * (commit 9aad669): mobile/features/workspace/schemas.ts, mobile/features/notifications/schemas.ts
 * and MeSchema from mobile/features/auth/useMe.ts. That app is in the stores and checks every
 * answer with them; app-1.0.8-contract.test.ts sends the server answers through them.
 * Never edit: a change here hides what would break on phones.
 */
import { z } from "zod";

// mobile/features/workspace/schemas.ts

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

// mobile/features/notifications/schemas.ts

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "WORKSPACE_INVITATION",
    "SHOPPING_STARTED",
    "SHOPPING_FINISHED",
    "SHOPPING_LIST_CREATED",
    "SHOPPING_LIST_DELETED",
  ]),
  status: z.enum(["UNREAD", "READ"]),
  title: z.string(),
  body: z.string(),
  actorUserId: z.string().nullable(),
  workspaceId: z.string().nullable(),
  sourceId: z.string().nullable(),
  payloadType: z.enum(["INVITE", "LIST", "WORKSPACE", "SHOPPING"]),
  payloadSchemaVersion: z.number().int(),
  payload: z.unknown(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;

export const NotificationListSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount: z.number().int().nonnegative(),
});

export const NotificationPreferencesSchema = z.object({
  silentMode: z.boolean(),
  workspaceInvitations: z.boolean(),
  shoppingStarted: z.boolean(),
  shoppingFinished: z.boolean(),
  shoppingListCreated: z.boolean(),
  shoppingListDeleted: z.boolean(),
  appUpdates: z.boolean(),
  newFeatures: z.boolean(),
  offersPromos: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof NotificationPreferencesSchema
>;

export const ShoppingSessionSchema = z.object({
  id: z.string(),
  listId: z.string(),
  workspaceId: z.string(),
  startedAt: z.string(),
  resumed: z.boolean().optional(),
});

// mobile/features/auth/useMe.ts (createEnumSchema(APP_LOCALE_IDS) is z.enum of these ids)

const AppLocaleSchema = z.enum(["pl", "en", "de", "ru", "uk", "fr", "es", "it", "cs", "be"]);


export const MeSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  locale: AppLocaleSchema.nullable(),
  platformRole: z.enum(["USER", "ADMIN"]).default("USER"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
