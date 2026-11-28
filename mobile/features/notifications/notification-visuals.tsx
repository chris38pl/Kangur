import { Image, type ImageSourcePropType, View } from "react-native";

import { radius } from "@/design-system/tokens";

import {
  NOTIFICATION_TILE_COLORS,
  notificationIconKind,
  type NotificationIconKind,
} from "./notification-icon-kind";
import type { AppNotification } from "./schemas";

/** The coloured tile, the same size as before. */
export const NOTIFICATION_TILE_SIZE = 44;
/** How far the Kangur's ears and head reach above the tile. */
export const NOTIFICATION_ICON_OVERHANG = 12;

/**
 * Cut from the app's own Kangur drawings: head and body with a prop, a white outline,
 * the bottom corners rounded like the tile. Each file is 44×56 pt in @2x and @3x.
 */
const ICONS: Record<NotificationIconKind, ImageSourcePropType> = {
  "shopping-started": require("@/assets/notifications/shopping-started.webp"),
  "shopping-finished": require("@/assets/notifications/shopping-finished.webp"),
  "shopping-finished-missing": require("@/assets/notifications/shopping-finished-missing.webp"),
  "workspace-invitation": require("@/assets/notifications/workspace-invitation.webp"),
  "workspace-member-joined": require("@/assets/notifications/workspace-member-joined.webp"),
  "shopping-list-created": require("@/assets/notifications/shopping-list-created.webp"),
  "shopping-list-deleted": require("@/assets/notifications/shopping-list-deleted.webp"),
  default: require("@/assets/notifications/default.webp"),
};

/**
 * Kangur on a pastel tile. The tile colour tells the type apart at a glance, the
 * drawing shows what happened, and the Kangur's head sticks out above the tile.
 */
export function NotificationTypeIcon({
  notification,
}: {
  notification: AppNotification;
}) {
  const kind = notificationIconKind(notification);
  const height = NOTIFICATION_TILE_SIZE + NOTIFICATION_ICON_OVERHANG;

  return (
    <View
      style={{ width: NOTIFICATION_TILE_SIZE, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: NOTIFICATION_ICON_OVERHANG,
          width: NOTIFICATION_TILE_SIZE,
          height: NOTIFICATION_TILE_SIZE,
          borderRadius: radius.sm,
          backgroundColor: NOTIFICATION_TILE_COLORS[kind],
        }}
      />
      <Image
        source={ICONS[kind]}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: NOTIFICATION_TILE_SIZE,
          height,
        }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
