import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { openSettings } from "expo-linking";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { AppResultScreen } from "@/components/AppResultScreen";
import { useAppResult } from "@/components/AppResultProvider";
import { FeedbackSheet } from "@/components/feedback-sheet";
import { brandAssets } from "@/design-system/brand-assets";
import {
  abandonSuggestFromHistory,
  applySuggestFromHistory,
  suggestFromHistory,
} from "@/features/ai/api";
import { SuggestFromHistorySheet } from "@/features/ai/suggest-from-history-sheet";
import type { SuggestFromHistoryResponse } from "@/features/ai/schemas";
import { shoppingItemsQueryKey } from "@/features/shopping-item/query-keys";
import {
  CreateListSheet,
  type CreateListPath,
} from "@/features/shopping-list/create-list-sheet";
import { CreateListPreparingOverlay } from "@/features/shopping-list/create-list-preparing-overlay";
import {
  beginCreateListHandoff,
  cancelCreateListHandoff,
} from "@/features/shopping-list/create-list-handoff";
import { createShoppingList } from "@/features/shopping-list/api";
import { setPendingCreateDraft } from "@/features/shopping-list/pending-create-draft";
import { setPendingListFocus } from "@/features/shopping-list/pending-list-focus";
import {
  setPendingListImport,
  clearPendingListImport,
} from "@/features/shopping-list/pending-list-import";
import { markListProvisional } from "@/features/shopping-list/provisional-list";
import type { ShoppingList } from "@/features/shopping-list/schemas";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";
import { Analytics } from "@/lib/analytics";
import { oncePerUser } from "@/lib/analytics/once";
import { ApiClientError } from "@/lib/api/client";
import { finishTaskAndOpen, openDetails } from "@/lib/navigation";
import {
  isHistorySuggestionsEnabled,
  isMealProposalEnabled,
} from "@/lib/featureGates";
import { persistShoppingListsCache } from "@/lib/query/persist-bootstrap";

