import { View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

type IconProps = {
  color: string;
  size?: number;
};

const STROKE = 1.7;

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
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProfileIconPerson({ color, size = 22 }: IconProps) {
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
          width: size * 0.52,
          height: size * 0.3,
          borderWidth: STROKE,
          borderColor: color,
          borderTopLeftRadius: size * 0.26,
          borderTopRightRadius: size * 0.26,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
    </Box>
  );
}

export function ProfileIconPeople({ color, size = 22 }: IconProps) {
  const head = size * 0.2;
  return (
    <Box size={size}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: head,
              height: head,
              borderRadius: head / 2,
              borderWidth: STROKE,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          <View
            style={{
              width: size * 0.34,
              height: size * 0.22,
              borderWidth: STROKE,
              borderColor: color,
              borderTopLeftRadius: size * 0.16,
              borderTopRightRadius: size * 0.16,
              borderBottomLeftRadius: 1,
              borderBottomRightRadius: 1,
            }}
          />
        </View>
        <View style={{ alignItems: "center", marginBottom: 1 }}>
          <View
            style={{
              width: head * 0.9,
              height: head * 0.9,
              borderRadius: head / 2,
              borderWidth: STROKE,
              borderColor: color,
              marginBottom: 2,
              opacity: 0.85,
            }}
          />
          <View
            style={{
              width: size * 0.28,
              height: size * 0.18,
              borderWidth: STROKE,
              borderColor: color,
              borderTopLeftRadius: size * 0.14,
              borderTopRightRadius: size * 0.14,
              borderBottomLeftRadius: 1,
              borderBottomRightRadius: 1,
              opacity: 0.85,
            }}
          />
        </View>
      </View>
    </Box>
  );
}

