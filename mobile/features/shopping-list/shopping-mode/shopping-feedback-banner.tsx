import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import { DataSyncEngine } from "@/features/data-sync-engine";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { useOfflineSyncStatus } from "@/features/offline/useOfflineSyncStatus";
import { brand, colors, radius, spacing } from "@/design-system/tokens";

export type ShoppingUndoFeedback = {
  name: string;
  kind: "bought" | "unavailable";
};

type Props = {
  listId: string;
  undo: ShoppingUndoFeedback | null;
  onUndo: () => void;
  /**
   * overlay — absolute bottom (during shopping, no CTA footer).
   * docked — in-flow under CTAs; parent keeps a fixed-height slot so CTAs do not jump.
   */
  layout?: "overlay" | "docked";
};

/** Content height of the bar (excluding safe-area padding). */
export const SHOPPING_FEEDBACK_BANNER_HEIGHT = 40;

/**
 * Bottom shopping feedback: action + Undo with sync line underneath.
 */
export function ShoppingFeedbackBanner({
  listId,
  undo,
  onUndo,
  layout = "overlay",
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const sync = useOfflineSyncStatus(listId);
  const docked = layout === "docked";
  const bottomPad = docked ? spacing[1] + insets.bottom : spacing[1] + insets.bottom;

  const barBody = (opts: {
    barBg: string;
    iconBg: string;
    title: string;
    syncLine: string;
    isBought: boolean;
    showUndo: boolean;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[2],
        minHeight: SHOPPING_FEEDBACK_BANNER_HEIGHT - spacing[2],
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: radius.full,
          backgroundColor: opts.iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: "700",
            lineHeight: 13,
          }}
        >
          {opts.isBought ? "✓" : "!"}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            lineHeight: 16,
            fontWeight: "600",
            color: theme.text,
          }}
        >
          {opts.title}
        </Text>
        <Pressable
          onPress={() => {
            if (sync.failed > 0 || sync.pending > 0) {
              void DataSyncEngine.retry();
            }
          }}
          accessibilityRole="button"
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "400",
              color: theme.textMuted,
              marginTop: 1,
            }}
          >
            {opts.syncLine}
          </Text>
        </Pressable>
      </View>

      {opts.showUndo ? (
        <Pressable
          onPress={onUndo}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("shoppingMode.undo")}
        >
          <Text
            style={{
              fontSize: 13,
              lineHeight: 16,
              fontWeight: "600",
              color: opts.isBought ? brand.primary : brand.unavailable,
            }}
          >
            {t("shoppingMode.undo")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!undo) {
    if (docked) {
      // Fixed-height slot under CTAs — keep layout stable even when idle.
      if (!sync.visible) {
        return (
          <View
            style={{
              minHeight: SHOPPING_FEEDBACK_BANNER_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
            }}
          />
        );
      }
      return (
        <View
          style={{
            backgroundColor: theme.accent,
            paddingTop: spacing[1],
            paddingBottom: bottomPad,
            paddingHorizontal: spacing[3],
            minHeight: SHOPPING_FEEDBACK_BANNER_HEIGHT + insets.bottom,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => {
              if (sync.failed > 0 || sync.pending > 0) {
                void DataSyncEngine.retry();
              }
            }}
          >
            <Text
              style={{
                fontSize: 11,
                lineHeight: 14,
                color: theme.text,
                textAlign: "center",
              }}
            >
              {sync.message}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <OfflineStatusBanner
        listId={listId}
        overlay
        bottom
        style={{
          bottom: 0,
          paddingBottom: spacing[2] + insets.bottom,
        }}
      />
    );
  }

  const isBought = undo.kind === "bought";
  const title = t(
    isBought
      ? "shoppingMode.undoBought"
      : "shoppingMode.undoUnavailable",
    { name: undo.name },
  );
  const syncLine = sync.visible ? sync.message : t("offline.allSaved");
  const barBg = isBought ? brand.accent : "#FEF3C7";
  const iconBg = isBought ? brand.primary : brand.unavailable;

  const content = barBody({
    barBg,
    iconBg,
    title,
    syncLine,
    isBought,
    showUndo: true,
  });

  if (docked) {
    return (
      <View
        style={{
          backgroundColor: barBg,
          paddingTop: spacing[1],
          paddingBottom: bottomPad,
          paddingHorizontal: spacing[3],
          minHeight: SHOPPING_FEEDBACK_BANNER_HEIGHT + insets.bottom,
          justifyContent: "center",
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: barBg,
        paddingTop: spacing[1],
        paddingBottom: bottomPad,
        paddingHorizontal: spacing[3],
        minHeight: SHOPPING_FEEDBACK_BANNER_HEIGHT + insets.bottom,
        justifyContent: "center",
      }}
    >
      {content}
    </View>
  );
}
