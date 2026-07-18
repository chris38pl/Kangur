import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { DataSyncEngine } from "@/features/data-sync-engine";
import { OfflineStatusBanner } from "@/features/offline/OfflineStatusBanner";
import { useOfflineSyncStatus } from "@/features/offline/useOfflineSyncStatus";
import { brand, colors, radius, spacing, typography } from "@/design-system/tokens";

export type ShoppingUndoFeedback = {
  name: string;
  kind: "bought" | "unavailable";
};

type Props = {
  listId: string;
  undo: ShoppingUndoFeedback | null;
  onUndo: () => void;
};

/**
 * Top shopping feedback: action + Undo (mock green bar) with sync line underneath.
 * Falls back to OfflineStatusBanner when there is no undo snapshot.
 */
export function ShoppingFeedbackBanner({ listId, undo, onUndo }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const sync = useOfflineSyncStatus(listId);

  if (!undo) {
    return <OfflineStatusBanner listId={listId} />;
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

  return (
    <View
      style={{
        backgroundColor: barBg,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radius.full,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "700",
              lineHeight: 16,
            }}
          >
            {isBought ? "✓" : "!"}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              ...typography.label,
              color: theme.text,
            }}
          >
            {title}
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
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {syncLine}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onUndo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("shoppingMode.undo")}
        >
          <Text
            style={{
              ...typography.label,
              color: isBought ? brand.primary : brand.unavailable,
            }}
          >
            {t("shoppingMode.undo")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
