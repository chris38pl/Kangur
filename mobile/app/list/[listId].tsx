import {
  getShoppingCategoryIcon,
  mergeActiveCategoryOrder,
  resolveShoppingCategoryOrder,
  type ShoppingCategory as SharedShoppingCategory,
} from "@shared/shopping-categories";
import { useAuth } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  ListDetailSkeleton,
  ListHeaderTitleSkeleton,
} from "@/components/skeleton";
import { useAppResult } from "@/components/AppResultProvider";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { primaryButtonStyle } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { applyAi, ingestAi } from "@/features/ai/api";
import { buildScreenshotIngestFormData } from "@/features/ai/buildScreenshotIngestFormData";
import { MealProposalComposer } from "@/features/ai/meal-proposal-composer";
import type { ProposalOperation } from "@/features/ai/schemas";
import { BackIcon } from "@/features/auth/auth-icons";
import { CategoryChips } from "@/features/shopping-item/category-chips";
import {
  ListStatusFilterChips,
  type ListStatusFilter,
} from "@/features/shopping-item/list-status-filter-chips";
import { EditItemSheet } from "@/features/shopping-item/edit-item-sheet";
import { RemoteChangeToast, useListRealtime } from "@/lib/realtime";
import { ListItemRow } from "@/features/shopping-item/list-item-row";
import type {
  ShoppingCategory,
  ShoppingItem,
} from "@/features/shopping-item/schemas";
import {
  useCreateShoppingItem,
  useShoppingItems,
  useUpdateShoppingItem,
} from "@/features/shopping-item/useShoppingItems";
import { getShoppingList } from "@/features/shopping-list/api";
import { CreateListOptionRow } from "@/features/shopping-list/create-list-option-row";
import { DeleteListDialog } from "@/features/shopping-list/delete-list-dialog";
import { takePendingListImport } from "@/features/shopping-list/pending-list-import";
import { takePendingListFocus } from "@/features/shopping-list/pending-list-focus";
import {
  clearListProvisional,
  isListProvisional,
} from "@/features/shopping-list/provisional-list";
import { RenameListSheet } from "@/features/shopping-list/rename-list-sheet";
import {
  CategoryOrderEditRow,
  CategoryOrderHint,
} from "@/features/shopping-list/category-order-ui";
import { CategoryReorderList } from "@/features/shopping-list/category-reorder-list";
import { NestableScreenScroll } from "@/features/shopping-list/nestable-screen-scroll";
import {
  useArchiveShoppingList,
  useUpdateShoppingList,
} from "@/features/shopping-list/useShoppingLists";
import { createClientId } from "@/lib/createClientId";
import { isAiReviewEnabled } from "@/lib/aiReview";
import {
  getCreditShortage,
  isInsufficientCreditsError,
} from "@/lib/ai/insufficientCredits";
import { Analytics } from "@/lib/analytics";
import { oncePerUser } from "@/lib/analytics/once";
import { createRequestId } from "@/lib/analytics/requestId";
import { ApiClientError } from "@/lib/api/client";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { setSentryRequestId } from "@/lib/sentry/init";
import type { AiImportSource } from "@shared/analytics/events";
import { isMealProposalEnabled } from "@/lib/featureGates";

function buildApplyOperations(operations: ProposalOperation[]) {
  return operations.map((operation) => {
    if (operation.op === "ignore") {
      return {
        op: "ignore" as const,
        proposalRowId: operation.proposalRowId,
      };
    }

    if (operation.op === "create") {
      return {
        op: "create" as const,
        proposalRowId: operation.proposalRowId,
        clientId: operation.clientId ?? createClientId(),
        name: operation.name,
        amount: operation.amount ?? null,
        note: operation.note ?? null,
        category: operation.category,
      };
    }

    if (operation.op === "merge") {
      return {
        op: "merge" as const,
        proposalRowId: operation.proposalRowId,
        targetItemId: operation.targetItemId ?? "",
        name: operation.name,
        amount: operation.amount ?? null,
        note: operation.note ?? null,
        category: operation.category,
      };
    }

    return {
      op: "update" as const,
      proposalRowId: operation.proposalRowId,
      targetItemId: operation.targetItemId ?? "",
      name: operation.name,
      amount: operation.amount ?? null,
      note: operation.note ?? null,
      category: operation.category,
    };
  });
}

