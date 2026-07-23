import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
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
import { LoadingTransition } from "@/lib/motion";
import {
  SuggestSwipeRow,
  type SuggestBucket,
} from "@/features/ai/suggest-swipe-row";
import type { SuggestFromHistoryItem } from "@/features/ai/schemas";

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

function SectionTitle({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <Text
      style={{
        ...typography.headline,
        color,
        marginBottom: spacing[3],
      }}
    >
      {label}
    </Text>
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

  /**
   * Ordered bucket membership. All items start in proposals (source order).
   * Newly accepted / rejected items are prepended so they appear at the top.
   */
  const [orders, setOrders] = useState<Record<SuggestBucket, string[]>>({
    accepted: [],
    proposals: items.map((item) => item.proposalRowId),
    rejected: [],
  });
  const itemKey = items.map((i) => i.proposalRowId).join("|");
  const [prevItemKey, setPrevItemKey] = useState(itemKey);
  const itemsById = useMemo(() => {
    const map = new Map<string, SuggestFromHistoryItem>();
    for (const item of items) map.set(item.proposalRowId, item);
    return map;
  }, [items]);

  if (itemKey !== prevItemKey) {
    setPrevItemKey(itemKey);
    setOrders({
      accepted: [],
      proposals: items.map((item) => item.proposalRowId),
      rejected: [],
    });
  }

  const resolve = useCallback(
    (ids: string[]) =>
      ids
        .map((id) => itemsById.get(id))
        .filter((item): item is SuggestFromHistoryItem => item != null),
    [itemsById],
  );

  const accepted = useMemo(
    () => resolve(orders.accepted),
    [orders.accepted, resolve],
  );
  const proposals = useMemo(
    () => resolve(orders.proposals),
    [orders.proposals, resolve],
  );
  const rejected = useMemo(
    () => resolve(orders.rejected),
    [orders.rejected, resolve],
  );

  const moveTo = useCallback(
    (item: SuggestFromHistoryItem, bucket: SuggestBucket) => {
      const id = item.proposalRowId;
      setOrders((prev) => {
        const next: Record<SuggestBucket, string[]> = {
          accepted: prev.accepted.filter((rowId) => rowId !== id),
          proposals: prev.proposals.filter((rowId) => rowId !== id),
          rejected: prev.rejected.filter((rowId) => rowId !== id),
        };
        // Accepted / rejected: newest first. Proposals: restore at top for visibility.
        next[bucket] = [id, ...next[bucket]];
        return next;
      });
    },
    [],
  );

  const onAccept = useCallback(
    (item: SuggestFromHistoryItem) => moveTo(item, "accepted"),
    [moveTo],
  );
  const onReject = useCallback(
    (item: SuggestFromHistoryItem) => moveTo(item, "rejected"),
    [moveTo],
  );
  const onRestore = useCallback(
    (item: SuggestFromHistoryItem) => moveTo(item, "proposals"),
    [moveTo],
  );

  const canConfirm = !loading && accepted.length > 0 && !busy;

  const renderRow = (item: SuggestFromHistoryItem, bucket: SuggestBucket) => (
    <SuggestSwipeRow
      key={`${bucket}-${item.proposalRowId}`}
      item={item}
      bucket={bucket}
      onAccept={onAccept}
      onReject={onReject}
      onRestore={onRestore}
      lastSeenLabel={formatLastSeen(item.lastSeenAt, t)}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
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
                  {t("ai.suggestSwipeTip")}
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
              <SectionTitle
                label={
                  loading
                    ? t("ai.suggestProposals", { count: 0 })
                    : t("ai.suggestProposals", { count: proposals.length })
                }
                color={theme.text}
              />

              <LoadingTransition
                variant="inline"
                loading={loading}
                skeleton={<SuggestFromHistorySkeleton />}
              >
              {proposals.length === 0 ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginBottom: spacing[2],
                  }}
                >
                  {t("ai.suggestProposalsEmpty")}
                </Text>
              ) : (
                proposals.map((item) => renderRow(item, "proposals"))
              )}
              </LoadingTransition>

              <View style={{ marginTop: spacing[5] }}>
                <SectionTitle
                  label={t("ai.suggestAccepted", { count: accepted.length })}
                  color={theme.text}
                />
              </View>

              {loading || accepted.length === 0 ? (
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginBottom: spacing[4],
                  }}
                >
                  {t("ai.suggestAcceptedEmpty")}
                </Text>
              ) : (
                accepted.map((item) => renderRow(item, "accepted"))
              )}

              {!loading && rejected.length > 0 ? (
                <View style={{ marginTop: spacing[5] }}>
                  <SectionTitle
                    label={t("ai.suggestRejected", {
                      count: rejected.length,
                    })}
                    color={theme.text}
                  />
                  {rejected.map((item) => renderRow(item, "rejected"))}
                </View>
              ) : null}
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
                  onConfirm(accepted.map((item) => item.proposalRowId))
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
                          count: accepted.length,
                        })}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
