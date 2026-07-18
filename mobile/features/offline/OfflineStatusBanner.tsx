import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { DataSyncEngine } from "@/features/data-sync-engine";
import { colors, spacing, typography } from "@/design-system/tokens";

import { useOfflineSyncStatus } from "./useOfflineSyncStatus";

type Props = {
  listId?: string;
  /**
   * Overlay under the top bar without shifting page content.
   * Parent should be `position: "relative"` (default for View).
   */
  overlay?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const OFFLINE_BANNER_HEIGHT = 32;

/**
 * Shared offline / sync status banner. Reads Engine connectivity + pending count.
 * Informational only — no business logic on event order.
 */
export function OfflineStatusBanner({ listId, overlay = false, style }: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const status = useOfflineSyncStatus(listId);

  if (!status.visible) {
    return null;
  }

  return (
    <Pressable
      onPress={() => {
        if (status.failed > 0 || status.pending > 0) {
          void DataSyncEngine.retry();
        }
      }}
      style={[
        {
          backgroundColor:
            !status.online || status.failed > 0 ? "#F59E0B22" : theme.accent,
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[4],
          minHeight: OFFLINE_BANNER_HEIGHT,
          justifyContent: "center",
          ...(overlay
            ? {
                position: "absolute" as const,
                top: 0,
                left: 0,
                right: 0,
                zIndex: 20,
              }
            : null),
        },
        style,
      ]}
    >
      <Text
        style={{
          ...typography.caption,
          color: theme.text,
          textAlign: "center",
        }}
      >
        {status.message}
      </Text>
    </Pressable>
  );
}
