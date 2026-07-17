import { View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

type IconProps = {
  color: string;
  size?: number;
  /** Filled variant for the active tab (Home in the mock). */
  filled?: boolean;
};

const STROKE = 1.6;

function Box({
  size,
  style,
  children,
}: {
  size: number;
  style?: ViewStyle;
  children?: ReactNode;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Delicate house — filled when active. */
export function TabIconHome({ color, size = 24, filled }: IconProps) {
  const w = size * 0.72;
  const h = size * 0.58;
  return (
    <Box size={size}>
      {/* roof */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: w * 0.55,
          borderRightWidth: w * 0.55,
          borderBottomWidth: size * 0.28,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: w * 0.78,
          height: h * 0.72,
          borderWidth: STROKE,
          borderColor: color,
          borderTopWidth: 0,
          backgroundColor: filled ? color : "transparent",
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 2,
        }}
      >
        <View
          style={{
            width: w * 0.22,
            height: h * 0.32,
            borderWidth: STROKE,
            borderColor: filled ? "#fff" : color,
            borderBottomWidth: 0,
            borderTopLeftRadius: 1,
            borderTopRightRadius: 1,
            backgroundColor: filled ? "#fff" : "transparent",
          }}
        />
      </View>
    </Box>
  );
}

/** Delicate document / list lines. */
export function TabIconLists({ color, size = 24 }: IconProps) {
  const w = size * 0.58;
  const h = size * 0.72;
  return (
    <Box size={size}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 3,
          paddingHorizontal: 4,
          paddingTop: 5,
          gap: 3.5,
        }}
      >
        <View
          style={{ height: STROKE, width: "100%", backgroundColor: color, borderRadius: 1 }}
        />
        <View
          style={{ height: STROKE, width: "100%", backgroundColor: color, borderRadius: 1 }}
        />
        <View
          style={{ height: STROKE, width: "70%", backgroundColor: color, borderRadius: 1 }}
        />
      </View>
    </Box>
  );
}

/** Delicate archive box with arrow-down lid. */
export function TabIconArchive({ color, size = 24 }: IconProps) {
  const w = size * 0.7;
  return (
    <Box size={size}>
      {/* lid */}
      <View
        style={{
          width: w,
          height: size * 0.16,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 2,
          marginBottom: 2,
        }}
      />
      {/* box */}
      <View
        style={{
          width: w * 0.88,
          height: size * 0.42,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* arrow down */}
        <View
          style={{
            width: STROKE,
            height: size * 0.14,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            marginTop: -1,
            borderLeftWidth: 4,
            borderRightWidth: 4,
            borderTopWidth: 5,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: color,
          }}
        />
      </View>
    </Box>
  );
}

/** Delicate person silhouette (outline). */
export function TabIconProfile({ color, size = 24 }: IconProps) {
  const head = size * 0.28;
  return (
    <Box size={size}>
      <View
        style={{
          width: head,
          height: head,
          borderRadius: head / 2,
          borderWidth: STROKE,
          borderColor: color,
          marginBottom: 3,
        }}
      />
      <View
        style={{
          width: size * 0.55,
          height: size * 0.32,
          borderWidth: STROKE,
          borderColor: color,
          borderTopLeftRadius: size * 0.28,
          borderTopRightRadius: size * 0.28,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          borderBottomWidth: STROKE,
        }}
      />
    </Box>
  );
}

/** White plus for the center FAB. */
export function TabIconPlus({ color = "#FFFFFF", size = 26 }: IconProps) {
  const arm = size * 0.55;
  const thick = Math.max(2.2, size * 0.08);
  return (
    <Box size={size}>
      <View
        style={{
          position: "absolute",
          width: arm,
          height: thick,
          backgroundColor: color,
          borderRadius: thick,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: thick,
          height: arm,
          backgroundColor: color,
          borderRadius: thick,
        }}
      />
    </Box>
  );
}