type CreateListContextValue = {
  openCreateList: () => void;
  createAndOpen: (
    path: CreateListPath,
    options?: { imageSource?: "camera" | "library" },
  ) => Promise<void>;
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
  const {
    showError,
    visible: appResultVisible,
  } = useAppResult();
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [creatingOverlay, setCreatingOverlay] = useState(false);
  const [clipboardEmptyOpen, setClipboardEmptyOpen] = useState(false);
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const createInFlightRef = useRef(false);
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
        if (error.code === "NOT_FOUND" || error.status === 404) {
          showError({
            title: t("ai.suggestErrorTitle"),
            description: t("ai.suggestNoHistory"),
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
        primaryLabel: t("common.tryAgain"),
        secondaryLabel: t("common.return"),
        onPrimary: () => {
          void runFromHistory();
        },
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

        finishTaskAndOpen(`/list/${result.list.id}` as never);
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
    async (
      path: CreateListPath,
      options?: { imageSource?: "camera" | "library" },
    ) => {
      if (!activeWorkspace || !hydrated) return;
      if (path === "voice") return;
      if (createInFlightRef.current) return;

      if (path === "fromHistory") {
        await runFromHistory();
        return;
      }

      if (
        (path === "photo" || path === "screenshot") &&
        !options?.imageSource
      ) {
        setSheetOpen(false);
        setPhotoSourceOpen(true);
        return;
      }

      // Capture (clipboard/picker) while sheet can still show preparing.
      // Then close sheet → honest fullscreen wait → POST → /list/:id.
      // No Home invalidate here: seed cache, navigate; Home revalidates later.
      try {
        createInFlightRef.current = true;
        setPreparing(true);

        let focus: "ai" | "meal" | "manual" = "ai";
        let name = t("home.aiListName");
        let emoji = "🛒";
        let aiText = "";

        if (path === "clipboard") {
          const text = (await Clipboard.getStringAsync()).trim();
          if (!text) {
            setPreparing(false);
            createInFlightRef.current = false;
            setClipboardEmptyOpen(true);
            return;
          }
          setPendingListImport({ kind: "clipboard", text });
          aiText = text;
        } else if (path === "photo" || path === "screenshot") {
          const imageSource = options?.imageSource ?? "library";
          const permission =
            imageSource === "camera"
              ? await ImagePicker.requestCameraPermissionsAsync()
              : await ImagePicker.requestMediaLibraryPermissionsAsync();

          if (!permission.granted) {
            setPreparing(false);
            createInFlightRef.current = false;
            showError({
              title: t("feedback.permissionTitle"),
              description: t("feedback.permissionBody"),
              primaryLabel: t("feedback.openSettings"),
              onPrimary: () => {
                void openSettings();
              },
              secondaryLabel: t("common.cancel"),
            });
            return;
          }

          const result =
            imageSource === "camera"
              ? await ImagePicker.launchCameraAsync({
                  mediaTypes: ["images"],
                  quality: 0.55,
                })
              : await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ["images"],
                  quality: 0.55,
                });
          if (result.canceled) {
            setPreparing(false);
            createInFlightRef.current = false;
            return;
          }
          const asset = result.assets[0];
          setPendingListImport({
            kind: "image",
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          });
        } else if (path === "fromRecipe") {
          focus = "meal";
          name = t("home.mealListName");
          emoji = "🍽️";
        } else if (path === "empty") {
          focus = "manual";
          name = t("home.defaultListName");
        }

        setPreparing(false);
        setSheetOpen(false);
        setCreatingOverlay(true);

        const token = await getToken();
        if (!token) throw new Error("Missing auth token");

        const list = await createShoppingList(token, activeWorkspace.id, {
          name,
          emoji,
        });
        markListProvisional(list.id);
        queryClient.setQueryData(["shopping-list", list.id, "active"], list);
        queryClient.setQueryData(shoppingItemsQueryKey(list.id, "active"), []);

        const homeLists = queryClient.setQueryData<ShoppingList[]>(
          ["shopping-lists", activeWorkspace.id],
          (prev) => {
            if (!prev) return [list];
            if (prev.some((entry) => entry.id === list.id)) return prev;
            return [list, ...prev];
          },
        );
        if (homeLists) {
          void persistShoppingListsCache(activeWorkspace.id, homeLists);
        }

        void oncePerUser("first_list_created", () => {
          Analytics.track("first_list_created", {
            workspace_id: activeWorkspace.id,
            list_id: list.id,
          });
        });

        setPendingCreateDraft({ focus, aiText });
        setPendingListFocus(list.id, focus);
        // Push Details under the overlay — do not finishTaskAndOpen/goRoot
        // (that remounts Home and flashes between skeleton and list).
        beginCreateListHandoff(() => {
          setCreatingOverlay(false);
          createInFlightRef.current = false;
        });
        openDetails(`/list/${list.id}` as never);
      } catch {
        setPreparing(false);
        setCreatingOverlay(false);
        createInFlightRef.current = false;
        cancelCreateListHandoff();
        clearPendingListImport();
        showError({
          title: t("home.createFailedTitle"),
          description: t("home.createFailedBody"),
          primaryLabel: t("common.tryAgain"),
          secondaryLabel: t("common.return"),
        });
      }
    },
    [
      activeWorkspace,
      getToken,
      hydrated,
      queryClient,
      runFromHistory,
      showError,
      t,
    ],
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
        preparing={preparing || creatingOverlay}
        showFromHistory={isHistorySuggestionsEnabled()}
        showFromRecipe={isMealProposalEnabled()}
        onClose={() => {
          if (preparing || creatingOverlay) return;
          setSheetOpen(false);
        }}
        onSelect={(path) => void createAndOpen(path)}
      />
      <AppResultScreen
        visible={photoSourceOpen}
        variant="info"
        image={brandAssets.createListMascot}
        title={t("feedback.addPhoto")}
        description={t("home.createImageHint")}
        primaryLabel={t("feedback.takePhoto")}
        onPrimary={() => {
          setPhotoSourceOpen(false);
          void createAndOpen("photo", { imageSource: "camera" });
        }}
        secondaryLabel={t("feedback.chooseGallery")}
        onSecondary={() => {
          setPhotoSourceOpen(false);
          void createAndOpen("photo", { imageSource: "library" });
        }}
        onBack={() => setPhotoSourceOpen(false)}
      />
      <CreateListPreparingOverlay visible={creatingOverlay} />
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
      <FeedbackSheet
        visible={clipboardEmptyOpen}
        image={brandAssets.listEmpty}
        title={t("home.createClipboard")}
        body={t("home.createClipboardEmpty")}
        primaryLabel={t("common.return")}
        onPrimary={() => setClipboardEmptyOpen(false)}
      />
    </CreateListContext.Provider>
  );
}
