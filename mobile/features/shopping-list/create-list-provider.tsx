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
import { SuggestFromHistorySheet } from "@/features/ai/suggest-from-history-sheet";
import { useSuggestFromHistory } from "@/features/ai/use-suggest-from-history";
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
import { openDetails } from "@/lib/navigation";
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
  const {
    loading: historyLoading,
    busy: historyBusy,
    run: historyRun,
    start: startHistorySuggest,
    close: closeHistorySuggest,
    confirm: confirmHistorySuggest,
  } = useSuggestFromHistory({
    workspaceId: activeWorkspace?.id ?? null,
  });

  const openCreateList = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const createAndOpen = useCallback(
    async (
      path: CreateListPath,
      options?: { imageSource?: "camera" | "library" },
    ) => {
      if (!activeWorkspace || !hydrated) return;
      if (path === "voice") return;
      if (createInFlightRef.current) return;

      if (path === "fromHistory") {
        if (!isHistorySuggestionsEnabled()) {
          await startHistorySuggest();
          return;
        }
        setSheetOpen(false);
        await startHistorySuggest();
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
        queryClient.setQueryData(
          ["shopping-list", list.id, "allow-archived"],
          list,
        );
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
      startHistorySuggest,
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
      {creatingOverlay ? <CreateListPreparingOverlay /> : null}
      {historyLoading || historyRun ? (
        <SuggestFromHistorySheet
          // Hide while global result Modal is up (nested Modals often stay underneath).
          visible={!appResultVisible}
          loading={historyLoading}
          busy={historyBusy}
          title={historyRun?.proposal.shoppingContext.title ?? ""}
          items={historyRun?.proposal.items ?? []}
          onClose={() => void closeHistorySuggest()}
          onConfirm={(ids) => void confirmHistorySuggest(ids)}
        />
      ) : null}
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
