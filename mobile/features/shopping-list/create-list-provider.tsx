import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppResult } from "@/components/AppResultProvider";
import {
  abandonSuggestFromHistory,
  applySuggestFromHistory,
  suggestFromHistory,
} from "@/features/ai/api";
import { SuggestFromHistorySheet } from "@/features/ai/suggest-from-history-sheet";
import type { SuggestFromHistoryResponse } from "@/features/ai/schemas";
import {
  CreateListSheet,
  type CreateListPath,
} from "@/features/shopping-list/create-list-sheet";
import { setPendingListImport } from "@/features/shopping-list/pending-list-import";
import { markListProvisional } from "@/features/shopping-list/provisional-list";
import { useCreateShoppingList } from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { ApiClientError } from "@/lib/api/client";
import {
  isHistorySuggestionsEnabled,
  isMealProposalEnabled,
} from "@/lib/featureGates";
import { setPendingMealComposer } from "@/features/ai/pending-meal-proposal";

type CreateListContextValue = {
  openCreateList: () => void;
  createAndOpen: (path: CreateListPath) => Promise<void>;
};

const CreateListContext = createContext<CreateListContextValue | null>(null);

export function useCreateList() {
  const ctx = useContext(CreateListContext);
  if (!ctx) {
    throw new Error("useCreateList must be used within CreateListProvider");
  }
  return ctx;
}

