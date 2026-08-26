import { useMemo, useState } from "react";
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
import { SuggestFromHistorySkeleton } from "@/features/ai/suggest-from-history-skeleton";
import type { SuggestFromHistoryItem } from "@/features/ai/schemas";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
import { LoadingTransition } from "@/lib/motion";

type Props = {
  visible: boolean;
  /** True while AI is generating the proposal (skeleton). */
  loading?: boolean;
  /** True while apply is in flight (CTA spinner). */
  busy?: boolean;
  title: string;
  items: SuggestFromHistoryItem[];
  onClose: () => void;
  onConfirm: (acceptedIds: string[]) => void;
};

const CHECKED = "#2F8F84";

function formatLastSeen(
  iso: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return t("ai.suggestLastSeenUnknown");
  const days = Math.max(
    0,
    Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000)),
  );
  if (days === 0) return t("ai.suggestLastSeenToday");
  if (days === 1) return t("ai.suggestLastSeenYesterday");
  return t("ai.suggestLastSeenDays", { count: days });
}

function HistoryItemRow({
  item,
  included,
  lastSeenLabel,
  onToggle,
}: {
  item: SuggestFromHistoryItem;
  included: boolean;
  lastSeenLabel: string;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const badge = getCategoryBadgeColors(item.category);
  const detailParts = [
    item.amount?.trim(),
    item.note?.trim(),
    t("ai.suggestTimesSeen", { count: item.timesSeen }),
    lastSeenLabel,
  ].filter(Boolean);
  const subtitle = detailParts.join(" · ");

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: included }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        opacity: included ? 1 : 0.55,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={2}
          style={{
            ...typography.headline,
            fontSize: 16,
            lineHeight: 22,
            color: included ? theme.text : theme.textMuted,
          }}
        >
          {item.name}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: spacing[3],
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: badge.background,
        }}
      >
        <Text
          style={{
            ...typography.caption,
            fontSize: 12,
            fontWeight: "600",
            color: badge.text,
          }}
          numberOfLines={1}
        >
          {t(`categories.${item.category}`)}
        </Text>
      </View>

      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: included ? CHECKED : theme.bg,
          borderWidth: included ? 0 : 1.5,
          borderColor: theme.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {included ? (
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
            ✓
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function SuggestFromHistorySheet({
  visible,
  loading = false,
  busy,
  title,
  items,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  const itemKey = items.map((i) => i.proposalRowId).join("|");
  const [prevItemKey, setPrevItemKey] = useState(itemKey);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());

  if (itemKey !== prevItemKey) {
    setPrevItemKey(itemKey);
    setExcluded(new Set());
  }

  const includedItems = useMemo(
    () => items.filter((item) => !excluded.has(item.proposalRowId)),
    [excluded, items],
  );

  const canConfirm = !loading && includedItems.length > 0 && !busy;

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
          accessibilityLabel={t("workspace.cancel")}
          onPress={onClose}
          disabled={busy}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(31, 43, 69, 0.32)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            maxHeight: "92%",
            ...shadows.soft,
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing[6],
              paddingTop: spacing[5],
              paddingBottom: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Pressable
              onPress={onClose}
              hitSlop={12}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t("workspace.cancel")}
              style={{
                alignSelf: "flex-end",
                width: 36,
                height: 36,
                borderRadius: radius.full,
                backgroundColor: theme.section,
                alignItems: "center",
                justifyContent: "center",
                opacity: busy ? 0.5 : 1,
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
            <Text style={{ ...typography.title, color: theme.text }}>
              {t("ai.suggestReviewTitle")}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textBody,
                marginTop: spacing[2],
              }}
            >
              {loading ? t("ai.suggestLoadingSubtitle") : title}
            </Text>
            {!loading ? (
              <Text
                style={{
                  ...typography.caption,
                  color: theme.textMuted,
                  marginTop: spacing[2],
                }}
              >
                {t("ai.suggestUncheckHint")}
              </Text>
            ) : null}
          </View>

          <ScrollView
            bounces
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: spacing[6],
              paddingTop: spacing[4],
              paddingBottom: spacing[4],
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: "700",
                letterSpacing: 0.4,
                color: theme.textMuted,
                marginBottom: spacing[3],
              }}
            >
              {loading
                ? t("ai.suggestProductsSection").toUpperCase()
                : t("ai.suggestProductsSectionWithCount", {
                    count: items.length,
                  }).toUpperCase()}
            </Text>

            <LoadingTransition
              variant="inline"
              loading={loading}
              skeleton={<SuggestFromHistorySkeleton />}
            >
              {items.length === 0 ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                  }}
                >
                  {t("ai.suggestProposalsEmpty")}
                </Text>
              ) : (
                <View
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: theme.border,
                    overflow: "hidden",
                  }}
                >
                  {items.map((item) => (
                    <HistoryItemRow
                      key={item.proposalRowId}
                      item={item}
                      included={!excluded.has(item.proposalRowId)}
                      lastSeenLabel={formatLastSeen(item.lastSeenAt, t)}
                      onToggle={() => {
                        setExcluded((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.proposalRowId)) {
                            next.delete(item.proposalRowId);
                          } else {
                            next.add(item.proposalRowId);
                          }
                          return next;
                        });
                      }}
                    />
                  ))}
                </View>
              )}
            </LoadingTransition>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing[6],
              paddingTop: spacing[3],
              paddingBottom:
                Math.max(insets.bottom, spacing[4]) + spacing[2],
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <Pressable
              disabled={!canConfirm}
              onPress={() =>
                onConfirm(includedItems.map((item) => item.proposalRowId))
              }
              style={{
                backgroundColor: canConfirm ? theme.primary : theme.section,
                borderRadius: radius.xl,
                paddingVertical: spacing[4],
                alignItems: "center",
                opacity: canConfirm ? 1 : 0.55,
              }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    ...typography.headline,
                    color: canConfirm ? "#fff" : theme.textMuted,
                    fontWeight: "700",
                  }}
                >
                  {loading
                    ? t("ai.suggestLoadingCta")
                    : t("ai.suggestAddProducts", {
                        count: includedItems.length,
                      })}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
