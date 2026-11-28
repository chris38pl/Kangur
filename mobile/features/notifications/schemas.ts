import { z } from "zod";

import { lenientArray } from "@/lib/api/lenient";

/**
 * Types this app knows how to open. The server may send newer ones: they show with their
 * title and body and open nothing (app 1.0.8 broke its whole list over one).
 */
export const KNOWN_NOTIFICATION_TYPES = [
  "WORKSPACE_INVITATION",
  "SHOPPING_STARTED",
  "SHOPPING_FINISHED",
  "SHOPPING_LIST_CREATED",
  "SHOPPING_LIST_DELETED",
  "WORKSPACE_MEMBER_JOINED",
] as const;

export type KnownNotificationType = (typeof KNOWN_NOTIFICATION_TYPES)[number];

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(["UNREAD", "READ"]).catch("READ"),
  title: z.string(),
  body: z.string(),
  actorUserId: z.string().nullable(),
  workspaceId: z.string().nullable(),
  sourceId: z.string().nullable(),
  payloadType: z.string(),
  payloadSchemaVersion: z.number().int(),
  payload: z.unknown(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;

export const NotificationListSchema = z.object({
  notifications: lenientArray(NotificationSchema),
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
