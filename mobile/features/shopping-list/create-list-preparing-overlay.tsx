import { Modal, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ListDetailSkeleton,
  ListHeaderTitleSkeleton,
} from "@/components/skeleton";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing } from "@/design-system/tokens";

type Props = {
  visible: boolean;
};

/**
 * Fullscreen wait while POST create runs — same bones as list detail loading,
 * so the handoff to /list/:id feels continuous (not a spinner interstitial).
 */
export function CreateListPreparingOverlay({ visible }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
      onRequestClose={() => {
        // Create is in flight — dismiss is not supported mid-request.
      }}
    >
      <View
        style={{ flex: 1, backgroundColor: theme.bg }}
        accessibilityLabel={t("home.createCreatingList")}
        accessibilityRole="progressbar"
      >
        <View
          style={{
            paddingTop: insets.top + spacing[2],
            paddingHorizontal: spacing[4],
            paddingBottom: spacing[3],
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.bg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[2],
            }}
          >
            <View style={{ width: 40, height: 40 }} />
            <ListHeaderTitleSkeleton />
          </View>
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[5],
          }}
        >
          <ListDetailSkeleton />
        </View>
      </View>
    </Modal>
  );
}