export function ProfileIconCard({ color, size = 22 }: IconProps) {
  const w = size * 0.72;
  const h = size * 0.48;
  return (
    <Box size={size}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            marginTop: h * 0.28,
            height: STROKE + 1.5,
            width: "100%",
            backgroundColor: color,
          }}
        />
        <View
          style={{
            marginTop: 4,
            marginLeft: 4,
            height: STROKE,
            width: "40%",
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconBell({ color, size = 22 }: IconProps) {
  const bodyW = size * 0.48;
  const bodyH = size * 0.4;
  return (
    <Box size={size}>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: size * 0.12,
            height: size * 0.08,
            borderRadius: size * 0.06,
            backgroundColor: color,
            marginBottom: 1,
          }}
        />
        <View
          style={{
            width: bodyW,
            height: bodyH,
            borderTopLeftRadius: bodyW / 2,
            borderTopRightRadius: bodyW / 2,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            borderWidth: STROKE,
            borderColor: color,
          }}
        />
        <View
          style={{
            width: bodyW * 1.15,
            height: Math.max(2, size * 0.07),
            borderRadius: 2,
            backgroundColor: color,
            marginTop: -1,
          }}
        />
        <View
          style={{
            width: size * 0.14,
            height: size * 0.08,
            borderBottomLeftRadius: size * 0.08,
            borderBottomRightRadius: size * 0.08,
            backgroundColor: color,
            marginTop: 2,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconShield({ color, size = 22 }: IconProps) {
  const w = size * 0.52;
  const h = size * 0.62;
  return (
    <Box size={size}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: STROKE,
          borderColor: color,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderBottomLeftRadius: w / 2,
          borderBottomRightRadius: w / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size * 0.12,
            height: size * 0.18,
            borderRightWidth: STROKE,
            borderBottomWidth: STROKE,
            borderColor: color,
            transform: [{ rotate: "45deg" }],
            marginTop: -2,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconGlobe({ color, size = 22 }: IconProps) {
  const d = size * 0.68;
  return (
    <Box size={size}>
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          borderWidth: STROKE,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: d * 0.42,
            height: d,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: d,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: d,
            height: STROKE,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: d * 0.28,
            width: d * 0.85,
            height: STROKE,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: d * 0.28,
            width: d * 0.85,
            height: STROKE,
            backgroundColor: color,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconPalette({ color, size = 22 }: IconProps) {
  const d = size * 0.7;
  return (
    <Box size={size}>
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          borderWidth: STROKE,
          borderColor: color,
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: 3,
        }}
      >
        <View
          style={{
            width: d * 0.28,
            height: d * 0.28,
            borderRadius: d * 0.14,
            borderWidth: STROKE,
            borderColor: color,
            marginRight: 2,
            marginBottom: 2,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: d * 0.18,
            left: d * 0.22,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: d * 0.18,
            right: d * 0.22,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: d * 0.38,
            left: d * 0.16,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconHelp({ color, size = 22 }: IconProps) {
  const d = size * 0.68;
  return (
    <Box size={size}>
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          borderWidth: STROKE,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: d * 0.28,
            height: d * 0.28,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: d * 0.14,
            borderBottomColor: "transparent",
            marginBottom: 1,
            transform: [{ rotate: "-40deg" }],
          }}
        />
        <View
          style={{
            width: STROKE + 0.5,
            height: d * 0.12,
            backgroundColor: color,
            borderRadius: 1,
            marginTop: 1,
          }}
        />
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: color,
            marginTop: 2,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconInfo({ color, size = 22 }: IconProps) {
  const d = size * 0.68;
  return (
    <Box size={size}>
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          borderWidth: STROKE,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: color,
            marginBottom: 2,
          }}
        />
        <View
          style={{
            width: STROKE + 0.5,
            height: d * 0.28,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </Box>
  );
}

export function ProfileIconList({ color, size = 22 }: IconProps) {
  const w = size * 0.58;
  const h = size * 0.68;
  return (
    <Box size={size}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 3,
          paddingHorizontal: 3,
          paddingTop: 4,
          gap: 3,
        }}
      >
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

/** House — recognizable for spaces / workspaces. */
export function ProfileIconHome({ color, size = 22 }: IconProps) {
  const w = size * 0.72;
  const h = size * 0.58;
  return (
    <Box size={size}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: w * 0.52,
          borderRightWidth: w * 0.52,
          borderBottomWidth: size * 0.3,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: w * 0.72,
          height: h * 0.68,
          borderWidth: STROKE,
          borderColor: color,
          borderTopWidth: 0,
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
            height: h * 0.34,
            borderWidth: STROKE,
            borderColor: color,
            borderBottomWidth: 0,
            borderTopLeftRadius: 1,
            borderTopRightRadius: 1,
          }}
        />
      </View>
    </Box>
  );
}

/** Shopping bag — recognizable for products. */
export function ProfileIconBag({ color, size = 22 }: IconProps) {
  const w = size * 0.58;
  const h = size * 0.52;
  const handle = size * 0.28;
  return (
    <Box size={size}>
      <View
        style={{
          width: handle,
          height: handle * 0.55,
          borderWidth: STROKE,
          borderColor: color,
          borderBottomWidth: 0,
          borderTopLeftRadius: handle,
          borderTopRightRadius: handle,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: w,
          height: h,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        }}
      />
    </Box>
  );
}

export function ProfileIconStar({ color, size = 22 }: IconProps) {
  const arm = size * 0.18;
  const thick = Math.max(2, size * 0.1);
  return (
    <Box size={size}>
      <View
        style={{
          width: size * 0.55,
          height: size * 0.55,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 3,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: arm,
          height: thick,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: thick,
          height: arm,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </Box>
  );
}

export function ProfileIconCrown({ color, size = 14 }: IconProps) {
  const w = size * 0.9;
  return (
    <Box size={size}>
      <View
        style={{
          width: w,
          height: size * 0.55,
          borderWidth: STROKE,
          borderColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          borderTopWidth: 0,
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -size * 0.22,
            flexDirection: "row",
            gap: size * 0.08,
          }}
        >
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 3,
              borderRightWidth: 3,
              borderBottomWidth: size * 0.28,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: color,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 3.5,
              borderRightWidth: 3.5,
              borderBottomWidth: size * 0.34,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: color,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 3,
              borderRightWidth: 3,
              borderBottomWidth: size * 0.28,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: color,
            }}
          />
        </View>
      </View>
    </Box>
  );
}

export function ProfileIconChevronRight({ color, size = 18 }: IconProps) {
  const s = size * 0.38;
  return (
    <Box size={size}>
      <View
        style={{
          width: s,
          height: s,
          borderTopWidth: STROKE + 0.3,
          borderRightWidth: STROKE + 0.3,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
          marginLeft: -2,
        }}
      />
    </Box>
  );
}

export function ProfileIconLogout({ color, size = 20 }: IconProps) {
  const box = size * 0.42;
  return (
    <Box size={size}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <View
          style={{
            width: box,
            height: size * 0.62,
            borderWidth: STROKE,
            borderColor: color,
            borderRadius: 2,
            borderRightWidth: 0,
          }}
        />
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: size * 0.28,
              height: STROKE + 0.4,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              right: -1,
              width: 0,
              height: 0,
              borderTopWidth: 4,
              borderBottomWidth: 4,
              borderLeftWidth: 5,
              borderTopColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: color,
            }}
          />
        </View>
      </View>
    </Box>
  );
}

/** Small camera mark for avatar edit badge. */
export function ProfileIconCamera({ color, size = 16 }: IconProps) {
  const bodyW = size * 0.72;
  const bodyH = size * 0.5;
  return (
    <Box size={size}>
      <View
        style={{
          width: size * 0.28,
          height: size * 0.14,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: bodyW,
          height: bodyH,
          borderRadius: 3,
          borderWidth: STROKE,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            borderWidth: STROKE,
            borderColor: color,
          }}
        />
      </View>
    </Box>
  );
}
