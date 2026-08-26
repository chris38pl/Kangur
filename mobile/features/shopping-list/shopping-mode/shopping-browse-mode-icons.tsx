import { View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

type IconProps = {
  color: string;
  size?: number;
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

/** Grid of category cards (aisles shopping mode). */
export function BrowseModeAislesIcon({ color, size = 20 }: IconProps) {
  const gap = 2;
  const cell = (size - gap * 3) / 2;
  return (
    <Box size={size}>
      <View style={{ flexDirection: "row", gap, marginBottom: gap }}>
        <View
          style={{
            width: cell,
            height: cell,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: 2,
          }}
        />
        <View
          style={{
            width: cell,
            height: cell,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: 2,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap }}>
        <View
          style={{
            width: cell,
            height: cell,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: 2,
          }}
        />
        <View
          style={{
            width: cell,
            height: cell,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: 2,
          }}
        />
      </View>
    </Box>
  );
}

/** Flat list lines (list shopping mode). */
export function BrowseModeListIcon({ color, size = 20 }: IconProps) {
  const w = size * 0.72;
  return (
    <Box size={size}>
      <View style={{ width: w, gap: size * 0.16 }}>
        <View
          style={{
            height: STROKE,
            width: "100%",
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            height: STROKE,
            width: "100%",
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            height: STROKE,
            width: "70%",
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </Box>
  );
}
