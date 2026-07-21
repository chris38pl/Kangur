import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, typography } from "@/design-system/tokens";

const MIN_POINTS_FOR_TREND = 2;

type Props = {
  /** Rolling samples (oldest → newest). Empty / single → placeholder. */
  values: number[];
  color: string;
  height?: number;
  /** Shown when not enough real samples (no fake data). */
  emptyLabel?: string;
};

type Point = { x: number; y: number };

/**
 * Tiny trend for KPI cards - pure RN Views (no native SVG).
 * Soft area + stroked line segments. No axes / interaction.
 */
export function Sparkline({
  values,
  color,
  height = 36,
  emptyLabel,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const [width, setWidth] = useState(0);

  const norms = useMemo(() => {
    const usable = values.filter((v) => Number.isFinite(v));
    if (usable.length < MIN_POINTS_FOR_TREND) return null;
    const min = Math.min(...usable);
    const max = Math.max(...usable);
    const span = max - min || 1;
    return usable.map((v) => (v - min) / span);
  }, [values]);

  const segments = useMemo(() => {
    if (!norms || width <= 0) return [] as [Point, Point][];
    const padY = 3;
    const innerH = height - padY * 2;
    const stepX = width / (norms.length - 1);
    const points: Point[] = norms.map((n, i) => ({
      x: i * stepX,
      y: padY + innerH - n * innerH,
    }));
    const pairs: [Point, Point][] = [];
    for (let i = 0; i < points.length - 1; i++) {
      pairs.push([points[i], points[i + 1]]);
    }
    return pairs;
  }, [norms, width, height]);

  if (!norms) {
    return (
      <View style={{ height, width: "100%", justifyContent: "center" }}>
        <View
          style={{
            height: 1,
            backgroundColor: theme.border,
            width: "100%",
            marginBottom: emptyLabel ? 4 : 0,
          }}
        />
        {emptyLabel ? (
          <Text
            style={{
              ...typography.caption,
              fontSize: 10,
              lineHeight: 12,
              color: theme.textMuted,
            }}
          >
            {emptyLabel}
          </Text>
        ) : null}
      </View>
    );
  }

  const padY = 3;
  const innerH = height - padY * 2;

  return (
    <View
      style={{ height, width: "100%", overflow: "hidden" }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: padY,
          bottom: 0,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 1,
        }}
      >
        {norms.map((n, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: Math.max(2, n * innerH),
              backgroundColor: color,
              opacity: 0.14,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          />
        ))}
      </View>

      {segments.map(([a, b], i) => (
        <LineSegment
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          color={color}
        />
      ))}
    </View>
  );
}

function LineSegment({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;
  const angle = Math.atan2(dy, dx);
  const stroke = 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - stroke / 2,
        width: length,
        height: stroke,
        backgroundColor: color,
        borderRadius: stroke,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}
