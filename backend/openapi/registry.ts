import { z } from "zod";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";

import { ApiErrorSchema, MeResponseSchema } from "@/features/auth/schemas";
import {
  AiIngestResponseSchema,
  ApplyAiProposalBodySchema,
  ApplyAiProposalResponseSchema,
} from "@/features/ai/schemas";
import {
  CreateShoppingListBodySchema,
  ShoppingListDTOSchema,
  ShoppingListListResponseSchema,
  UpdateShoppingListBodySchema,
} from "@/features/shopping-list/schemas";
import {
  CreateShoppingItemBodySchema,
  ShoppingEventListResponseSchema,
  ShoppingItemDTOSchema,
  ShoppingItemListResponseSchema,
  UpdateShoppingItemBodySchema,
} from "@/features/shopping-item/schemas";
import { AiCreditsBalanceSchema } from "@/features/billing/schemas";
import {
  AcceptInvitationBodySchema,
  AcceptInvitationResponseSchema,
  CreateInvitationBodySchema,
  CreateWorkspaceBodySchema,
  InvitationListResponseSchema,
  InvitationPreviewQuerySchema,
  InvitationPreviewResponseSchema,
  InviteMemberResultSchema,
  UpdateMemberRoleBodySchema,
  UpdateWorkspaceBodySchema,
  WorkspaceDTOSchema,
  WorkspaceListResponseSchema,
  WorkspaceMemberListResponseSchema,
} from "@/features/workspace/schemas";
import {
  FinishShoppingSessionBodySchema,
  FinishShoppingSessionResponseSchema,
  NotifyShoppingFinishedResponseSchema,
  NotificationListResponseSchema,
  NotificationPreferencesSchema,
  RegisterPushDeviceBodySchema,
  StartShoppingSessionBodySchema,
  StartShoppingSessionResponseSchema,
  UnregisterPushDeviceBodySchema,
  UpdateNotificationPreferencesBodySchema,
} from "@/features/notifications/schemas";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export const HealthResponseSchema = z
  .object({
    status: z.literal("ok"),
    timestamp: z.string().datetime(),
  })
  .openapi("HealthResponse");

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Health check",
  tags: ["System"],
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/me",
  summary: "Current authenticated user",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Authenticated user (upserted, idempotent except updatedAt)",
      content: {
        "application/json": {
          schema: MeResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces",
  summary: "List workspaces for the current user",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Memberships with role, memberCount, plan",
      content: {
        "application/json": {
          schema: WorkspaceListResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces",
  summary: "Create a workspace",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateWorkspaceBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created workspace (caller is owner)",
      content: {
        "application/json": {
          schema: WorkspaceDTOSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}",
  summary: "Get a workspace by id",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Workspace DTO for members",
      content: {
        "application/json": {
          schema: WorkspaceDTOSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/workspaces/{workspaceId}",
  summary: "Update workspace name and/or icon",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateWorkspaceBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated workspace",
      content: {
        "application/json": {
          schema: WorkspaceDTOSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/members",
  summary: "List members of a workspace",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Workspace members",
      content: {
        "application/json": {
          schema: WorkspaceMemberListResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/workspaces/{workspaceId}/members/{userId}",
  summary: "Remove a workspace member",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
      userId: z.string(),
    }),
  },
  responses: {
    204: { description: "Member removed" },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/workspaces/{workspaceId}/members/{userId}",
  summary: "Update a workspace member role",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
      userId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateMemberRoleBodySchema,
        },
      },
    },
  },
  responses: {
    204: { description: "Role updated" },
    400: {
      description: "Validation error",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/invitations",
  summary: "List pending workspace invitations",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Pending invitations",
      content: {
        "application/json": {
          schema: InvitationListResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/invitations",
  summary: "Create or resend a workspace invitation",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateInvitationBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Invitation created or resent",
      content: {
        "application/json": {
          schema: InviteMemberResultSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    409: {
      description: "Already a member",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/workspaces/{workspaceId}/invitations/{invitationId}",
  summary: "Revoke a pending invitation",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
      invitationId: z.string(),
    }),
  },
  responses: {
    204: { description: "Invitation revoked" },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/invitations/accept",
  summary: "Accept a workspace invitation by token",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AcceptInvitationBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invitation accepted",
      content: {
        "application/json": {
          schema: AcceptInvitationResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Email mismatch",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    404: {
      description: "Expired or revoked",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    409: {
      description: "Already accepted / already member",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/invitations/preview",
  summary: "Preview a workspace invitation by token (no accept)",
  tags: ["Workspaces"],
  security: [{ bearerAuth: [] }],
  request: {
    query: InvitationPreviewQuerySchema,
  },
  responses: {
    200: {
      description: "Invitation preview",
      content: {
        "application/json": {
          schema: InvitationPreviewResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    403: {
      description: "Email mismatch",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
    404: {
      description: "Expired or revoked",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/notifications",
  summary: "List notifications for the current user",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Notifications",
      content: {
        "application/json": { schema: NotificationListResponseSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/notifications/{notificationId}/read",
  summary: "Mark a notification as read",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ notificationId: z.string() }),
  },
  responses: {
    204: { description: "Marked read" },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/notifications/read-all",
  summary: "Mark all notifications as read",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "All marked read" },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/me/notification-preferences",
  summary: "Get notification preferences",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Preferences",
      content: {
        "application/json": { schema: NotificationPreferencesSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/me/notification-preferences",
  summary: "Update notification preferences",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateNotificationPreferencesBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated preferences",
      content: {
        "application/json": { schema: NotificationPreferencesSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/me/push-devices",
  summary: "Register Expo push token",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: RegisterPushDeviceBodySchema },
      },
    },
  },
  responses: {
    204: { description: "Registered" },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/me/push-devices",
  summary: "Unregister Expo push token",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: UnregisterPushDeviceBodySchema },
      },
    },
  },
  responses: {
    204: { description: "Unregistered" },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/lists/{listId}/sessions",
  summary: "Start a shopping session",
  tags: ["Shopping Sessions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ listId: z.string() }),
    body: {
      content: {
        "application/json": { schema: StartShoppingSessionBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Session started or resumed",
      content: {
        "application/json": { schema: StartShoppingSessionResponseSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/lists/{listId}/sessions/{sessionId}/notify-finished",
  summary:
    "Notify workspace that shopping finished (no archive — used on summary screen)",
  tags: ["Shopping Sessions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ listId: z.string(), sessionId: z.string() }),
    body: {
      content: {
        "application/json": { schema: FinishShoppingSessionBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Workspace members notified",
      content: {
        "application/json": { schema: NotifyShoppingFinishedResponseSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/lists/{listId}/sessions/{sessionId}/finish",
  summary: "Finish a shopping session and archive the list",
  tags: ["Shopping Sessions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ listId: z.string(), sessionId: z.string() }),
    body: {
      content: {
        "application/json": { schema: FinishShoppingSessionBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Session finished",
      content: {
        "application/json": { schema: FinishShoppingSessionResponseSchema },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": { schema: ApiErrorSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/lists",
  summary: "List active shopping lists for a workspace",
  tags: ["Shopping Lists"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Active shopping lists for the workspace",
      content: {
        "application/json": {
          schema: ShoppingListListResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/lists",
  summary: "Create a shopping list",
  tags: ["Shopping Lists"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateShoppingListBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created shopping list",
      content: {
        "application/json": {
          schema: ShoppingListDTOSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/lists/{listId}",
  summary: "Get a shopping list by id",
  tags: ["Shopping Lists"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Shopping list DTO",
      content: {
        "application/json": {
          schema: ShoppingListDTOSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/lists/{listId}",
  summary: "Update a shopping list",
  tags: ["Shopping Lists"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateShoppingListBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated shopping list",
      content: {
        "application/json": {
          schema: ShoppingListDTOSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/lists/{listId}",
  summary: "Archive a shopping list",
  tags: ["Shopping Lists"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Shopping list archived",
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/lists/{listId}/items",
  summary: "List shopping items for a list",
  tags: ["Shopping Items"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Shopping items for the list",
      content: {
        "application/json": {
          schema: ShoppingItemListResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/lists/{listId}/items",
  summary: "Create a shopping item",
  tags: ["Shopping Items"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateShoppingItemBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created shopping item",
      content: {
        "application/json": {
          schema: ShoppingItemDTOSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    409: {
      description: "Client id conflict",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/items/{itemId}",
  summary: "Update a shopping item",
  tags: ["Shopping Items"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      itemId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateShoppingItemBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated shopping item",
      content: {
        "application/json": {
          schema: ShoppingItemDTOSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    409: {
      description: "Client id conflict",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/lists/{listId}/events",
  summary: "List shopping events after a cursor",
  tags: ["Shopping Events"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
    query: z.object({
      after: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Shopping events page",
      content: {
        "application/json": {
          schema: ShoppingEventListResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/ai-credits",
  summary: "Get AI Credits balance for a workspace",
  tags: ["Billing"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      workspaceId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "AI Credits balance",
      content: {
        "application/json": {
          schema: AiCreditsBalanceSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/lists/{listId}/ai/ingest",
  summary: "Create an AI proposal from text, clipboard, or screenshot",
  tags: ["AI"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "AI proposal created",
      content: {
        "application/json": {
          schema: AiIngestResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    402: {
      description: "Insufficient AI Credits",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/lists/{listId}/ai/apply",
  summary: "Apply reviewed AI operations to a list",
  tags: ["AI"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      listId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: ApplyAiProposalBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Applied AI operations",
      content: {
        "application/json": {
          schema: ApplyAiProposalResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
    404: {
      description: "Not found or not a member",
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Kangur Platform API",
      version: "0.3.0",
      description:
        "AUTO-GENERATED from Zod via openapi:generate. Do not hand-edit.",
    },
    servers: [{ url: "/" }],
  });
}
