import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "@/design-system/tokens";
import { ListItemRow } from "@/features/shopping-item/list-item-row";
import { listShoppingItems } from "@/features/shopping-item/api";

type Props = {
  visible: boolean;
  listId: string | null;
  listName: string;
  /** Required for archived History lists. */
  allowArchived?: boolean;
  onClose: () => void;
};

/**
 * Read-only History preview — same row layout as “Items on list”.
 */
export function HistoryPreviewSheet({
  visible,
  listId,
  listName,
  allowArchived = false,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const { getToken, isSignedIn } = useAuth();

  const itemsQuery = useQuery({
    queryKey: ["history-preview-items", listId, allowArchived],
    enabled: visible && Boolean(isSignedIn) && Boolean(listId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !listId) throw new Error("Missing token or list id");
      return listShoppingItems(token, listId, { allowArchived });
    },
  });

  const items = itemsQuery.data ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("history.cancel")}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(31, 43, 69, 0.4)",
          }}
        />

        <View
          style={{
            maxHeight: "88%",
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: spacing[5],
            ...shadows.soft,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: spacing[3],
              paddingHorizontal: spacing[6],
              marginBottom: spacing[3],
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ ...typography.title, color: theme.text }}
                numberOfLines={2}
              >
                {listName}
              </Text>
              <Text
                style={{
                  ...typography.headline,
                  color: theme.text,
                  marginTop: spacing[3],
                }}
              >
                {t("list.itemsOnList")}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("history.cancel")}
              hitSlop={12}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.full,
                backgroundColor: theme.section,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  lineHeight: 20,
                  color: theme.textMuted,
                  fontWeight: "600",
                }}
              >
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing[6],
              paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[6],
            }}
            showsVerticalScrollIndicator={false}
          >
            {itemsQuery.isLoading ? (
              <View
                style={{ paddingVertical: spacing[10], alignItems: "center" }}
              >
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : null}

            {itemsQuery.isError ? (
              <Text style={{ ...typography.body, color: theme.danger }}>
                {t("history.previewFailed")}
              </Text>
            ) : null}

            {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 ? (
              <Text
                style={{
                  ...typography.body,
                  color: theme.textMuted,
                  textAlign: "center",
                  paddingVertical: spacing[6],
                }}
              >
                {t("list.emptyTitle")}
              </Text>
            ) : null}

            {items.map((item, index) => (
              <ListItemRow
                key={item.id}
                item={item}
                showDivider={index < items.length - 1}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
