import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const NotificationTypeSchema = z
  .enum([
    "WORKSPACE_INVITATION",
    "SHOPPING_STARTED",
    "SHOPPING_FINISHED",
    "SHOPPING_LIST_CREATED",
    "SHOPPING_LIST_DELETED",
  ])
  .openapi("NotificationType");

export const NotificationStatusSchema = z
  .enum(["UNREAD", "READ"])
  .openapi("NotificationStatus");

export const NotificationPayloadTypeSchema = z
  .enum(["INVITE", "LIST", "WORKSPACE", "SHOPPING"])
  .openapi("NotificationPayloadType");

export const NotificationDTOSchema = z
  .object({
    id: z.string(),
    type: NotificationTypeSchema,
    status: NotificationStatusSchema,
    title: z.string(),
    body: z.string(),
    actorUserId: z.string().nullable(),
    workspaceId: z.string().nullable(),
    sourceId: z.string().nullable(),
    payloadType: NotificationPayloadTypeSchema,
    payloadSchemaVersion: z.number().int(),
    payload: z.unknown(),
    createdAt: z.string().datetime(),
    readAt: z.string().datetime().nullable(),
  })
  .openapi("NotificationDTO");

export type NotificationDTO = z.infer<typeof NotificationDTOSchema>;

export const NotificationListResponseSchema = z
  .object({
    notifications: z.array(NotificationDTOSchema),
    unreadCount: z.number().int().nonnegative(),
  })
  .openapi("NotificationListResponse");

export const NotificationPreferencesSchema = z
  .object({
    silentMode: z.boolean(),
    workspaceInvitations: z.boolean(),
    shoppingStarted: z.boolean(),
    shoppingFinished: z.boolean(),
    shoppingListCreated: z.boolean(),
    shoppingListDeleted: z.boolean(),
    appUpdates: z.boolean(),
    newFeatures: z.boolean(),
    offersPromos: z.boolean(),
  })
  .openapi("NotificationPreferences");

export type NotificationPreferences = z.infer<
  typeof NotificationPreferencesSchema
>;

export const UpdateNotificationPreferencesBodySchema = z
  .object({
    silentMode: z.boolean().optional(),
    workspaceInvitations: z.boolean().optional(),
    shoppingStarted: z.boolean().optional(),
    shoppingFinished: z.boolean().optional(),
    shoppingListCreated: z.boolean().optional(),
    shoppingListDeleted: z.boolean().optional(),
    appUpdates: z.boolean().optional(),
    newFeatures: z.boolean().optional(),
    offersPromos: z.boolean().optional(),
  })
  .openapi("UpdateNotificationPreferencesBody");

export const RegisterPushDeviceBodySchema = z
  .object({
    expoToken: z.string().min(1),
    platform: z.enum(["ios", "android", "web"]).optional(),
    appVersion: z.string().optional(),
  })
  .openapi("RegisterPushDeviceBody");

export const UnregisterPushDeviceBodySchema = z
  .object({
    expoToken: z.string().min(1),
  })
  .openapi("UnregisterPushDeviceBody");

export const StartShoppingSessionBodySchema = z
  .object({
    clientInstanceId: z.string().optional(),
    clientPlatform: z.enum(["ios", "android", "web"]).optional(),
  })
  .openapi("StartShoppingSessionBody");

export const StartShoppingSessionResponseSchema = z
  .object({
    id: z.string(),
    listId: z.string(),
    workspaceId: z.string(),
    startedAt: z.string().datetime(),
    resumed: z.boolean(),
  })
  .openapi("StartShoppingSessionResponse");

export const FinishShoppingSessionBodySchema = z
  .object({
    unavailableCount: z.number().int().nonnegative(),
  })
  .openapi("FinishShoppingSessionBody");

export const FinishShoppingSessionResponseSchema = z
  .object({
    id: z.string(),
    listId: z.string(),
    finishedAt: z.string().datetime(),
    alreadyFinished: z.boolean(),
  })
  .openapi("FinishShoppingSessionResponse");

export const NotifyShoppingFinishedResponseSchema = z
  .object({
    id: z.string(),
    listId: z.string(),
    notified: z.boolean(),
  })
  .openapi("NotifyShoppingFinishedResponse");