export function CreateListProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { showError, visible: appResultVisible } = useAppResult();
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const createList = useCreateShoppingList(activeWorkspace?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [suggestRun, setSuggestRun] =
    useState<SuggestFromHistoryResponse | null>(null);
  const suggestRequestIdRef = useRef(0);

  const openCreateList = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const closeSuggest = useCallback(async () => {
    suggestRequestIdRef.current += 1;
    if (suggestLoading) {
      setSuggestLoading(false);
      setSuggestRun(null);
      return;
    }
    const run = suggestRun;
    const workspaceId = activeWorkspace?.id;
    setSuggestRun(null);
    if (!run || !workspaceId) return;
    try {
      const token = await getToken();
      if (!token) return;
      await abandonSuggestFromHistory(token, workspaceId, run.runId);
    } catch {
      // Best-effort abandon
    }
  }, [activeWorkspace?.id, getToken, suggestLoading, suggestRun]);

  const runFromHistory = useCallback(async () => {
    if (!activeWorkspace || !hydrated) return;
    if (!isHistorySuggestionsEnabled()) {
      showError({
        title: t("ai.suggestErrorTitle"),
        description: t("ai.suggestFeatureDisabled"),
      });
      return;
    }

    const requestId = ++suggestRequestIdRef.current;
    setSheetOpen(false);
    setSuggestRun(null);
    setSuggestLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");

      const result = await suggestFromHistory(token, activeWorkspace.id);
      if (suggestRequestIdRef.current !== requestId) {
        // User cancelled - abandon the orphaned run.
        try {
          await abandonSuggestFromHistory(
            token,
            activeWorkspace.id,
            result.runId,
          );
        } catch {
          // best-effort
        }
        return;
      }
      setSuggestRun(result);
    } catch (error) {
      if (suggestRequestIdRef.current !== requestId) return;
      setSuggestRun(null);
      if (error instanceof ApiClientError) {
        if (error.code === "AI_UNAVAILABLE" || error.status === 502) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestUnavailable"),
          });
          return;
        }
        if (error.code === "INSUFFICIENT_CREDITS" || error.status === 402) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestInsufficientCredits"),
          });
          return;
        }
        if (error.code === "NOT_FOUND" || error.status === 404) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestNoHistory"),
          });
          return;
        }
        if (error.code === "PREMIUM_REQUIRED") {
          showError({
            title: t("home.createFromHistory"),
            description: t("ai.suggestPremiumRequired"),
            primaryLabel: t("billing.upgradeCta"),
            onPrimary: () => router.push("/premium"),
          });
          return;
        }
        if (error.code === "FORBIDDEN" || error.status === 403) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestFeatureDisabled"),
          });
          return;
        }
      }
      showError({
        title: t("ai.suggestErrorTitle"),
        description: t("ai.suggestUnavailable"),
      });
    } finally {
      if (suggestRequestIdRef.current === requestId) {
        setSuggestLoading(false);
      }
    }
  }, [activeWorkspace, getToken, hydrated, showError, t]);

  const confirmSuggest = useCallback(
    async (acceptedIds: string[]) => {
      if (!activeWorkspace || !suggestRun || acceptedIds.length === 0) return;
      setApplyBusy(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Missing auth token");

        const result = await applySuggestFromHistory(
          token,
          activeWorkspace.id,
          {
            runId: suggestRun.runId,
            acceptedProposalRowIds: acceptedIds,
          },
        );

        setSuggestRun(null);

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["shopping-lists", activeWorkspace.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["shopping-lists-history", activeWorkspace.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["shopping-items", result.list.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["ai-credits", activeWorkspace.id],
          }),
        ]);

        router.replace(`/list/${result.list.id}` as never);
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.code === "CONFLICT" || error.status === 409) {
            setSuggestRun(null);
            showError({
              title: t("ai.suggestErrorTitle"),
              description: t("ai.suggestAlreadyApplied"),
            });
            return;
          }
          if (error.code === "NOT_FOUND" || error.status === 404) {
            showError({
              title: t("ai.suggestErrorTitle"),
              description: t("ai.suggestApplyNotFound"),
              secondaryLabel: t("common.return"),
              primaryLabel: t("common.tryAgain"),
              onPrimary: () => {
                void confirmSuggest(acceptedIds);
              },
            });
            return;
          }
        }
        showError({
          title: t("ai.suggestErrorTitle"),
          description: t("ai.suggestApplyFailed"),
          secondaryLabel: t("common.return"),
          primaryLabel: t("common.tryAgain"),
          onPrimary: () => {
            void confirmSuggest(acceptedIds);
          },
        });
      } finally {
        setApplyBusy(false);
      }
    },
    [activeWorkspace, getToken, queryClient, showError, suggestRun, t],
  );

  const createAndOpen = useCallback(
    async (path: CreateListPath) => {
      if (!activeWorkspace || !hydrated) return;
      if (path === "voice") return;

      if (path === "fromHistory") {
        await runFromHistory();
        return;
      }

      try {
        // Capture import payload BEFORE creating a list - cancel must not spam empty lists.
        if (path === "clipboard") {
          setPreparing(true);
          const text = (await Clipboard.getStringAsync()).trim();
          setPreparing(false);
          if (!text) {
            Alert.alert(
              t("home.createClipboard"),
              t("home.createClipboardEmpty"),
            );
            return;
          }
          setPendingListImport({ kind: "clipboard", text });
        } else if (path === "photo" || path === "screenshot") {
          setPreparing(true);
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          setPreparing(false);
          if (result.canceled) return;
          const asset = result.assets[0];
          setPendingListImport({
            kind: "image",
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          });
        }

        const list = await createList.mutateAsync({
          name:
            path === "empty"
              ? t("home.defaultListName")
              : path === "fromRecipe"
                ? t("home.mealListName")
                : t("home.aiListName"),
          emoji: path === "fromRecipe" ? "🍽️" : "🛒",
        });
        // Discard if user leaves before any products are saved.
        markListProvisional(list.id);
        if (path === "fromRecipe") {
          setPendingMealComposer(list.id);
        }
        setSheetOpen(false);

        router.replace(`/list/${list.id}` as never);
      } catch {
        setPreparing(false);
        // keep sheet open; drop any staged import so we do not attach it later
        const { clearPendingListImport } = await import(
          "@/features/shopping-list/pending-list-import"
        );
        clearPendingListImport();
      }
    },
    [activeWorkspace, createList, hydrated, runFromHistory, t],
  );

  const value = useMemo(
    () => ({ openCreateList, createAndOpen }),
    [openCreateList, createAndOpen],
  );

  return (
    <CreateListContext.Provider value={value}>
      {children}
      <CreateListSheet
        visible={sheetOpen}
        busy={createList.isPending || preparing}
        showFromHistory={isHistorySuggestionsEnabled()}
        showFromRecipe={isMealProposalEnabled()}
        onClose={() => setSheetOpen(false)}
        onSelect={(path) => void createAndOpen(path)}
      />
      <SuggestFromHistorySheet
        // Hide while global result Modal is up (nested Modals often stay underneath).
        visible={(suggestLoading || Boolean(suggestRun)) && !appResultVisible}
        loading={suggestLoading}
        busy={applyBusy}
        title={suggestRun?.proposal.shoppingContext.title ?? ""}
        items={suggestRun?.proposal.items ?? []}
        onClose={() => void closeSuggest()}
        onConfirm={(ids) => void confirmSuggest(ids)}
      />
    </CreateListContext.Provider>
  );
}
