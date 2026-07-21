import { getShoppingCategoryIcon } from "@shared/shopping-categories";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
import type { SuggestFromHistoryItem } from "@/features/ai/schemas";

export type SuggestBucket = "proposals" | "accepted" | "rejected";

type Props = {
  item: SuggestFromHistoryItem;
  bucket: SuggestBucket;
  onAccept: (item: SuggestFromHistoryItem) => void;
  onReject: (item: SuggestFromHistoryItem) => void;
  onRestore: (item: SuggestFromHistoryItem) => void;
  lastSeenLabel: string;
};

const COMMIT_DISTANCE = 56;
const COMMIT_DISTANCE_SLOW = 72;
const COMMIT_VELOCITY = 600;
const ACCEPT = "#2F9E6F";
const REJECT = "#D64545";

export function SuggestSwipeRow({
  item,
  bucket,
  onAccept,
  onReject,
  onRestore,
  lastSeenLabel,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = getCategoryBadgeColors(item.category);

  const translateX = useSharedValue(0);
  const measuredHeight = useSharedValue(72);
  const collapseHeight = useSharedValue(-1);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rowWidth = useSharedValue(320);

  const commitAccept = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept(item);
  }, [item, onAccept]);

  const commitReject = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReject(item);
  }, [item, onReject]);

  const commitRestore = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRestore(item);
  }, [item, onRestore]);

  const acceptRef = useRef(commitAccept);
  const rejectRef = useRef(commitReject);
  const restoreRef = useRef(commitRestore);

  useEffect(() => {
    acceptRef.current = commitAccept;
    rejectRef.current = commitReject;
    restoreRef.current = commitRestore;
  }, [commitAccept, commitReject, commitRestore]);

  const runAccept = useCallback(() => {
    acceptRef.current();
  }, []);
  const runReject = useCallback(() => {
    rejectRef.current();
  }, []);
  const runRestore = useCallback(() => {
    restoreRef.current();
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          "worklet";
          translateX.value = e.translationX;
          scale.value =
            Math.abs(e.translationX) > COMMIT_DISTANCE * 0.5 ? 0.98 : 1;
        })
        .onEnd((e) => {
          "worklet";
          const x = translateX.value;
          const v = e.velocityX;
          const w = Math.max(rowWidth.value, 1);

          const commitRight =
            x > COMMIT_DISTANCE_SLOW ||
            (x > COMMIT_DISTANCE && v >= 0) ||
            (x > 28 && v > COMMIT_VELOCITY);

          const commitLeft =
            x < -COMMIT_DISTANCE_SLOW ||
            (x < -COMMIT_DISTANCE && v <= 0) ||
            (x < -28 && v < -COMMIT_VELOCITY);

          // Proposals: → accept, ← reject
          // Accepted / Rejected: swipe opposite → restore to proposals
          let action: "accept" | "reject" | "restore" | null = null;
          if (bucket === "proposals") {
            if (commitRight) action = "accept";
            else if (commitLeft) action = "reject";
          } else if (bucket === "accepted" && commitLeft) {
            action = "restore";
          } else if (bucket === "rejected" && commitRight) {
            action = "restore";
          }

          if (action) {
            const startH = Math.max(measuredHeight.value, 1);
            collapseHeight.value = startH;
            translateX.value = withTiming(
              action === "reject" ||
                (action === "restore" && bucket === "accepted")
                ? -w
                : w,
              { duration: 160 },
            );
            opacity.value = withTiming(0, { duration: 180 });
            collapseHeight.value = withTiming(0, { duration: 220 });
            if (action === "accept") runOnJS(runAccept)();
            else if (action === "reject") runOnJS(runReject)();
            else runOnJS(runRestore)();
            return;
          }

          if (Math.abs(x) < 1) return;
          translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
          scale.value = withSpring(1);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated gesture
    [bucket, runAccept, runReject, runRestore],
  );

  const rowStyle = useAnimatedStyle(() => {
    "worklet";
    const rotation = interpolate(translateX.value, [-200, 200], [-4, 4]);
    const collapsing = collapseHeight.value >= 0;
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
        { rotateZ: `${rotation}deg` },
      ],
      opacity: opacity.value,
      height: collapsing ? collapseHeight.value : undefined,
      marginBottom:
        collapsing && collapseHeight.value < 1 ? 0 : spacing[2],
      overflow: "hidden" as const,
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    "worklet";
    const right = translateX.value > 0;
    const left = translateX.value < 0;
    return {
      backgroundColor: right ? ACCEPT : left ? REJECT : "transparent",
      opacity: Math.min(1, Math.abs(translateX.value) / 48),
    };
  });

  const leftHint =
    bucket === "rejected"
      ? `✓ ${t("ai.suggestRestore")}`
      : `✓ ${t("ai.suggestAccept")}`;
  const rightHint =
    bucket === "accepted"
      ? `${t("ai.suggestRestore")} ✕`
      : `${t("ai.suggestReject")} ✕`;

  return (
    <View
      onLayout={(e) => {
        rowWidth.value = e.nativeEvent.layout.width;
        measuredHeight.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          bgStyle,
          {
            borderRadius: radius.xl,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: spacing[2],
            justifyContent: "center",
            paddingHorizontal: spacing[4],
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{leftHint}</Text>
          <Text style={{ color: "#fff", fontWeight: "600" }}>{rightHint}</Text>
        </View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            rowStyle,
            {
              backgroundColor: theme.bg,
              borderRadius: radius.xl,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[3],
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[3],
            }}
          >
            <Text style={{ fontSize: 22 }}>
              {getShoppingCategoryIcon(item.category)}
            </Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={2}
                style={{ ...typography.headline, color: theme.text }}
              >
                {item.name}
              </Text>
              {item.note ? (
                <Text
                  numberOfLines={1}
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: 2,
                  }}
                >
                  {item.note}
                </Text>
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                {t("ai.suggestTimesSeen", { count: item.timesSeen })}
                {" · "}
                {lastSeenLabel}
              </Text>
              {item.reason ? (
                <Text
                  numberOfLines={1}
                  style={{
                    ...typography.caption,
                    color: theme.primary,
                    marginTop: 2,
                  }}
                >
                  {item.reason}
                </Text>
              ) : null}
            </View>
            {item.amount ? (
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  flexShrink: 0,
                }}
              >
                {item.amount}
              </Text>
            ) : null}
            <View
              style={{
                backgroundColor: badge.background,
                borderRadius: radius.full,
                paddingHorizontal: spacing[2] + 2,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: badge.text,
                  fontWeight: "600",
                }}
              >
                {t(`categories.${item.category}`)}
              </Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
