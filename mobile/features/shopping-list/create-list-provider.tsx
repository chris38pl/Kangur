import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import {
  CreateListSheet,
  type CreateListPath,
} from "@/features/shopping-list/create-list-sheet";
import { setPendingListImport } from "@/features/shopping-list/pending-list-import";
import { markListProvisional } from "@/features/shopping-list/provisional-list";
import { useCreateShoppingList } from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";

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
  const workspacesQuery = useWorkspaces();
  const { activeWorkspace, hydrated } = useActiveWorkspace(workspacesQuery.data);
  const createList = useCreateShoppingList(activeWorkspace?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const openCreateList = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const createAndOpen = useCallback(
    async (path: CreateListPath) => {
      if (!activeWorkspace || !hydrated) return;
      if (path === "voice") return;

      try {
        // Capture import payload BEFORE creating a list — cancel must not spam empty lists.
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
            path === "empty" ? t("home.defaultListName") : t("home.aiListName"),
          emoji: "🛒",
        });
        // Discard if user leaves before any products are saved.
        markListProvisional(list.id);
        setSheetOpen(false);

        router.push(`/list/${list.id}` as never);
      } catch {
        setPreparing(false);
        // keep sheet open; drop any staged import so we do not attach it later
        const { clearPendingListImport } = await import(
          "@/features/shopping-list/pending-list-import"
        );
        clearPendingListImport();
      }
    },
    [activeWorkspace, createList, hydrated, t],
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
        onClose={() => setSheetOpen(false)}
        onSelect={(path) => void createAndOpen(path)}
      />
    </CreateListContext.Provider>
  );
}