export default function ShoppingListScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const router = useRouter();
  const navigation = useNavigation();
  const { showInsufficientCredits } = useAppResult();
  const { listId, import: importSource } = useLocalSearchParams<{
    listId: string;
    import?: string;
  }>();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const importTriggered = useRef(false);
  const aiRequestIdRef = useRef<string | null>(null);
  const aiSourceRef = useRef<AiImportSource>("text");
  const aiOriginalOpsRef = useRef<ProposalOperation[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("other");
  const [aiText, setAiText] = useState("");
  const [reviewRunId, setReviewRunId] = useState<string | null>(null);
  const [reviewOperations, setReviewOperations] = useState<ProposalOperation[]>([]);
  const [renameOpen, setRenameOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [aiSectionOpen, setAiSectionOpen] = useState(false);
  const [mealSectionOpen, setMealSectionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mealGenerating, setMealGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>("all");
  const entryFocusApplied = useRef(false);
  const onMealGeneratingChange = useCallback((generating: boolean) => {
    setMealGenerating(generating);
  }, []);

  const listQuery = useQuery({
    queryKey: ["shopping-list", listId],
    enabled: Boolean(isSignedIn) && typeof listId === "string",
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.code === "NOT_FOUND") {
        return false;
      }
      return failureCount < 2;
    },
    queryFn: async () => {
      const token = await getToken();
      if (!token || typeof listId !== "string") {
        throw new Error("Missing auth token or list id");
      }
      return getShoppingList(token, listId);
    },
  });

  useListRealtime(typeof listId === "string" ? listId : null, {
    workspaceId: listQuery.data?.workspaceId ?? null,
  });
  const itemsQuery = useShoppingItems(
    typeof listId === "string" ? listId : null,
    Boolean(isSignedIn) && !listQuery.isError,
  );
  const createItem = useCreateShoppingItem(
    typeof listId === "string" ? listId : null,
  );
  const updateItem = useUpdateShoppingItem(
    typeof listId === "string" ? listId : null,
  );
  const archiveList = useArchiveShoppingList(
    listQuery.data?.workspaceId ?? null,
  );
  const updateList = useUpdateShoppingList(
    typeof listId === "string" ? listId : null,
  );
  const applyMutation = useMutation({
    mutationFn: async (input: {
      runId: string;
      operations: ProposalOperation[];
    }) => {
      const token = await getToken();
      if (!token || typeof listId !== "string") {
        throw new Error("Missing auth token or list id");
      }

      const result = await applyAi(token, listId, {
        runId: input.runId,
        operations: buildApplyOperations(input.operations),
      });

      queryClient.setQueryData(["shopping-items", listId], result.items);
      return result;
    },
    onError: (error) => {
      const workspaceId = listQuery.data?.workspaceId;
      if (workspaceId && typeof listId === "string") {
        Analytics.track("ai_import_failed", {
          workspace_id: workspaceId,
          list_id: listId,
          request_id: aiRequestIdRef.current ?? undefined,
          source: aiSourceRef.current,
          code:
            error instanceof ApiClientError ? error.code : "apply_failed",
        });
      }
      setSentryRequestId(null);
      aiRequestIdRef.current = null;
    },
    onSuccess: (_result, variables) => {
      const workspaceId = listQuery.data?.workspaceId;
      const acceptedCount = variables.operations.filter(
        (op) => op.op !== "ignore",
      ).length;
      if (workspaceId && typeof listId === "string") {
        const original = aiOriginalOpsRef.current;
        let editedCount = 0;
        if (original.length > 0) {
          for (const op of variables.operations) {
            const base = original.find(
              (row) => row.proposalRowId === op.proposalRowId,
            );
            if (!base) {
              editedCount += 1;
              continue;
            }
            if (
              base.op !== op.op ||
              base.name !== op.name ||
              (base.amount ?? null) !== (op.amount ?? null) ||
              (base.note ?? null) !== (op.note ?? null) ||
              base.category !== op.category
            ) {
              editedCount += 1;
            }
          }
        }
        if (editedCount > 0) {
          Analytics.track("ai_import_edited", {
            workspace_id: workspaceId,
            list_id: listId,
            request_id: aiRequestIdRef.current ?? undefined,
            edited_count: editedCount,
          });
        }
        if (acceptedCount >= 1) {
          Analytics.track("ai_import_accepted", {
            workspace_id: workspaceId,
            list_id: listId,
            request_id: aiRequestIdRef.current ?? undefined,
            source: aiSourceRef.current,
            proposal_item_count: acceptedCount,
          });
          void oncePerUser("first_ai_import", () => {
            Analytics.track("first_ai_import", {
              workspace_id: workspaceId,
              source: aiSourceRef.current,
            });
          });
        }
      }
      setReviewRunId(null);
      setReviewOperations([]);
      setAiText("");
      setSentryRequestId(null);
      aiRequestIdRef.current = null;
      aiOriginalOpsRef.current = [];
      if (typeof listId === "string") {
        clearListProvisional(listId);
        void queryClient.invalidateQueries({
          queryKey: ["shopping-list", listId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["shopping-items", listId],
        });
        void queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      }
    },
  });

  const ingestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getToken();
      if (!token || typeof listId !== "string") {
        throw new Error("Missing auth token or list id");
      }
      return ingestAi(token, listId, formData);
    },
    onError: (error) => {
      const workspaceId = listQuery.data?.workspaceId;
      if (workspaceId && typeof listId === "string") {
        Analytics.track("ai_import_failed", {
          workspace_id: workspaceId,
          list_id: listId,
          request_id: aiRequestIdRef.current ?? undefined,
          source: aiSourceRef.current,
          code:
            error instanceof ApiClientError ? error.code : "ingest_failed",
        });
      }
      setSentryRequestId(null);
      aiRequestIdRef.current = null;
      if (isInsufficientCreditsError(error)) {
        const shortage = getCreditShortage(error) ?? {
          needed: 1,
          remaining: 0,
        };
        showInsufficientCredits({
          ...shortage,
          description: t("ai.insufficientCreditsBody"),
        });
        return;
      }
      if (error instanceof ApiClientError && error.code === "NOT_FOUND") {
        Alert.alert(t("list.missingTitle"), t("list.missingBody"), [
          {
            text: t("invite.goHome"),
            onPress: () => router.replace("/(tabs)" as never),
          },
        ]);
        return;
      }
      Alert.alert(t("list.title"), error.message || t("list.ingestFailed"));
    },
    onSuccess: (result) => {
      const title =
        result.proposal.shoppingContext?.title?.trim().slice(0, 32) ?? "";

      // Backend renames untitled lists on ingest - refresh header immediately.
      if (typeof listId === "string" && title) {
        queryClient.setQueryData(
          ["shopping-list", listId],
          (prev: { name?: string; isUntitled?: boolean } | undefined) =>
            prev
              ? { ...prev, name: title, isUntitled: false }
              : prev,
        );
        void queryClient.invalidateQueries({
          queryKey: ["shopping-list", listId],
        });
        void queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      }

      aiOriginalOpsRef.current = result.proposal.operations.map((op) => ({
        ...op,
      }));

      if (isAiReviewEnabled()) {
        setReviewRunId(result.runId);
        setReviewOperations(result.proposal.operations);
        return;
      }

      // Default: auto-apply proposal (no review UI).
      applyMutation.mutate({
        runId: result.runId,
        operations: result.proposal.operations,
      });
    },
  });

  const archiveOnLeave = useRef(archiveList.mutateAsync);
  archiveOnLeave.current = archiveList.mutateAsync;
  const mountedAt = useRef(0);

  // Leave without products → discard provisional list (no empty spam on Home).
  useEffect(() => {
    if (typeof listId !== "string") return;
    mountedAt.current = Date.now();

    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!isListProvisional(listId)) return;
      // Don't trash the list while AI ingest / apply is in flight.
      if (ingestMutation.isPending || applyMutation.isPending) {
        e.preventDefault();
        return;
      }
      // Avoid Strict Mode / web remount false leaves right after open.
      if (Date.now() - mountedAt.current < 1500) {
        return;
      }
      const items =
        queryClient.getQueryData<ShoppingItem[]>(["shopping-items", listId]) ??
        [];
      const count = items.filter((item) => item.status !== "removed").length;
      clearListProvisional(listId);
      if (count === 0) {
        void archiveOnLeave.current(listId).catch(() => {
          // best-effort cleanup
        });
      }
    });

    return unsub;
  }, [
    listId,
    navigation,
    queryClient,
    ingestMutation.isPending,
    applyMutation.isPending,
  ]);

  const isPending = listQuery.isPending || itemsQuery.isPending;
  const listMissing =
    listQuery.isError &&
    listQuery.error instanceof ApiClientError &&
    listQuery.error.code === "NOT_FOUND";

  const goHome = () => {
    router.replace("/(tabs)" as never);
  };

  const startAiIngest = (source: AiImportSource, formData: FormData) => {
    const workspaceId = listQuery.data?.workspaceId;
    if (!workspaceId || typeof listId !== "string") return;
    const requestId = createRequestId();
    aiRequestIdRef.current = requestId;
    aiSourceRef.current = source;
    setSentryRequestId(requestId);
    Analytics.track("ai_import_started", {
      workspace_id: workspaceId,
      list_id: listId,
      request_id: requestId,
      source,
    });
    ingestMutation.mutate(formData);
  };

  const startTextIngest = () => {
    Keyboard.dismiss();
    const formData = new FormData();
    formData.append("source", "text");
    formData.append("text", aiText.trim());
    startAiIngest("text", formData);
  };

  const startClipboardIngest = async (textOverride?: string) => {
    Keyboard.dismiss();
    const text = (textOverride ?? (await Clipboard.getStringAsync())).trim();
    if (!text) return;
    const formData = new FormData();
    formData.append("source", "clipboard");
    formData.append("text", text);
    setAiText(text);
    startAiIngest("clipboard", formData);
  };

  const startScreenshotIngest = async (asset?: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }) => {
    Keyboard.dismiss();
    let picked = asset;
    if (!picked) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled) return;
      picked = result.assets[0];
    }
    try {
      const formData = await buildScreenshotIngestFormData(picked);
      startAiIngest("screenshot", formData);
    } catch (error) {
      const workspaceId = listQuery.data?.workspaceId;
      if (workspaceId && typeof listId === "string") {
        Analytics.track("ai_import_failed", {
          workspace_id: workspaceId,
          list_id: listId,
          source: "screenshot",
          code: "screenshot_build_failed",
        });
      }
      Alert.alert(
        t("list.title"),
        error instanceof Error ? error.message : t("list.ingestFailed"),
      );
    }
  };

  // Deep-link from create sheet: pending import (picked before list create) or ?import=
  useEffect(() => {
    if (importTriggered.current) return;
    if (!listQuery.isSuccess || typeof listId !== "string") return;

    const pending = takePendingListImport();
    if (pending || importSource) {
      importTriggered.current = true;
      const handle = setTimeout(() => {
        if (pending?.kind === "clipboard") {
          void startClipboardIngest(pending.text);
        } else if (pending?.kind === "image") {
          void startScreenshotIngest(pending);
        } else if (importSource === "clipboard") {
          void startClipboardIngest();
        } else if (importSource === "screenshot" || importSource === "photo") {
          void startScreenshotIngest();
        }
      }, 0);
      if (importSource) {
        router.setParams({ import: undefined });
      }
      return () => clearTimeout(handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when list ready
  }, [listQuery.isSuccess, listId, importSource]);

  // Expand the section that matches how the list was opened (FAB path).
  useEffect(() => {
    if (entryFocusApplied.current) return;
    if (!listQuery.isSuccess || typeof listId !== "string") return;
    entryFocusApplied.current = true;
    const focus = takePendingListFocus(listId);
    setAiSectionOpen(focus === "ai");
    setMealSectionOpen(focus === "meal");
    setManualAddOpen(focus === "manual");
  }, [listQuery.isSuccess, listId]);

  const fastPathReady =
    reviewOperations.length > 0 &&
    reviewOperations.every((operation) => operation.op === "merge") &&
    reviewOperations.every((operation) => operation.confidence >= 0.85);

  const categoryOrder = resolveShoppingCategoryOrder(
    listQuery.data?.categoryOrder,
  );
  const activeItems = (itemsQuery.data ?? [])
    .filter((item) => item.status !== "removed")
    .slice()
    .sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      const byCategory =
        (aIndex === -1 ? categoryOrder.length : aIndex) -
        (bIndex === -1 ? categoryOrder.length : bIndex);
      if (byCategory !== 0) return byCategory;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  const itemCount = activeItems.length;
  const statusFilterCounts = useMemo(
    () => ({
      pending: activeItems.filter((item) => item.status === "pending").length,
      bought: activeItems.filter((item) => item.status === "bought").length,
      unavailable: activeItems.filter((item) => item.status === "unavailable")
        .length,
    }),
    [activeItems],
  );
  const filteredItems =
    statusFilter === "all"
      ? activeItems
      : activeItems.filter((item) => item.status === statusFilter);

  const categoriesOnList = useMemo(() => {
    const seen = new Set<SharedShoppingCategory>();
    const ordered: SharedShoppingCategory[] = [];
    for (const category of categoryOrder) {
      if (
        activeItems.some((item) => item.category === category) &&
        !seen.has(category)
      ) {
        seen.add(category);
        ordered.push(category);
      }
    }
    return ordered;
  }, [activeItems, categoryOrder]);

  const onCategoryReorder = (data: SharedShoppingCategory[]) => {
    const nextOrder = mergeActiveCategoryOrder(categoryOrder, data);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateList.mutate({ categoryOrder: nextOrder });
  };

  const confirmDeleteList = () => {
    if (typeof listId !== "string") return;
    setDeleteOpen(true);
  };

  const performDeleteList = () => {
    if (typeof listId !== "string") return;
    void archiveList.mutateAsync(listId).then(() => {
      console.info("[shopping-list]", "ListDeleted", { listId });
      setDeleteOpen(false);
      router.replace("/(tabs)" as never);
    });
  };

  const openItemMenu = (item: ShoppingItem) => {
    setEditingItem(item);
  };

  const footerPad =
    spacing[3] + 56 + spacing[3] + Math.max(insets.bottom, spacing[2]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <RemoteChangeToast />
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
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(tabs)" as never);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("auth.back")}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BackIcon size={20} />
            </Pressable>

            {isPending ? (
              <ListHeaderTitleSkeleton />
            ) : (
              <Pressable
                onPress={() => setRenameOpen(true)}
                disabled={!listQuery.data}
                accessibilityRole="button"
                accessibilityLabel={t("list.renameTitle")}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Text
                  numberOfLines={1}
                  style={{ ...typography.headline, color: theme.text }}
                >
                  {listQuery.data?.name ?? t("list.title")}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: 2,
                  }}
                >
                  {t("list.itemCount", { count: itemCount })}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <NestableScreenScroll
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: spacing[5],
            paddingBottom: footerPad + spacing[4],
          }}
          keyboardShouldPersistTaps="handled"
        >
        {isPending ? (
          <ListDetailSkeleton />
        ) : listMissing || listQuery.isError ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing[16],
              paddingHorizontal: spacing[4],
            }}
          >
            <Text
              style={{
                ...typography.title,
                color: theme.text,
                textAlign: "center",
              }}
            >
              {t("list.missingTitle")}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textMuted,
                textAlign: "center",
                marginTop: spacing[2],
              }}
            >
              {t("list.missingBody")}
            </Text>
            <Pressable
              onPress={goHome}
              style={{
                marginTop: spacing[6],
                alignSelf: "stretch",
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("invite.goHome")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View>
              <Pressable
                onPress={() => setAiSectionOpen((open) => !open)}
                accessibilityRole="button"
                accessibilityState={{ expanded: aiSectionOpen }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 44,
                }}
              >
                <Text
                  style={{
                    ...typography.headline,
                    color: aiSectionOpen ? theme.text : theme.textMuted,
                    flex: 1,
                    paddingRight: spacing[3],
                  }}
                >
                  {t("ai.quickAddTitle")}
                </Text>
                <Text
                  style={{
                    color: aiSectionOpen ? theme.text : theme.textMuted,
                    fontSize: 22,
                    lineHeight: 26,
                    fontWeight: "600",
                  }}
                >
                  {aiSectionOpen ? "▾" : "▸"}
                </Text>
              </Pressable>

              {aiSectionOpen ? (
                <View>
                  <Text
                    style={{
                      ...typography.body,
                      color: theme.textBody,
                      marginTop: spacing[2],
                    }}
                  >
                    {t("ai.quickAddSubtitle")}
                  </Text>

                  <TextInput
                    value={aiText}
                    onChangeText={setAiText}
                    multiline
                    placeholder={t("ai.textPlaceholder")}
                    placeholderTextColor={theme.textMuted}
                    style={{
                      marginTop: spacing[4],
                      minHeight: 96,
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: radius.lg,
                      padding: spacing[4],
                      color: theme.text,
                      textAlignVertical: "top",
                    }}
                  />

                  <Pressable
                    disabled={
                      ingestMutation.isPending ||
                      applyMutation.isPending ||
                      !aiText.trim()
                    }
                    onPress={startTextIngest}
                    style={{
                      marginTop: spacing[4],
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: spacing[2],
                      backgroundColor: theme.primary,
                      borderRadius: radius.lg,
                      paddingVertical: spacing[4],
                      opacity:
                        ingestMutation.isPending ||
                        applyMutation.isPending ||
                        !aiText.trim()
                          ? 0.6
                          : 1,
                    }}
                  >
                    {ingestMutation.isPending || applyMutation.isPending ? (
                      <ActivityIndicator color={theme.onPrimary} />
                    ) : (
                      <>
                        <Text style={{ fontSize: 14, color: theme.onPrimary }}>
                          ✨
                        </Text>
                        <Text
                          style={{
                            ...typography.label,
                            color: theme.onPrimary,
                          }}
                        >
                          {t(
                            itemCount > 0
                              ? "ai.addToList"
                              : "ai.createFromText",
                          )}
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[3],
                      marginVertical: spacing[5],
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: theme.border,
                      }}
                    />
                    <Text
                      style={{
                        ...typography.caption,
                        color: theme.textMuted,
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      {t("ai.orImport")}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: theme.border,
                      }}
                    />
                  </View>

                  <CreateListOptionRow
                    icon="📷"
                    title={t("home.createImage")}
                    subtitle={t("home.createImageHint")}
                    disabled={
                      ingestMutation.isPending || applyMutation.isPending
                    }
                    onPress={() => void startScreenshotIngest()}
                  />
                  <CreateListOptionRow
                    icon="🛒"
                    title={t("home.createClipboard")}
                    subtitle={t("home.createClipboardHint")}
                    disabled={
                      ingestMutation.isPending || applyMutation.isPending
                    }
                    onPress={() => void startClipboardIngest()}
                  />
                </View>
              ) : null}
            </View>

            {isMealProposalEnabled() ? (
              <View style={{ marginTop: spacing[6] }}>
                <Pressable
                  onPress={() => setMealSectionOpen((open) => !open)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: mealSectionOpen }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 44,
                  }}
                >
                  <Text
                    style={{
                      ...typography.headline,
                      color: mealSectionOpen ? theme.text : theme.textMuted,
                      flex: 1,
                      paddingRight: spacing[3],
                    }}
                  >
                    {t("ai.mealProposalSectionTitle")}
                  </Text>
                  <Text
                    style={{
                      color: mealSectionOpen ? theme.text : theme.textMuted,
                      fontSize: 22,
                      lineHeight: 26,
                      fontWeight: "600",
                    }}
                  >
                    {mealSectionOpen ? "▾" : "▸"}
                  </Text>
                </Pressable>

                {mealSectionOpen &&
                typeof listId === "string" &&
                listQuery.data?.workspaceId ? (
                  <MealProposalComposer
                    listId={listId}
                    workspaceId={listQuery.data.workspaceId}
                    onGeneratingChange={onMealGeneratingChange}
                    hideTitle
                  />
                ) : null}
              </View>
            ) : null}

            <View style={{ marginTop: spacing[6] }}>
              <Pressable
                onPress={() => setManualAddOpen((open) => !open)}
                accessibilityRole="button"
                accessibilityState={{ expanded: manualAddOpen }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 44,
                }}
              >
                <Text
                  style={{
                    ...typography.headline,
                    color: manualAddOpen ? theme.text : theme.textMuted,
                  }}
                >
                  {t("list.addLabel")}
                </Text>
                <Text
                  style={{
                    color: manualAddOpen ? theme.text : theme.textMuted,
                    fontSize: 22,
                    lineHeight: 26,
                    fontWeight: "600",
                  }}
                >
                  {manualAddOpen ? "▾" : "▸"}
                </Text>
              </Pressable>

              {manualAddOpen ? (
                <View>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t("list.namePlaceholder")}
                    placeholderTextColor={theme.textMuted}
                    style={{
                      marginTop: spacing[3],
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: radius.md,
                      padding: spacing[4],
                      color: theme.text,
                    }}
                  />

                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={t("list.amountPlaceholder")}
                    placeholderTextColor={theme.textMuted}
                    style={{
                      marginTop: spacing[2],
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: radius.md,
                      padding: spacing[4],
                      color: theme.text,
                    }}
                  />

                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={t("list.notePlaceholder")}
                    placeholderTextColor={theme.textMuted}
                    style={{
                      marginTop: spacing[2],
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: radius.md,
                      padding: spacing[4],
                      color: theme.text,
                    }}
                  />

                  <View style={{ marginTop: spacing[5] }}>
                    <CategoryChips value={category} onChange={setCategory} />
                  </View>

                  <Pressable
                    disabled={createItem.isPending || !name.trim()}
                    onPress={() => {
                      Keyboard.dismiss();
                      createItem.mutate(
                        {
                          clientId: createClientId(),
                          name,
                          ...(amount.trim() ? { amount: amount.trim() } : {}),
                          ...(note.trim() ? { note: note.trim() } : {}),
                          category,
                        },
                        {
                          onSuccess: () => {
                            setName("");
                            setAmount("");
                            setNote("");
                            setCategory("other");
                            if (typeof listId === "string") {
                              clearListProvisional(listId);
                            }
                          },
                        },
                      );
                    }}
                    style={{
                      marginTop: spacing[4],
                      backgroundColor: theme.primary,
                      borderRadius: radius.md,
                      paddingVertical: spacing[4],
                      alignItems: "center",
                      opacity: createItem.isPending || !name.trim() ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ ...typography.label, color: "#fff" }}>
                      {t("list.addItem")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {isAiReviewEnabled() && reviewOperations.length ? (
              <View
                style={{
                  marginTop: spacing[6],
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  borderRadius: radius.lg,
                  padding: spacing[4],
                }}
              >
                <Text style={{ ...typography.title, color: theme.text }}>
                  {fastPathReady ? t("ai.fastPathTitle") : t("ai.reviewTitle")}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: theme.textMuted,
                    marginTop: spacing[2],
                  }}
                >
                  {reviewRunId ? `${t("ai.run")}: ${reviewRunId}` : ""}
                </Text>

                {fastPathReady ? (
                  <Text
                    style={{
                      ...typography.body,
                      color: theme.textMuted,
                      marginTop: spacing[3],
                    }}
                  >
                    {t("ai.fastPathBody")}
                  </Text>
                ) : null}

                <View style={{ marginTop: spacing[4], gap: spacing[3] }}>
                  {reviewOperations.map((operation) => (
                    <View
                      key={operation.proposalRowId}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: radius.md,
                        padding: spacing[3],
                      }}
                    >
                      <Text style={{ ...typography.label, color: theme.textMuted }}>
                        {operation.op.toUpperCase()} · {Math.round(operation.confidence * 100)}%
                      </Text>
                      <TextInput
                        value={operation.name}
                        onChangeText={(value) =>
                          setReviewOperations((current) =>
                            current.map((row) =>
                              row.proposalRowId === operation.proposalRowId
                                ? { ...row, name: value }
                                : row,
                            ),
                          )
                        }
                        style={{
                          marginTop: spacing[2],
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: radius.md,
                          padding: spacing[3],
                          color: theme.text,
                        }}
                      />
                      <TextInput
                        value={operation.amount ?? ""}
                        onChangeText={(value) =>
                          setReviewOperations((current) =>
                            current.map((row) =>
                              row.proposalRowId === operation.proposalRowId
                                ? { ...row, amount: value.trim() ? value : null }
                                : row,
                            ),
                          )
                        }
                        placeholder={t("list.amountPlaceholder")}
                        placeholderTextColor={theme.textMuted}
                        style={{
                          marginTop: spacing[2],
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: radius.md,
                          padding: spacing[3],
                          color: theme.text,
                        }}
                      />
                      <TextInput
                        value={operation.note ?? ""}
                        onChangeText={(value) =>
                          setReviewOperations((current) =>
                            current.map((row) =>
                              row.proposalRowId === operation.proposalRowId
                                ? { ...row, note: value.trim() ? value : null }
                                : row,
                            ),
                          )
                        }
                        placeholder={t("list.notePlaceholder")}
                        placeholderTextColor={theme.textMuted}
                        style={{
                          marginTop: spacing[2],
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: radius.md,
                          padding: spacing[3],
                          color: theme.text,
                        }}
                      />
                      <View style={{ marginTop: spacing[3] }}>
                        <CategoryChips
                          showLabel={false}
                          value={operation.category}
                          onChange={(value) =>
                            setReviewOperations((current) =>
                              current.map((row) =>
                                row.proposalRowId === operation.proposalRowId
                                  ? { ...row, category: value }
                                  : row,
                              ),
                            )
                          }
                        />
                      </View>
                      <Pressable
                        onPress={() =>
                          setReviewOperations((current) =>
                            current.map((row) =>
                              row.proposalRowId === operation.proposalRowId
                                ? {
                                    ...row,
                                    op: "ignore",
                                    targetItemId: row.targetItemId ?? null,
                                  }
                                : row,
                            ),
                          )
                        }
                        style={{ marginTop: spacing[2], alignSelf: "flex-start" }}
                      >
                        <Text style={{ ...typography.caption, color: theme.danger }}>
                          {t("ai.reject")}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>

                <Pressable
                  disabled={applyMutation.isPending}
                  onPress={() =>
                    reviewRunId
                      ? applyMutation.mutate({
                          runId: reviewRunId,
                          operations: reviewOperations,
                        })
                      : undefined
                  }
                  style={{
                    marginTop: spacing[4],
                    backgroundColor: theme.primary,
                    borderRadius: radius.md,
                    paddingVertical: spacing[4],
                    alignItems: "center",
                    opacity: applyMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text style={{ ...typography.label, color: "#fff" }}>
                    {fastPathReady ? t("ai.applyFastPath") : t("ai.acceptAll")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const workspaceId = listQuery.data?.workspaceId;
                    if (workspaceId && typeof listId === "string") {
                      Analytics.track("ai_import_rejected", {
                        workspace_id: workspaceId,
                        list_id: listId,
                        request_id: aiRequestIdRef.current ?? undefined,
                        source: aiSourceRef.current,
                      });
                    }
                    setSentryRequestId(null);
                    aiRequestIdRef.current = null;
                    aiOriginalOpsRef.current = [];
                    setReviewRunId(null);
                    setReviewOperations([]);
                  }}
                  style={{ marginTop: spacing[3], alignItems: "center" }}
                >
                  <Text style={{ ...typography.body, color: theme.textMuted }}>
                    {t("ai.cancelReview")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {categoriesOnList.length > 1 ? (
              <View style={{ marginTop: spacing[8] }}>
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.text,
                  }}
                >
                  {t("list.categoryOrderTitle")}
                </Text>
                <CategoryOrderHint>
                  {t(
                    Platform.OS === "web"
                      ? "list.categoryOrderHintWeb"
                      : "list.categoryOrderHint",
                  )}
                </CategoryOrderHint>
                <CategoryReorderList
                  data={categoriesOnList}
                  keyExtractor={(item) => item}
                  onReorder={onCategoryReorder}
                  renderItem={({ item, drag, isActive, moveUp, moveDown }) => (
                    <CategoryOrderEditRow
                      icon={getShoppingCategoryIcon(item)}
                      label={t(`categories.${item}`)}
                      onLongPress={drag}
                      isActive={isActive}
                      moveUp={moveUp}
                      moveDown={moveDown}
                    />
                  )}
                />
              </View>
            ) : null}

            <Text
              style={{
                ...typography.headline,
                color: theme.text,
                marginTop: spacing[8],
              }}
            >
              {t("list.itemsOnList")}
            </Text>

            {itemCount > 0 ? (
              <View style={{ marginTop: spacing[3] }}>
                <ListStatusFilterChips
                  value={statusFilter}
                  onChange={setStatusFilter}
                  counts={statusFilterCounts}
                />
              </View>
            ) : null}

            <View style={{ marginTop: spacing[3] }}>
              {itemCount > 0 ? (
                filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <ListItemRow
                      key={item.id}
                      item={item}
                      showDivider={index < filteredItems.length - 1}
                      onMenuPress={() => openItemMenu(item)}
                    />
                  ))
                ) : (
                  <Text
                    style={{
                      ...typography.body,
                      color: theme.textMuted,
                      textAlign: "center",
                      paddingVertical: spacing[6],
                    }}
                  >
                    {t("list.filterEmpty")}
                  </Text>
                )
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: spacing[8],
                    paddingHorizontal: spacing[4],
                  }}
                >
                  <Image
                    source={brandAssets.listEmpty}
                    style={{
                      width: 180,
                      height: 180,
                      marginBottom: spacing[4],
                      resizeMode: "contain",
                    }}
                    accessibilityLabel={t("list.emptyTitle")}
                  />
                  <Text
                    style={{
                      ...typography.headline,
                      color: theme.text,
                      textAlign: "center",
                    }}
                  >
                    {t("list.emptyTitle")}
                  </Text>
                  <Text
                    style={{
                      ...typography.body,
                      color: theme.textMuted,
                      textAlign: "center",
                      marginTop: spacing[2],
                    }}
                  >
                    {t("list.emptySubtitle")}
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              disabled={archiveList.isPending}
              onPress={confirmDeleteList}
              style={{
                marginTop: spacing[8],
                borderRadius: radius.lg,
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[4],
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: spacing[2],
                borderWidth: 1,
                borderColor: `${theme.danger}55`,
                backgroundColor: theme.surface,
                opacity: archiveList.isPending ? 0.6 : 1,
              }}
            >
              {archiveList.isPending ? (
                <ActivityIndicator color={`${theme.danger}AA`} />
              ) : (
                <>
                  <Text style={{ fontSize: 15, opacity: 0.75 }}>🗑️</Text>
                  <Text
                    style={{
                      ...typography.label,
                      fontWeight: "500",
                      color: `${theme.danger}CC`,
                    }}
                  >
                    {t("list.delete")}
                  </Text>
                </>
              )}
            </Pressable>
          </>
        )}
        </NestableScreenScroll>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.bg,
            paddingHorizontal: spacing[4],
            paddingTop: spacing[3],
            paddingBottom:
              Math.max(insets.bottom, spacing[2]) +
              spacing[3] +
              keyboardHeight,
          }}
        >
          <Pressable
            onPress={() => {
              if (typeof listId === "string" && itemCount > 0) {
                router.push(`/list/${listId}/shop`);
              }
            }}
            disabled={
              itemCount === 0 ||
              mealGenerating ||
              ingestMutation.isPending ||
              applyMutation.isPending
            }
            accessibilityRole="button"
            accessibilityState={{
              disabled:
                itemCount === 0 ||
                mealGenerating ||
                ingestMutation.isPending ||
                applyMutation.isPending,
            }}
            accessibilityLabel={
              mealGenerating ||
              ingestMutation.isPending ||
              applyMutation.isPending
                ? t("ai.mealProposalGenerating")
                : t("shoppingMode.startShopping")
            }
            style={{
              ...primaryButtonStyle(theme),
              borderRadius: radius.full,
              minHeight: 56,
              opacity:
                itemCount === 0 ||
                mealGenerating ||
                ingestMutation.isPending ||
                applyMutation.isPending
                  ? 0.45
                  : 1,
            }}
          >
            {mealGenerating ||
            ingestMutation.isPending ||
            applyMutation.isPending ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
                }}
              >
                <ActivityIndicator color={theme.onPrimary} />
                <Text style={{ ...typography.label, color: theme.onPrimary }}>
                  {mealGenerating
                    ? t("ai.mealProposalGenerating")
                    : t("ai.suggestLoadingCta")}
                </Text>
              </View>
            ) : (
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("shoppingMode.startShopping")}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <RenameListSheet
        key={renameOpen ? `rename-${listId}` : "rename-closed"}
        visible={renameOpen}
        initialName={listQuery.data?.name ?? ""}
        busy={updateList.isPending}
        onClose={() => setRenameOpen(false)}
        onSave={(name) => {
          updateList.mutate(
            { name },
            {
              onSuccess: () => setRenameOpen(false),
            },
          );
        }}
      />

      <EditItemSheet
        key={editingItem?.id ?? "edit-closed"}
        visible={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(input) => {
          if (!editingItem) return;
          updateItem.mutate({
            itemId: editingItem.id,
            name: input.name,
            amount: input.amount,
            note: input.note,
            category: input.category,
          });
        }}
        onDelete={() => {
          if (!editingItem) return;
          const item = editingItem;
          Alert.alert(t("list.removeItemTitle"), t("list.removeItemBody"), [
            { text: t("list.deleteCancel"), style: "cancel" },
            {
              text: t("list.removeItemConfirm"),
              style: "destructive",
              onPress: () => {
                setEditingItem(null);
                updateItem.mutate({ itemId: item.id, status: "removed" });
              },
            },
          ]);
        }}
      />

      <DeleteListDialog
        visible={deleteOpen}
        listName={listQuery.data?.name ?? t("list.title")}
        busy={archiveList.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={performDeleteList}
      />
    </>
  );
}
