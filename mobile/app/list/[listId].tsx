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
  Alert,
  ActivityIndicator,
  Image,
  InteractionManager,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  type ScrollView,
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
import { FeedbackSheet } from "@/components/feedback-sheet";
import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { primaryButtonStyle } from "@/design-system/shopping-density";
import { brand, colors, radius, spacing, typography } from "@/design-system/tokens";
import { AiPhaseCrossfade, LoadingTransition, useReducedMotion } from "@/lib/motion";
import { motionEasing, resolveDuration } from "@/design-system/motion";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { applyAi, ingestAi } from "@/features/ai/api";
import { buildScreenshotIngestFormData } from "@/features/ai/buildScreenshotIngestFormData";
import { MealProposalComposer } from "@/features/ai/meal-proposal-composer";
import { MicIcon } from "@/features/ai/mic-icon";
import type { ProposalOperation } from "@/features/ai/schemas";
import { useSpeechDictation } from "@/features/ai/use-speech-dictation";
import { BackIcon } from "@/features/auth/auth-icons";
import { perfEnd, perfStart } from "@/lib/performance";
import {
  bumpAiCreditsOptimistic,
  invalidateAiCredits,
} from "@/features/billing/ai-credits-query";
import { useAiCredits } from "@/features/billing/useAiCredits";
import { PremiumHintRow } from "@/features/billing/premium-hint-row";
import { CategoryChips } from "@/features/shopping-item/category-chips";
import { getCategoryBadgeColors } from "@/features/shopping-item/category-badge-colors";
import { ProductNameFieldWithClear, ProductNameSuggestions } from "@/features/shopping-item/product-name-suggestions";
import {
  ItemsSortToggle,
  CategorySortIcon,
  DateSortIcon,
  type ItemsSortMode,
} from "@/features/shopping-item/items-sort-toggle";
import {
  resolveCatalogLabel,
  type CatalogProduct,
} from "@shared/product-catalog";
import { resolveAppLocale } from "@/lib/i18n";
import {
  ListStatusFilterChips,
  type ListStatusFilter,
} from "@/features/shopping-item/list-status-filter-chips";
import { EditItemSheet } from "@/features/shopping-item/edit-item-sheet";
import { RemoteChangeToast, useListRealtime } from "@/lib/realtime";
import { ListItemRow } from "@/features/shopping-item/list-item-row";
import { shoppingItemsQueryKey, shoppingItemsQueryPrefix } from "@/features/shopping-item/query-keys";
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
import {
  historyRepeat,
  historyRepeatCompleted,
  historyRestore,
} from "@/features/history/historyTelemetry";
import {
  useRepeatHistoryList,
  useRestoreHistoryList,
} from "@/features/history/useHistoryLists";
import { takePendingListImport } from "@/features/shopping-list/pending-list-import";
import { takePendingCreateDraft } from "@/features/shopping-list/pending-create-draft";
import { takePendingListFocus } from "@/features/shopping-list/pending-list-focus";
import { completeCreateListHandoff } from "@/features/shopping-list/create-list-handoff";
import {
  takePendingScrollToItems,
} from "@/features/shopping-list/pending-scroll-to-items";
import { takePendingAiImportToast } from "@/features/shopping-list/pending-ai-import-toast";
import {
  clearListProvisional,
  isListProvisional,
} from "@/features/shopping-list/provisional-list";
import { RenameListSheet } from "@/features/shopping-list/rename-list-sheet";
import { ListEditCategoryOrderSection } from "@/features/shopping-list/list-edit-category-order-section";
import {
  resolveListLifecycleStatus,
  type ListLifecycleStatus,
} from "@/features/shopping-list/list-lifecycle-status";
import { ListStatusBadge } from "@/features/shopping-list/list-status-badge";
import { NestableScreenScroll } from "@/features/shopping-list/nestable-screen-scroll";
import { useResumableSessions } from "@/features/shopping-list/session/useResumableSessions";
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
import { goRoot, navigateBack, openTask } from "@/lib/navigation";
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
      };
    }

    if (operation.op === "merge") {
      return {
        op: "merge" as const,
        proposalRowId: operation.proposalRowId,
        targetItemId: operation.targetItemId ?? "",
      };
    }

    return {
      op: "update" as const,
      proposalRowId: operation.proposalRowId,
      targetItemId: operation.targetItemId ?? "",
    };
  });
}

