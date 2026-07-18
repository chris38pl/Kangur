import { apiFetch } from "@/lib/api/client";

import {
  NotificationListSchema,
  NotificationPreferencesSchema,
  ShoppingSessionSchema,
  type AppNotification,
  type NotificationPreferences,
} from "./schemas";

export async function listNotifications(
  token: string,
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const data = await apiFetch<unknown>("/api/v1/notifications", { token });
  return NotificationListSchema.parse(data);
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<void> {
  await apiFetch(`/api/v1/notifications/${notificationId}/read`, {
    token,
    method: "POST",
  });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await apiFetch("/api/v1/notifications/read-all", {
    token,
    method: "POST",
  });
}

export async function getNotificationPreferences(
  token: string,
): Promise<NotificationPreferences> {
  const data = await apiFetch<unknown>("/api/v1/me/notification-preferences", {
    token,
  });
  return NotificationPreferencesSchema.parse(data);
}

export async function updateNotificationPreferences(
  token: string,
  body: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const data = await apiFetch<unknown>("/api/v1/me/notification-preferences", {
    token,
    method: "PATCH",
    body,
  });
  return NotificationPreferencesSchema.parse(data);
}

export async function registerPushDevice(
  token: string,
  body: {
    expoToken: string;
    platform?: "ios" | "android" | "web";
    appVersion?: string;
  },
): Promise<void> {
  await apiFetch("/api/v1/me/push-devices", {
    token,
    method: "POST",
    body,
  });
}

export async function startShoppingSession(
  token: string,
  listId: string,
  body?: {
    clientInstanceId?: string;
    clientPlatform?: "ios" | "android" | "web";
  },
): Promise<{ id: string; listId: string; workspaceId: string; startedAt: string; resumed?: boolean }> {
  const data = await apiFetch<unknown>(`/api/v1/lists/${listId}/sessions`, {
    token,
    method: "POST",
    body: body ?? {},
  });
  return ShoppingSessionSchema.parse(data);
}

export async function finishShoppingSession(
  token: string,
  listId: string,
  sessionId: string,
  unavailableCount: number,
): Promise<void> {
  await apiFetch(`/api/v1/lists/${listId}/sessions/${sessionId}/finish`, {
    token,
    method: "POST",
    body: { unavailableCount },
  });
}

/** Notify workspace members that shopping finished — does not archive the list. */
export async function notifyShoppingFinished(
  token: string,
  listId: string,
  sessionId: string,
  unavailableCount: number,
): Promise<void> {
  await apiFetch(
    `/api/v1/lists/${listId}/sessions/${sessionId}/notify-finished`,
    {
      token,
      method: "POST",
      body: { unavailableCount },
    },
  );
}
