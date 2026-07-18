import { View } from "react-native";

import type { AppNotification } from "./schemas";

export type NotificationVisual = {
  background: string;
  iconColor: string;
  kind: "cart" | "clipboard" | "invite" | "list";
};

/** Soft pastel tiles + white glyphs (notification center mock). */
export function visualForNotification(
  notification: AppNotification,
): NotificationVisual {
  switch (notification.type) {
    case "SHOPPING_STARTED":
      return { background: "#9FE0D0", iconColor: "#FFFFFF", kind: "cart" };
    case "SHOPPING_FINISHED": {
      const payload = (notification.payload ?? {}) as {
        unavailableCount?: unknown;
      };
      const unavailable =
        typeof payload.unavailableCount === "number"
          ? payload.unavailableCount
          : 0;
      if (unavailable > 0) {
        return {
          background: "#C5B4E8",
          iconColor: "#FFFFFF",
          kind: "clipboard",
        };
      }
      return { background: "#9FE0D0", iconColor: "#FFFFFF", kind: "cart" };
    }
    case "WORKSPACE_INVITATION":
      return { background: "#F0D078", iconColor: "#FFFFFF", kind: "invite" };
    case "SHOPPING_LIST_CREATED":
      return { background: "#9BC4E8", iconColor: "#FFFFFF", kind: "list" };
    case "SHOPPING_LIST_DELETED":
      return { background: "#F0A8A0", iconColor: "#FFFFFF", kind: "list" };
    default:
      return { background: "#9FE0D0", iconColor: "#FFFFFF", kind: "cart" };
  }
}

export function NotificationTypeIcon({
  kind,
  color,
  size = 22,
}: {
  kind: NotificationVisual["kind"];
  color: string;
  size?: number;
}) {
  switch (kind) {
    case "cart":
      return <CartIcon color={color} size={size} />;
    case "clipboard":
      return <ClipboardIcon color={color} size={size} />;
    case "invite":
      return <InviteIcon color={color} size={size} />;
    case "list":
      return <ListIcon color={color} size={size} />;
  }
}

function CartIcon({ color, size }: { color: string; size: number }) {
  const stroke = Math.max(1.6, size * 0.09);
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.42,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 3,
          marginTop: size * 0.22,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          left: size * 0.12,
          width: size * 0.28,
          height: size * 0.22,
          borderLeftWidth: stroke,
          borderTopWidth: stroke,
          borderColor: color,
          borderTopLeftRadius: 4,
          transform: [{ rotate: "-18deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: size * 0.22,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: size * 0.18,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function ClipboardIcon({ color, size }: { color: string; size: number }) {
  const stroke = Math.max(1.6, size * 0.09);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.55,
          height: size * 0.7,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 3,
          alignItems: "center",
          paddingTop: size * 0.18,
          gap: size * 0.08,
        }}
      >
        <View
          style={{
            width: size * 0.28,
            height: stroke,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            width: size * 0.28,
            height: stroke,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: size * 0.06,
          width: size * 0.28,
          height: size * 0.14,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function InviteIcon({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: color,
          marginBottom: 2,
          marginRight: size * 0.12,
        }}
      />
      <View
        style={{
          width: size * 0.42,
          height: size * 0.28,
          borderTopLeftRadius: size * 0.22,
          borderTopRightRadius: size * 0.22,
          backgroundColor: color,
          marginRight: size * 0.12,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: size * 0.08,
          top: size * 0.28,
          width: size * 0.28,
          height: size * 0.28,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: size * 0.2,
            height: Math.max(2, size * 0.08),
            borderRadius: 1,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: Math.max(2, size * 0.08),
            height: size * 0.2,
            borderRadius: 1,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function ListIcon({ color, size }: { color: string; size: number }) {
  const stroke = Math.max(1.8, size * 0.09);
  const row = (y: number) => (
    <View
      key={y}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: size * 0.1,
        marginTop: y === 0 ? 0 : size * 0.12,
      }}
    >
      <View
        style={{
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.42,
          height: stroke,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {row(0)}
      {row(1)}
      {row(2)}
    </View>
  );
}
