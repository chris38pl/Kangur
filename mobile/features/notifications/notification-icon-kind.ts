import type { AppNotification } from "./schemas";

/**
 * Which Kangur drawing a row of the notification panel shows. Each kind has its own
 * picture in `assets/notifications/<kind>@2x.webp` and `@3x.webp`, cut from the drawing
 * the app shows after the notification is opened.
 */
export const NOTIFICATION_ICON_KINDS = [
  "shopping-started",
  "shopping-finished",
  "shopping-finished-missing",
  "workspace-invitation",
  "workspace-member-joined",
  "shopping-list-created",
  "shopping-list-deleted",
  "default",
] as const;

export type NotificationIconKind = (typeof NOTIFICATION_ICON_KINDS)[number];

/**
 * Tile colour per kind, the same in light and dark mode: the colour alone tells the
 * type apart. "Shopping finished" is green when everything was bought and violet when
 * something was missing.
 */
export const NOTIFICATION_TILE_COLORS: Record<NotificationIconKind, string> = {
  "shopping-started": "#9FE0D0",
  "shopping-finished": "#B4DE9C",
  "shopping-finished-missing": "#C5B4E8",
  "workspace-invitation": "#F0D078",
  "workspace-member-joined": "#EEB4D8",
  "shopping-list-created": "#9BC4E8",
  "shopping-list-deleted": "#F0A8A0",
  default: "#D5DEE7",
};

/** Types this app does not know yet get the plain Kangur portrait. */
export function notificationIconKind(
  notification: Pick<AppNotification, "type" | "payload">,
): NotificationIconKind {
  switch (notification.type) {
    case "SHOPPING_STARTED":
      return "shopping-started";
    case "SHOPPING_FINISHED":
      // Same rule as the summary screen: "missing" means products marked unavailable.
      return unavailableCount(notification.payload) > 0
        ? "shopping-finished-missing"
        : "shopping-finished";
    case "WORKSPACE_INVITATION":
      return "workspace-invitation";
    case "WORKSPACE_MEMBER_JOINED":
      return "workspace-member-joined";
    case "SHOPPING_LIST_CREATED":
      return "shopping-list-created";
    case "SHOPPING_LIST_DELETED":
      return "shopping-list-deleted";
    default:
      return "default";
  }
}

function unavailableCount(payload: unknown): number {
  if (payload === null || typeof payload !== "object") return 0;
  const value = (payload as { unavailableCount?: unknown }).unavailableCount;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