export default function ShoppingListScreen() {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const router = useRouter();
  const navigation = useNavigation();
  const { showInsufficientCredits, showError } = useAppResult();
  const { listId, import: importSource } = useLocalSearchParams<{
    listId: string;
    import?: string;
  }>();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const importTriggered = useRef(false);
  const aiRequestIdRef = useRef<string | null>(null);
  const aiSourceRef = useRef<AiImportSource>("text");
  const lastIngestFormDataRef = useRef<FormData | null>(null);
  const aiOriginalOpsRef = useRef<ProposalOperation[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("other");
  const [categoryChipsKey, setCategoryChipsKey] = useState(0);
  type FooterToast =
    | {
        kind: "added" | "updated" | "removed";
        name: string;
        category: ShoppingCategory;
        amount?: string;
        note?: string;
        nonce: number;
      }
    | {
        kind: "sort";
        sortMode: ItemsSortMode;
        nonce: number;
      }
    | {
        kind: "ai-import";
        count: number;
        nonce: number;
      };
  const [itemFooterToast, setItemFooterToast] = useState<FooterToast | null>(
    null,
  );
  const [itemFooterToastRendered, setItemFooterToastRendered] =
    useState<FooterToast | null>(null);

  const showItemFooterToast = useCallback(
    (input: Omit<Extract<FooterToast, { kind: "added" | "updated" | "removed" }>, "nonce">) => {
      setItemFooterToast({ ...input, nonce: Date.now() });
    },
    [],
  );

  const showSortFooterToast = useCallback((sortMode: ItemsSortMode) => {
    setItemFooterToast({ kind: "sort", sortMode, nonce: Date.now() });
  }, []);

  const showAiImportFooterToast = useCallback((count: number) => {
    if (count < 1) return;
    setItemFooterToast({ kind: "ai-import", count, nonce: Date.now() });
  }, []);
  const [aiText, setAiText] = useState("");
  const {
    isAvailable: isDictateAvailable,
    isListening: isDictating,
    toggle: toggleDictate,
    stop: stopDictate,
  } = useSpeechDictation({
    text: aiText,
    onTranscript: setAiText,
  });
  const [reviewRunId, setReviewRunId] = useState<string | null>(null);
  const [reviewOperations, setReviewOperations] = useState<ProposalOperation[]>([]);
  const [renameOpen, setRenameOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [aiSectionOpen, setAiSectionOpen] = useState(false);
  const [mealSectionOpen, setMealSectionOpen] = useState(false);
  const [itemsSortMode, setItemsSortMode] =
    useState<ItemsSortMode>("category");
  const [nameFieldFocused, setNameFieldFocused] = useState(false);
  const nameBlurHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [finishedFeedback, setFinishedFeedback] = useState<
    "restored" | "limit" | null
  >(null);
  const [removeItemTarget, setRemoveItemTarget] = useState<ShoppingItem | null>(
    null,
  );
  const [mealGenerating, setMealGenerating] = useState(false);
  const [aiPhase, setAiPhase] = useState<
    "idle" | "uploading" | "analyzing" | "applying"
  >("idle");
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>("all");
  const entryFocusApplied = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const itemsSectionRef = useRef<View>(null);
  const aiSectionRef = useRef<View>(null);
  const mealSectionRef = useRef<View>(null);
  const manualAddSectionRef = useRef<View>(null);
  const composerFocusedRef = useRef(false);
  const composerFocusTokenRef = useRef(0);
  const composerSectionRef = useRef<"ai" | "meal" | "manual" | null>(null);
  const [composerKeyboardOpen, setComposerKeyboardOpen] = useState(false);
  /** Set after AI apply; scroll runs only once items are on screen (not empty state). */
  const pendingScrollToItemsRef = useRef(false);
  const scrollAnimFrameRef = useRef<number | null>(null);
  const onMealGeneratingChange = useCallback((generating: boolean) => {
    setMealGenerating(generating);
  }, []);

  const reduceMotion = useReducedMotion();
  const footerSlideWidth = useSharedValue(320);
  const ctaTranslateX = useSharedValue(0);
  const toastTranslateX = useSharedValue(0);

  useEffect(() => {
    if (!itemFooterToast) return;
    queueMicrotask(() => {
      const width = Math.max(footerSlideWidth.value, 1);
      // Start off-screen left before first paint of the toast.
      toastTranslateX.value = reduceMotion ? 0 : -width;
      setItemFooterToastRendered(itemFooterToast);
    });
  }, [itemFooterToast, footerSlideWidth, toastTranslateX, reduceMotion]);

  useEffect(() => {
    if (!itemFooterToast) return;
    const handle = setTimeout(() => setItemFooterToast(null), 2800);
    return () => clearTimeout(handle);
  }, [itemFooterToast?.nonce, itemFooterToast]);

  useEffect(() => {
    if (!itemFooterToastRendered) return;

    const width = Math.max(footerSlideWidth.value, 1);
    const duration = resolveDuration("emphasis", { reduceMotion });
    const easing = motionEasing.outCubic;

    if (itemFooterToast != null) {
      // CTA slides out to the right; toast slides in from the left.
      if (reduceMotion) {
        ctaTranslateX.value = width;
        toastTranslateX.value = 0;
        return;
      }
      toastTranslateX.value = -width;
      ctaTranslateX.value = withTiming(width, { duration, easing });
      toastTranslateX.value = withTiming(0, { duration, easing });
      return;
    }

    // Toast slides out to the right; CTA returns from the left.
    const clearRendered = () => setItemFooterToastRendered(null);
    if (reduceMotion) {
      ctaTranslateX.value = 0;
      toastTranslateX.value = width;
      clearRendered();
      return;
    }
    ctaTranslateX.value = -width;
    toastTranslateX.value = withTiming(width, { duration, easing });
    ctaTranslateX.value = withTiming(0, { duration, easing }, (finished) => {
      if (finished) runOnJS(clearRendered)();
    });
  }, [
    itemFooterToast,
    itemFooterToastRendered,
    reduceMotion,
    footerSlideWidth,
    ctaTranslateX,
    toastTranslateX,
  ]);

  const startShoppingCtaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ctaTranslateX.value }],
  }));
  const itemFooterToastAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toastTranslateX.value }],
  }));

  useEffect(() => {
    return () => {
      if (nameBlurHideTimerRef.current) {
        clearTimeout(nameBlurHideTimerRef.current);
      }
    };
  }, []);

  const cancelSmoothScroll = useCallback(() => {
    if (scrollAnimFrameRef.current != null) {
      cancelAnimationFrame(scrollAnimFrameRef.current);
      scrollAnimFrameRef.current = null;
    }
  }, []);

  const smoothScrollToY = useCallback(
    (targetY: number, durationMs: number) => {
      const scroll = scrollRef.current;
      if (!scroll) return;
      cancelSmoothScroll();
      const startY = scrollYRef.current;
      const delta = targetY - startY;
      if (Math.abs(delta) < 2) return;

      const startTime = Date.now();
      const step = () => {
        const t = Math.min(1, (Date.now() - startTime) / durationMs);
        const eased = 1 - (1 - t) ** 3;
        const y = startY + delta * eased;
        scroll.scrollTo({ y, animated: false });
        scrollYRef.current = y;
        if (t < 1) {
          scrollAnimFrameRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimFrameRef.current = null;
        }
      };
      scrollAnimFrameRef.current = requestAnimationFrame(step);
    },
    [cancelSmoothScroll],
  );

  const measureViewY = useCallback((target: View | ScrollView): Promise<number> => {
    return new Promise((resolve) => {
      (
        target as unknown as {
          measureInWindow: (
            cb: (x: number, y: number, w: number, h: number) => void,
          ) => void;
        }
      ).measureInWindow((_x, y) => resolve(y));
    });
  }, []);

  const scrollItemsSectionToTop = useCallback(() => {
    const scroll = scrollRef.current;
    const section = itemsSectionRef.current;
    if (!scroll || !section) return;

    void (async () => {
      const scrollTop = await measureViewY(scroll);
      const sectionTop = await measureViewY(section);
      const delta = sectionTop - scrollTop;
      smoothScrollToY(Math.max(0, scrollYRef.current + delta), 700);
    })();
  }, [measureViewY, smoothScrollToY]);

  /**
   * Pin the focused composer section (AI / recipe / manual add) to the top of the
   * scroll viewport so fields and the section CTA stay visible above the keyboard.
   */
  const scrollComposerSectionToTop = useCallback(() => {
    const scroll = scrollRef.current;
    const sectionKey = composerSectionRef.current;
    const section =
      sectionKey === "ai"
        ? aiSectionRef.current
        : sectionKey === "meal"
          ? mealSectionRef.current
          : sectionKey === "manual"
            ? manualAddSectionRef.current
            : null;
    if (!scroll || !section) return;

    void (async () => {
      const scrollTop = await measureViewY(scroll);
      const sectionTop = await measureViewY(section);
      const delta = sectionTop - scrollTop;
      if (Math.abs(delta) < 2) return;
      smoothScrollToY(Math.max(0, scrollYRef.current + delta), 420);
    })();
  }, [measureViewY, smoothScrollToY]);

  const scheduleComposerScroll = useCallback(() => {
    const delay = Platform.OS === "ios" ? 90 : 160;
    setTimeout(() => scrollComposerSectionToTop(), delay);
    setTimeout(() => scrollComposerSectionToTop(), delay + 220);
  }, [scrollComposerSectionToTop]);

  const onComposerFieldFocus = useCallback(
    (section: "ai" | "meal" | "manual") => {
      composerFocusTokenRef.current += 1;
      composerFocusedRef.current = true;
      composerSectionRef.current = section;
      setComposerKeyboardOpen(true);
      scheduleComposerScroll();
    },
    [scheduleComposerScroll],
  );

  const onComposerFieldBlur = useCallback(() => {
    const token = composerFocusTokenRef.current;
    setTimeout(() => {
      if (composerFocusTokenRef.current !== token) return;
      composerFocusedRef.current = false;
      composerSectionRef.current = null;
      setComposerKeyboardOpen(false);
    }, 80);
  }, []);

  /** Queue scroll; actual scroll waits until products are rendered. */
  const requestScrollToItems = useCallback(() => {
    // AI-driven adds: keep aisle grouping as the default view.
    setItemsSortMode("category");
    pendingScrollToItemsRef.current = true;
  }, []);

  const onManualItemAdded = useCallback(() => {
    // Manual add: show newest activity first so the new row is on top.
    setItemsSortMode("date");
  }, []);

  const onItemsSortModeChange = useCallback(
    (mode: ItemsSortMode) => {
      if (mode === itemsSortMode) return;
      setItemsSortMode(mode);
      showSortFooterToast(mode);
    },
    [itemsSortMode, showSortFooterToast],
  );

  const onListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  useEffect(() => () => cancelSmoothScroll(), [cancelSmoothScroll]);

  useEffect(() => {
    if (keyboardHeight <= 0) {
      composerFocusedRef.current = false;
      composerSectionRef.current = null;
      return;
    }
    if (composerFocusedRef.current) {
      scheduleComposerScroll();
    }
  }, [keyboardHeight, scheduleComposerScroll]);

  const listQuery = useQuery({
    queryKey: ["shopping-list", listId, "allow-archived"],
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
      return getShoppingList(token, listId, { allowArchived: true });
    },
  });

  const isFinishedList = listQuery.data?.status === "archived";
  const composerSectionsDisabled = isFinishedList;

  useEffect(() => {
    if (!composerSectionsDisabled) return;
    // Defer so we don't sync-setState inside the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setAiSectionOpen(false);
      setMealSectionOpen(false);
      setManualAddOpen(false);
      stopDictate();
    });
  }, [composerSectionsDisabled, stopDictate]);

  const sessionsQuery = useResumableSessions(Boolean(isSignedIn));
  const listLifecycleStatus = useMemo((): ListLifecycleStatus | null => {
    const list = listQuery.data;
    if (!list) return null;
    const hasResumableSession = (sessionsQuery.data ?? []).some(
      (session) => session.listId === list.id,
    );
    return resolveListLifecycleStatus({
      status: list.status,
      hasResumableSession,
    });
  }, [listQuery.data, sessionsQuery.data]);

  const creditsQuery = useAiCredits(listQuery.data?.workspaceId ?? null);

  useListRealtime(typeof listId === "string" ? listId : null, {
    workspaceId: listQuery.data?.workspaceId ?? null,
  });
  const itemsQuery = useShoppingItems(
    typeof listId === "string" ? listId : null,
    Boolean(isSignedIn) && !listQuery.isError && listQuery.isSuccess,
    { allowArchived: listQuery.data?.status === "archived" },
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
  const repeatMutation = useRepeatHistoryList(
    listQuery.data?.workspaceId ?? null,
  );
  const restoreMutation = useRestoreHistoryList(
    listQuery.data?.workspaceId ?? null,
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

      setAiPhase("applying");
      perfStart("ai.apply", {
        id: listId,
        labels: { ops: input.operations.length },
      });
      const result = await applyAi(token, listId, {
        runId: input.runId,
        operations: buildApplyOperations(input.operations),
      });

      queryClient.setQueryData(
        shoppingItemsQueryKey(listId, "active"),
        result.items,
      );
      return result;
    },
    onError: (error) => {
      perfEnd("ai.apply", {
        id: typeof listId === "string" ? listId : undefined,
        labels: { ok: false },
      });
      setAiPhase("idle");
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
    onSuccess: (result, variables) => {
      perfEnd("ai.apply", {
        id: typeof listId === "string" ? listId : undefined,
        labels: {
          ok: true,
          ops: variables.operations.length,
        },
      });
      setAiPhase("idle");
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
        void queryClient.invalidateQueries({
          queryKey: ["shopping-lists", workspaceId],
        });
      }
      if (result.applied >= 1) {
        showAiImportFooterToast(result.applied);
        requestScrollToItems();
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
      perfEnd("ai.ingest", {
        id: typeof listId === "string" ? listId : undefined,
        labels: { ok: false },
      });
      setAiPhase("idle");
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
        showError({
          title: t("list.missingTitle"),
          description: t("list.missingBody"),
          primaryLabel: t("invite.goHome"),
          onPrimary: () => goRoot(),
        });
        return;
      }

      const retryFormData = lastIngestFormDataRef.current;
      const retrySource = aiSourceRef.current;
      showError({
        title: t("ai.unavailableTitle"),
        description: t("ai.unavailableBody"),
        image: brandAssets.aiUnavailable,
        primaryLabel: t("common.tryAgain"),
        secondaryLabel: t("common.return"),
        onPrimary: () => {
          if (!retryFormData || typeof listId !== "string") return;
          const workspaceId = listQuery.data?.workspaceId;
          if (!workspaceId) return;
          const requestId = createRequestId();
          aiRequestIdRef.current = requestId;
          aiSourceRef.current = retrySource;
          lastIngestFormDataRef.current = retryFormData;
          setSentryRequestId(requestId);
          setAiPhase(retrySource === "screenshot" ? "uploading" : "analyzing");
          perfStart("ai.ingest", {
            id: listId,
            labels: { source: retrySource },
          });
          Analytics.track("ai_import_started", {
            workspace_id: workspaceId,
            list_id: listId,
            request_id: requestId,
            source: retrySource,
          });
          ingestMutation.mutate(retryFormData);
        },
        onSecondary: () => goRoot(),
      });
    },
    onSuccess: (result) => {
      const workspaceIdForCredits = listQuery.data?.workspaceId;
      if (workspaceIdForCredits) {
        bumpAiCreditsOptimistic(queryClient, workspaceIdForCredits);
        invalidateAiCredits(queryClient, workspaceIdForCredits);
      }

      const title =
        result.proposal.shoppingContext?.title?.trim().slice(0, 32) ?? "";

      // Backend renames untitled lists on ingest - refresh header immediately.
      if (typeof listId === "string" && title) {
        const workspaceIdForLists = listQuery.data?.workspaceId;
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
        if (workspaceIdForLists) {
          void queryClient.invalidateQueries({
            queryKey: ["shopping-lists", workspaceIdForLists],
          });
        }
      }

      aiOriginalOpsRef.current = result.proposal.operations.map((op) => ({
        ...op,
      }));

      if (isAiReviewEnabled()) {
        perfEnd("ai.ingest", {
          id: typeof listId === "string" ? listId : undefined,
          labels: { ok: true, review: true },
        });
        setAiPhase("idle");
        setReviewRunId(result.runId);
        setReviewOperations(result.proposal.operations);
        return;
      }

      perfEnd("ai.ingest", {
        id: typeof listId === "string" ? listId : undefined,
        labels: { ok: true },
      });
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
        queryClient.getQueryData<ShoppingItem[]>(
          shoppingItemsQueryKey(listId, "active"),
        ) ?? [];
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

  useEffect(() => {
    if (typeof listId !== "string") return;
    perfStart("list.open", { id: listId });
  }, [listId]);

  useEffect(() => {
    if (typeof listId !== "string") return;
    if (isPending) return;
    perfEnd("list.open", {
      id: listId,
      warm: Boolean(itemsQuery.dataUpdatedAt && !itemsQuery.isFetching),
    });
  }, [listId, isPending, itemsQuery.dataUpdatedAt, itemsQuery.isFetching]);

  const goHome = () => {
    goRoot();
  };

  const startAiIngest = (source: AiImportSource, formData: FormData) => {
    const workspaceId = listQuery.data?.workspaceId;
    if (!workspaceId || typeof listId !== "string") return;
    const requestId = createRequestId();
    aiRequestIdRef.current = requestId;
    aiSourceRef.current = source;
    lastIngestFormDataRef.current = formData;
    setSentryRequestId(requestId);
    setAiPhase(source === "screenshot" ? "uploading" : "analyzing");
    perfStart("ai.ingest", { id: listId, labels: { source } });
    // After request leaves the client, treat as analyzing until apply.
    if (source === "screenshot") {
      setTimeout(() => {
        setAiPhase((phase) => (phase === "uploading" ? "analyzing" : phase));
      }, 400);
    }
    Analytics.track("ai_import_started", {
      workspace_id: workspaceId,
      list_id: listId,
      request_id: requestId,
      source,
    });
    ingestMutation.mutate(formData);
  };

  const startTextIngest = () => {
    stopDictate();
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
        // Smaller uploads → faster ingest + lower vision cost (perf audit Fala 2).
        quality: 0.55,
      });
      if (result.canceled) return;
      picked = result.assets[0];
    }
    try {
      setAiPhase("uploading");
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
      setAiPhase("idle");
      showError({
        title: t("ai.unavailableTitle"),
        description: t("ai.unavailableBody"),
        image: brandAssets.aiUnavailable,
        primaryLabel: t("common.tryAgain"),
        secondaryLabel: t("common.return"),
        onPrimary: () => {
          void startScreenshotIngest(picked);
        },
        onSecondary: () => goRoot(),
      });
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

  // Expand the section that matches how the list was opened (FAB path / shell).
  useEffect(() => {
    if (entryFocusApplied.current) return;
    if (!listQuery.isSuccess || typeof listId !== "string") return;
    entryFocusApplied.current = true;
    const draft = takePendingCreateDraft();
    const focus = takePendingListFocus(listId) ?? draft?.focus ?? null;
    // Defer so we don't sync-setState inside the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (draft?.aiText) setAiText(draft.aiText);
      if (focus === "ai") setAiSectionOpen(true);
      if (focus === "meal") setMealSectionOpen(true);
      if (focus === "manual") setManualAddOpen(true);
    });
  }, [listQuery.isSuccess, listId]);

  // Create FAB overlay stays until list paints — avoids Home flash under goRoot/push.
  useEffect(() => {
    if (typeof listId !== "string") return;
    if (isPending) return;
    const task = InteractionManager.runAfterInteractions(() => {
      completeCreateListHandoff();
    });
    return () => task.cancel();
  }, [listId, isPending]);

  // Meal proposal (and other off-screen AI apply) → scroll + toast on return.
  useEffect(() => {
    if (!listQuery.isSuccess || typeof listId !== "string") return;
    const importCount = takePendingAiImportToast(listId);
    const shouldScroll = takePendingScrollToItems(listId);
    if (importCount == null && !shouldScroll) return;
    // Defer so we don't sync-setState inside the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (importCount != null) {
        showAiImportFooterToast(importCount);
      }
      if (shouldScroll) {
        requestScrollToItems();
      }
    });
  }, [
    listQuery.isSuccess,
    listId,
    itemsQuery.isSuccess,
    requestScrollToItems,
    showAiImportFooterToast,
  ]);

  const fastPathReady =
    reviewOperations.length > 0 &&
    reviewOperations.every((operation) => operation.op === "merge") &&
    reviewOperations.every((operation) => operation.confidence >= 0.85);

  const categoryOrder = resolveShoppingCategoryOrder(
    listQuery.data?.categoryOrder,
  );
  const activeItems = useMemo(() => {
    const items = (itemsQuery.data ?? []).filter(
      (item) => item.status !== "removed",
    );
    return items.slice().sort((a, b) => {
      if (itemsSortMode === "date") {
        const aTime = Math.max(
          Date.parse(a.updatedAt) || 0,
          Date.parse(a.createdAt) || 0,
        );
        const bTime = Math.max(
          Date.parse(b.updatedAt) || 0,
          Date.parse(b.createdAt) || 0,
        );
        if (bTime !== aTime) return bTime - aTime;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      const byCategory =
        (aIndex === -1 ? categoryOrder.length : aIndex) -
        (bIndex === -1 ? categoryOrder.length : bIndex);
      if (byCategory !== 0) return byCategory;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [itemsQuery.data, categoryOrder, itemsSortMode]);
  const itemCount = activeItems.length;

  // Scroll only after products replaced the empty state (avoids scroll→empty→jump).
  useEffect(() => {
    if (!pendingScrollToItemsRef.current) return;
    if (itemCount <= 0) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled || !pendingScrollToItemsRef.current) return;
      pendingScrollToItemsRef.current = false;
      scrollItemsSectionToTop();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemCount, itemsQuery.dataUpdatedAt, scrollItemsSectionToTop]);

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

  const categoryItemCounts = useMemo(() => {
    const counts = new Map<SharedShoppingCategory, number>();
    for (const item of activeItems) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, [activeItems]);

  const onCategoryReorder = (data: SharedShoppingCategory[]) => {
    if (isFinishedList) return;
    const nextOrder = mergeActiveCategoryOrder(categoryOrder, data);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateList.mutate({ categoryOrder: nextOrder });
  };

  const handleFinishedListLimitError = (err: unknown) => {
    if (err instanceof ApiClientError && err.code === "HISTORY_LIMIT_EXCEEDED") {
      setFinishedFeedback("limit");
      return;
    }
    Alert.alert(
      t("history.actionFailed"),
      err instanceof Error ? err.message : undefined,
    );
  };

  const onRepeatFinishedList = () => {
    if (typeof listId !== "string" || !isFinishedList) return;
    historyRepeat(listId);
    repeatMutation.mutate(listId, {
      onSuccess: (created) => {
        historyRepeatCompleted({
          sourceListId: listId,
          newListId: created.id,
        });
        router.replace(`/list/${created.id}` as never);
      },
      onError: handleFinishedListLimitError,
    });
  };

  const onRestoreFinishedList = () => {
    if (typeof listId !== "string" || !isFinishedList) return;
    restoreMutation.mutate(listId, {
      onSuccess: async (restored) => {
        historyRestore(listId);
        queryClient.setQueryData(
          ["shopping-list", listId, "allow-archived"],
          restored,
        );
        queryClient.setQueryData(["shopping-list", listId], restored);
        await queryClient.invalidateQueries({
          queryKey: shoppingItemsQueryPrefix(listId),
        });
        setFinishedFeedback("restored");
      },
      onError: handleFinishedListLimitError,
    });
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
      goRoot();
    });
  };

  const openItemMenu = (item: ShoppingItem) => {
    setEditingItem(item);
  };

  const footerPad =
    spacing[3] + 56 + spacing[3] + Math.max(insets.bottom, spacing[2]);
  const hideStickyForComposer =
    composerKeyboardOpen && keyboardHeight > 0;
  const scrollBottomPad = hideStickyForComposer
    ? keyboardHeight + Math.max(insets.bottom, spacing[2]) + spacing[8]
    : footerPad + spacing[4];
  const footerToastAccent =
    itemFooterToastRendered?.kind === "removed" ? theme.danger : theme.primary;
  const footerToastIsSort = itemFooterToastRendered?.kind === "sort";
  const footerToastIsAiImport = itemFooterToastRendered?.kind === "ai-import";
  const footerToastLabelKey = footerToastIsSort
    ? "list.sortChangedToastLabel"
    : footerToastIsAiImport
      ? "list.aiImportToastLabel"
      : itemFooterToastRendered?.kind === "added"
        ? "list.itemAddedToastLabel"
        : itemFooterToastRendered?.kind === "updated"
          ? "list.itemUpdatedToastLabel"
          : "list.itemRemovedToastLabel";
  const footerToastSubtitleKey = footerToastIsSort
    ? itemFooterToastRendered.sortMode === "category"
      ? "list.sortChangedCategoryToast"
      : "list.sortChangedDateToast"
    : footerToastIsAiImport
      ? "list.aiImportToast"
      : null;
  const footerToastA11yKey = footerToastIsSort
    ? itemFooterToastRendered.sortMode === "category"
      ? "list.sortChangedCategoryToastA11y"
      : "list.sortChangedDateToastA11y"
    : footerToastIsAiImport
      ? "list.aiImportToastA11y"
      : itemFooterToastRendered?.kind === "added"
        ? "list.itemAddedToast"
        : itemFooterToastRendered?.kind === "updated"
          ? "list.itemUpdatedToast"
          : "list.itemRemovedToast";
  const footerToastMark =
    itemFooterToastRendered?.kind === "removed" ? "✕" : "✓";
  const sortFooterToast =
    itemFooterToastRendered?.kind === "sort" ? itemFooterToastRendered : null;
  const aiImportFooterToast =
    itemFooterToastRendered?.kind === "ai-import"
      ? itemFooterToastRendered
      : null;
  const itemActionFooterToast =
    itemFooterToastRendered &&
    itemFooterToastRendered.kind !== "sort" &&
    itemFooterToastRendered.kind !== "ai-import"
      ? itemFooterToastRendered
      : null;

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
                if (router.canGoBack()) navigateBack();
                else goRoot();
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
                disabled={!listQuery.data || isFinishedList}
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: spacing[2],
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: theme.textMuted,
                    }}
                  >
                    {t("list.itemCount", { count: itemCount })}
                  </Text>
                  {listLifecycleStatus ? (
                    <ListStatusBadge status={listLifecycleStatus} />
                  ) : null}
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <NestableScreenScroll
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: spacing[5],
            paddingBottom: scrollBottomPad,
          }}
          keyboardShouldPersistTaps="handled"
          onScroll={onListScroll}
          scrollEventThrottle={16}
        >
        <LoadingTransition
          variant="inline"
          loading={isPending}
          skeleton={<ListDetailSkeleton />}
        >
        {listMissing || listQuery.isError ? (
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
            <View
              ref={aiSectionRef}
              collapsable={false}
              style={{ opacity: composerSectionsDisabled ? 0.45 : 1 }}
            >
              <Pressable
                disabled={composerSectionsDisabled}
                onPress={() => {
                  if (composerSectionsDisabled) return;
                  setAiSectionOpen((open) => {
                    if (open) stopDictate();
                    return !open;
                  });
                }}
                accessibilityRole="button"
                accessibilityState={{
                  expanded: composerSectionsDisabled ? false : aiSectionOpen,
                  disabled: composerSectionsDisabled,
                }}
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
                    color:
                      composerSectionsDisabled || !aiSectionOpen
                        ? theme.textMuted
                        : theme.text,
                    flex: 1,
                    paddingRight: spacing[3],
                  }}
                >
                  {t("ai.quickAddTitle")}
                </Text>
                <Text
                  style={{
                    color:
                      composerSectionsDisabled || !aiSectionOpen
                        ? theme.textMuted
                        : theme.text,
                    fontSize: 22,
                    lineHeight: 26,
                    fontWeight: "600",
                  }}
                >
                  {composerSectionsDisabled || !aiSectionOpen ? "▸" : "▾"}
                </Text>
              </Pressable>

              {aiSectionOpen && !composerSectionsDisabled ? (
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

                  <View style={{ marginTop: spacing[4], position: "relative" }}>
                    <TextInput
                      value={aiText}
                      onChangeText={setAiText}
                      onFocus={() => onComposerFieldFocus("ai")}
                      onBlur={onComposerFieldBlur}
                      multiline
                      placeholder={t("ai.textPlaceholder")}
                      placeholderTextColor={theme.textMuted}
                      editable={
                        !ingestMutation.isPending && !applyMutation.isPending
                      }
                      style={{
                        minHeight: 96,
                        borderWidth: 1,
                        borderColor: isDictating
                          ? theme.primary
                          : theme.border,
                        backgroundColor: theme.surface,
                        borderRadius: radius.lg,
                        paddingTop: spacing[4],
                        paddingBottom: spacing[4] + 36,
                        paddingLeft: spacing[4],
                        paddingRight: spacing[4] + 36,
                        color: theme.text,
                        textAlignVertical: "top",
                      }}
                    />
                    <Pressable
                      disabled={
                        ingestMutation.isPending ||
                        applyMutation.isPending ||
                        (!isDictateAvailable && !isDictating)
                      }
                      onPress={toggleDictate}
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        isDictating ? "ai.dictateStop" : "ai.dictateStart",
                      )}
                      hitSlop={8}
                      style={{
                        position: "absolute",
                        right: spacing[2],
                        bottom: spacing[2],
                        width: 40,
                        height: 40,
                        borderRadius: radius.md,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDictating
                          ? `${theme.danger}22`
                          : `${theme.primary}14`,
                        opacity:
                          ingestMutation.isPending ||
                          applyMutation.isPending ||
                          (!isDictateAvailable && !isDictating)
                            ? 0.45
                            : 1,
                      }}
                    >
                      <MicIcon
                        color={isDictating ? theme.danger : theme.primary}
                        size={20}
                      />
                    </Pressable>
                  </View>

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

                  {creditsQuery.data && !creditsQuery.data.unlimited ? (
                    <View style={{ marginTop: spacing[2] }}>
                      <PremiumHintRow
                        label={t("billing.aiCredits")}
                        badge={t("billing.creditsRemainingBadge", {
                          remaining: creditsQuery.data.remaining ?? 0,
                        })}
                        onPress={() => router.push("/premium")}
                        accessibilityLabel={t("billing.upgradeCta")}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            {isMealProposalEnabled() ? (
              <View
                ref={mealSectionRef}
                collapsable={false}
                style={{
                  marginTop: spacing[6],
                  opacity: composerSectionsDisabled ? 0.45 : 1,
                }}
              >
                <Pressable
                  disabled={composerSectionsDisabled}
                  onPress={() => {
                    if (composerSectionsDisabled) return;
                    setMealSectionOpen((open) => !open);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{
                    expanded: composerSectionsDisabled ? false : mealSectionOpen,
                    disabled: composerSectionsDisabled,
                  }}
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
                      color:
                        composerSectionsDisabled || !mealSectionOpen
                          ? theme.textMuted
                          : theme.text,
                      flex: 1,
                      paddingRight: spacing[3],
                    }}
                  >
                    {t("ai.mealProposalSectionTitle")}
                  </Text>
                  <Text
                    style={{
                      color:
                        composerSectionsDisabled || !mealSectionOpen
                          ? theme.textMuted
                          : theme.text,
                      fontSize: 22,
                      lineHeight: 26,
                      fontWeight: "600",
                    }}
                  >
                    {composerSectionsDisabled || !mealSectionOpen ? "▸" : "▾"}
                  </Text>
                </Pressable>

                {mealSectionOpen &&
                !composerSectionsDisabled &&
                typeof listId === "string" &&
                listQuery.data?.workspaceId ? (
                  <MealProposalComposer
                    listId={listId}
                    workspaceId={listQuery.data.workspaceId}
                    onGeneratingChange={onMealGeneratingChange}
                    onFieldFocus={() => onComposerFieldFocus("meal")}
                    onFieldBlur={onComposerFieldBlur}
                    hideTitle
                  />
                ) : null}
              </View>
            ) : null}

            <View
              ref={manualAddSectionRef}
              collapsable={false}
              style={{
                marginTop: spacing[6],
                opacity: composerSectionsDisabled ? 0.45 : 1,
              }}
            >
              <Pressable
                disabled={composerSectionsDisabled}
                onPress={() => {
                  if (composerSectionsDisabled) return;
                  setManualAddOpen((open) => !open);
                }}
                accessibilityRole="button"
                accessibilityState={{
                  expanded: composerSectionsDisabled ? false : manualAddOpen,
                  disabled: composerSectionsDisabled,
                }}
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
                    color:
                      composerSectionsDisabled || !manualAddOpen
                        ? theme.textMuted
                        : theme.text,
                  }}
                >
                  {t("list.addLabel")}
                </Text>
                <Text
                  style={{
                    color:
                      composerSectionsDisabled || !manualAddOpen
                        ? theme.textMuted
                        : theme.text,
                    fontSize: 22,
                    lineHeight: 26,
                    fontWeight: "600",
                  }}
                >
                  {composerSectionsDisabled || !manualAddOpen ? "▸" : "▾"}
                </Text>
              </Pressable>

              {manualAddOpen && !composerSectionsDisabled ? (
                <View>
                  <ProductNameFieldWithClear
                    query={name}
                    focused={nameFieldFocused}
                    onClear={() => setName("")}
                    style={{ marginTop: spacing[3] }}
                  >
                    {(clearVisible) => (
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        onFocus={() => {
                          if (nameBlurHideTimerRef.current) {
                            clearTimeout(nameBlurHideTimerRef.current);
                            nameBlurHideTimerRef.current = null;
                          }
                          setNameFieldFocused(true);
                          onComposerFieldFocus("manual");
                        }}
                        onBlur={() => {
                          onComposerFieldBlur();
                          // Delay hide so suggestion / clear taps can complete.
                          nameBlurHideTimerRef.current = setTimeout(() => {
                            setNameFieldFocused(false);
                            nameBlurHideTimerRef.current = null;
                          }, 180);
                        }}
                        placeholder={t("list.namePlaceholder")}
                        placeholderTextColor={theme.textMuted}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                          borderRadius: radius.md,
                          padding: spacing[4],
                          paddingRight: clearVisible
                            ? spacing[4] + 36
                            : spacing[4],
                          color: theme.text,
                        }}
                      />
                    )}
                  </ProductNameFieldWithClear>

                  <ProductNameSuggestions
                    query={name}
                    visible={nameFieldFocused && !createItem.isPending}
                    onSelect={(product: CatalogProduct) => {
                      if (createItem.isPending) return;
                      if (nameBlurHideTimerRef.current) {
                        clearTimeout(nameBlurHideTimerRef.current);
                        nameBlurHideTimerRef.current = null;
                      }
                      setNameFieldFocused(false);
                      Keyboard.dismiss();
                      const locale = resolveAppLocale(i18n.language);
                      const addedName = resolveCatalogLabel(product, locale);
                      const addedAmount = amount.trim();
                      const addedNote = note.trim();
                      const addedCategory = product.category as ShoppingCategory;
                      setName(addedName);
                      createItem.mutate(
                        {
                          clientId: createClientId(),
                          name: addedName,
                          ...(addedAmount ? { amount: addedAmount } : {}),
                          ...(addedNote ? { note: addedNote } : {}),
                          category: addedCategory,
                        },
                        {
                          onSuccess: () => {
                            onManualItemAdded();
                            setName("");
                            setAmount("");
                            setNote("");
                            setCategory("other");
                            setCategoryChipsKey((key) => key + 1);
                            showItemFooterToast({
                              kind: "added",
                              name: addedName,
                              category: addedCategory,
                              ...(addedAmount ? { amount: addedAmount } : {}),
                              ...(addedNote ? { note: addedNote } : {}),
                            });
                            if (typeof listId === "string") {
                              clearListProvisional(listId);
                            }
                          },
                        },
                      );
                    }}
                  />

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "stretch",
                      gap: spacing[2],
                      marginTop: spacing[2],
                    }}
                  >
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      onFocus={() => onComposerFieldFocus("manual")}
                      onBlur={onComposerFieldBlur}
                      placeholder={t("list.amountPlaceholderShort")}
                      placeholderTextColor={theme.textMuted}
                      style={{
                        flexGrow: 35,
                        flexShrink: 1,
                        flexBasis: 0,
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
                      onFocus={() => onComposerFieldFocus("manual")}
                      onBlur={onComposerFieldBlur}
                      placeholder={t("list.notePlaceholderShort")}
                      placeholderTextColor={theme.textMuted}
                      style={{
                        flexGrow: 65,
                        flexShrink: 1,
                        flexBasis: 0,
                        borderWidth: 1,
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        borderRadius: radius.md,
                        padding: spacing[4],
                        color: theme.text,
                      }}
                    />
                  </View>

                  <View style={{ marginTop: spacing[5] }}>
                    <CategoryChips
                      key={categoryChipsKey}
                      value={category}
                      onChange={setCategory}
                    />
                  </View>

                  <Pressable
                    disabled={createItem.isPending || !name.trim()}
                    onPress={() => {
                      Keyboard.dismiss();
                      const addedName = name.trim();
                      const addedAmount = amount.trim();
                      const addedNote = note.trim();
                      const addedCategory = category;
                      createItem.mutate(
                        {
                          clientId: createClientId(),
                          name: addedName,
                          ...(addedAmount ? { amount: addedAmount } : {}),
                          ...(addedNote ? { note: addedNote } : {}),
                          category: addedCategory,
                        },
                        {
                          onSuccess: () => {
                            onManualItemAdded();
                            setName("");
                            setAmount("");
                            setNote("");
                            setCategory("other");
                            setCategoryChipsKey((key) => key + 1);
                            showItemFooterToast({
                              kind: "added",
                              name: addedName,
                              category: addedCategory,
                              ...(addedAmount ? { amount: addedAmount } : {}),
                              ...(addedNote ? { note: addedNote } : {}),
                            });
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
                      {createItem.isPending
                        ? t("list.addingItem")
                        : t("list.addItem")}
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

            <View
              ref={itemsSectionRef}
              collapsable={false}
              style={{ marginTop: spacing[8] }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  minHeight: 44,
                  gap: spacing[2],
                }}
              >
                <Text
                  style={{
                    ...typography.headline,
                    color: theme.text,
                    flex: 1,
                    paddingRight: spacing[2],
                  }}
                >
                  {t("list.itemsOnList")}
                </Text>
                <ItemsSortToggle
                  value={itemsSortMode}
                  onChange={onItemsSortModeChange}
                />
              </View>

              <View>
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
                            onMenuPress={
                              isFinishedList
                                ? undefined
                                : () => openItemMenu(item)
                            }
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
              </View>
            </View>

            <ListEditCategoryOrderSection
              categories={categoriesOnList}
              categoryItemCounts={categoryItemCounts}
              readOnly={isFinishedList}
              startCollapsed={isFinishedList}
              onReorder={onCategoryReorder}
              onDragActiveChange={(dragging) => {
                if (dragging) cancelSmoothScroll();
              }}
            />

            <View style={{ marginTop: spacing[8] }}>
              <CreateListOptionRow
                icon="🗑"
                title={t("list.delete")}
                subtitle={t("history.deleteHint")}
                tone="danger"
                disabled={
                  archiveList.isPending ||
                  restoreMutation.isPending ||
                  repeatMutation.isPending
                }
                onPress={confirmDeleteList}
              />
              {isFinishedList ? (
                <>
                  <CreateListOptionRow
                    icon="↺"
                    title={t("history.restore")}
                    subtitle={t("history.restoreHint")}
                    disabled={
                      archiveList.isPending ||
                      restoreMutation.isPending ||
                      repeatMutation.isPending
                    }
                    onPress={onRestoreFinishedList}
                  />
                  <CreateListOptionRow
                    icon="🔁"
                    title={t("history.repeat")}
                    subtitle={t("history.repeatHint")}
                    disabled={
                      archiveList.isPending ||
                      restoreMutation.isPending ||
                      repeatMutation.isPending
                    }
                    onPress={onRepeatFinishedList}
                  />
                </>
              ) : null}
            </View>
          </>
        )}
        </LoadingTransition>
        </NestableScreenScroll>

        {!hideStickyForComposer ? (
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
          <View
            style={{ height: 56, justifyContent: "center", overflow: "hidden" }}
            onLayout={(event) => {
              const next = event.nativeEvent.layout.width;
              if (next > 0) footerSlideWidth.value = next;
            }}
          >
            <Animated.View
              pointerEvents={
                itemFooterToastRendered != null ? "none" : "auto"
              }
              style={[
                startShoppingCtaAnimStyle,
                itemFooterToastRendered != null
                  ? {
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                    }
                  : null,
              ]}
            >
              <Pressable
                onPress={() => {
                  if (isFinishedList) return;
                  if (typeof listId === "string" && itemCount > 0) {
                    openTask(`/list/${listId}/shop`);
                  }
                }}
                disabled={
                  isFinishedList ||
                  itemCount === 0 ||
                  mealGenerating ||
                  ingestMutation.isPending ||
                  applyMutation.isPending
                }
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    isFinishedList ||
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
                    isFinishedList ||
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
                  <AiPhaseCrossfade
                    phase={
                      mealGenerating
                        ? "meal"
                        : aiPhase === "uploading"
                          ? "uploading"
                          : aiPhase === "applying"
                            ? "applying"
                            : "analyzing"
                    }
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing[2],
                      }}
                    >
                      <ActivityIndicator color={theme.onPrimary} />
                      <Text
                        style={{ ...typography.label, color: theme.onPrimary }}
                      >
                        {mealGenerating
                          ? t("ai.mealProposalGenerating")
                          : aiPhase === "uploading"
                            ? t("ai.phaseUploading")
                            : aiPhase === "applying"
                              ? t("ai.phaseApplying")
                              : t("ai.phaseAnalyzing")}
                      </Text>
                    </View>
                  </AiPhaseCrossfade>
                ) : (
                  <Text style={{ ...typography.label, color: theme.onPrimary }}>
                    {t("shoppingMode.startShopping")}
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            {itemFooterToastRendered ? (
              <Animated.View
                pointerEvents="auto"
                style={[
                  itemFooterToastAnimStyle,
                  {
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                  },
                ]}
              >
                <Pressable
                  onPress={() => setItemFooterToast(null)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    sortFooterToast
                      ? t(footerToastA11yKey)
                      : aiImportFooterToast
                        ? t(footerToastA11yKey, {
                            count: aiImportFooterToast.count,
                          })
                      : itemActionFooterToast
                        ? [
                            t(footerToastA11yKey, {
                              name: itemActionFooterToast.name,
                            }),
                            t(`categories.${itemActionFooterToast.category}`),
                            [
                              itemActionFooterToast.amount,
                              itemActionFooterToast.note,
                            ]
                              .filter(Boolean)
                              .join(" · ") || null,
                          ]
                            .filter(Boolean)
                            .join(". ")
                        : ""
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing[3],
                    height: 56,
                    maxHeight: 56,
                    backgroundColor: theme.surface,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: theme.border,
                    paddingVertical: spacing[2],
                    paddingHorizontal: spacing[3],
                    // No elevation/shadow here: parent uses overflow:"hidden" for the
                    // L→R slide, which clips shadows into harsh side bands on Android.
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.lg,
                      backgroundColor: sortFooterToast || aiImportFooterToast
                        ? brand.accent
                        : getCategoryBadgeColors(
                            itemActionFooterToast?.category ?? "other",
                          ).background,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {sortFooterToast ? (
                      sortFooterToast.sortMode === "category" ? (
                        <CategorySortIcon color={brand.primary} size={20} />
                      ) : (
                        <DateSortIcon color={brand.primary} size={20} />
                      )
                    ) : aiImportFooterToast ? (
                      <Text style={{ fontSize: 20 }}>✨</Text>
                    ) : itemActionFooterToast ? (
                      <Text style={{ fontSize: 20 }}>
                        {getShoppingCategoryIcon(itemActionFooterToast.category)}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        color: footerToastAccent,
                        fontWeight: "700",
                        lineHeight: 16,
                      }}
                      numberOfLines={1}
                    >
                      {t(footerToastLabelKey)}
                    </Text>
                    <Text
                      style={{
                        ...typography.label,
                        color: theme.text,
                        marginTop: 1,
                        lineHeight: 20,
                      }}
                      numberOfLines={1}
                    >
                      {sortFooterToast && footerToastSubtitleKey
                        ? t(footerToastSubtitleKey)
                        : aiImportFooterToast && footerToastSubtitleKey
                          ? t(footerToastSubtitleKey, {
                              count: aiImportFooterToast.count,
                            })
                        : itemActionFooterToast
                          ? [
                              itemActionFooterToast.name,
                              itemActionFooterToast.amount,
                              itemActionFooterToast.note,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : ""}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: radius.full,
                      backgroundColor: `${footerToastAccent}18`,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        color: footerToastAccent,
                        fontSize: 12,
                        fontWeight: "700",
                        lineHeight: 14,
                      }}
                    >
                      {footerToastMark}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ) : null}
          </View>
        </View>
        ) : null}
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
        visible={Boolean(editingItem) && removeItemTarget == null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(input) => {
          if (!editingItem) return;
          updateItem.mutate(
            {
              itemId: editingItem.id,
              name: input.name,
              amount: input.amount,
              note: input.note,
              category: input.category,
            },
            {
              onSuccess: () => {
                showItemFooterToast({
                  kind: "updated",
                  name: input.name,
                  category: input.category,
                  ...(input.amount ? { amount: input.amount } : {}),
                  ...(input.note ? { note: input.note } : {}),
                });
              },
            },
          );
        }}
        onDelete={() => {
          if (!editingItem) return;
          Keyboard.dismiss();
          setRemoveItemTarget(editingItem);
        }}
      />

      <FeedbackSheet
        visible={removeItemTarget != null}
        image={brandAssets.deleteList}
        title={t("list.removeItemTitle")}
        body={t("list.removeItemBody")}
        primaryLabel={t("list.removeItemConfirm")}
        onPrimary={() => {
          if (!removeItemTarget) return;
          const removed = removeItemTarget;
          setRemoveItemTarget(null);
          setEditingItem(null);
          updateItem.mutate(
            { itemId: removed.id, status: "removed" },
            {
              onSuccess: () => {
                showItemFooterToast({
                  kind: "removed",
                  name: removed.name,
                  category: removed.category,
                  ...(removed.amount ? { amount: removed.amount } : {}),
                  ...(removed.note ? { note: removed.note } : {}),
                });
              },
            },
          );
        }}
        secondaryLabel={t("list.deleteCancel")}
        onSecondary={() => setRemoveItemTarget(null)}
        primaryDestructive
        imageWidth={200}
        imageHeight={200}
      />

      <FeedbackSheet
        visible={finishedFeedback != null}
        image={
          finishedFeedback === "restored"
            ? brandAssets.listCreated
            : brandAssets.listBag
        }
        title={
          finishedFeedback === "restored"
            ? t("history.restoredTitle")
            : t("history.limitTitle")
        }
        body={
          finishedFeedback === "restored"
            ? t("history.restoredBody")
            : t("history.limitBody")
        }
        primaryLabel={
          finishedFeedback === "limit"
            ? t("billing.upgradeCta")
            : t("common.return")
        }
        onPrimary={() => {
          const kind = finishedFeedback;
          setFinishedFeedback(null);
          if (kind === "limit") {
            router.push("/premium");
          }
        }}
        secondaryLabel={
          finishedFeedback === "limit" ? t("common.return") : undefined
        }
        onSecondary={
          finishedFeedback === "limit"
            ? () => setFinishedFeedback(null)
            : undefined
        }
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
