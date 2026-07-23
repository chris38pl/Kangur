import { useRouter } from "expo-router";

import { goRoot } from "@/lib/navigation";

import type { AppNotification } from "./schemas";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Idempotent navigation from notification taps.
 * Prefer replace to avoid stacking Home/Shopping duplicates.
 * Informational types (WORKSPACE) mark-read only - no dedicated screen.
 */
export function navigateFromNotification(
  router: AppRouter,
  notification: AppNotification,
): void {
  const payload = (notification.payload ?? {}) as Record<string, unknown>;

  switch (notification.payloadType) {
    case "INVITE": {
      const invitationId =
        typeof payload.invitationId === "string" ? payload.invitationId : null;
      if (invitationId) {
        const q = new URLSearchParams({ notificationId: notification.id });
        router.replace(
          `/invite/id/${invitationId}?${q.toString()}` as never,
        );
      } else {
        router.replace("/(tabs)/workspace" as never);
      }
      return;
    }
    case "SHOPPING": {
      const listId = typeof payload.listId === "string" ? payload.listId : null;
      if (!listId) {
        goRoot();
        return;
      }
      if (payload.screen === "finish") {
        const q = new URLSearchParams({ notificationId: notification.id });
        router.replace(
          `/notification/shopping-finished?${q.toString()}` as never,
        );
        return;
      }
      const q = new URLSearchParams({ notificationId: notification.id });
      router.replace(
        `/notification/shopping-started?${q.toString()}` as never,
      );
      return;
    }
    case "LIST": {
      const q = new URLSearchParams({ notificationId: notification.id });
      router.replace(`/notification/list-created?${q.toString()}` as never);
      return;
    }
    case "WORKSPACE":
      // List deleted (and similar) - no detail screen.
      return;
    default:
      goRoot();
  }
}

export function iconForNotification(notification: AppNotification): string {
  switch (notification.type) {
    case "WORKSPACE_INVITATION":
      return "👤";
    case "SHOPPING_STARTED":
      return "🛒";
    case "SHOPPING_FINISHED":
      return "📋";
    case "SHOPPING_LIST_CREATED":
      return "📝";
    case "SHOPPING_LIST_DELETED":
      return "🗑️";
    default:
      return "🔔";
  }
}
