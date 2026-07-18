import { z } from "zod";

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
