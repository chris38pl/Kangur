import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "./api";
import type { NotificationPreferences } from "./schemas";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const NOTIFICATION_PREFS_QUERY_KEY = ["notification-preferences"] as const;

export function useNotifications(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    enabled: enabled && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return listNotifications(token);
    },
  });
}

export function useMarkNotificationRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await markNotificationRead(token, notificationId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await markAllNotificationsRead(token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useNotificationPreferences(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: NOTIFICATION_PREFS_QUERY_KEY,
    enabled: enabled && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return getNotificationPreferences(token);
    },
  });
}

export function useUpdateNotificationPreferences() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<NotificationPreferences>) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return updateNotificationPreferences(token, body);
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_PREFS_QUERY_KEY,
      });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        NOTIFICATION_PREFS_QUERY_KEY,
      );
      if (previous) {
        queryClient.setQueryData(NOTIFICATION_PREFS_QUERY_KEY, {
          ...previous,
          ...body,
        });
      }
      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          NOTIFICATION_PREFS_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(NOTIFICATION_PREFS_QUERY_KEY, data);
    },
  });
}
