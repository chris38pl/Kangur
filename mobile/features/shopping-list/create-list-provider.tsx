import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import {
  CreateListSheet,
  type CreateListPath,
} from "@/features/shopping-list/create-list-sheet";
import { useCreateShoppingList } from "@/features/shopping-list/useShoppingLists";
import { useActiveWorkspace } from "@/features/workspace/useActiveWorkspace";
import { useWorkspaces } from "@/features/workspace/useWorkspaces";

type CreateListContextValue = {
  openCreateList: () => void;
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

  const openCreateList = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const createAndOpen = useCallback(
    async (path: CreateListPath) => {
      if (!activeWorkspace || !hydrated) return;
      try {
        const list = await createList.mutateAsync({
          name:
            path === "empty" ? t("home.defaultListName") : t("home.aiListName"),
          emoji: "🛒",
        });
        setSheetOpen(false);
        if (path === "empty") {
          router.push(`/list/${list.id}` as never);
          return;
        }
        if (path === "voice") return;
        const importSource =
          path === "clipboard"
            ? "clipboard"
            : path === "photo"
              ? "photo"
              : "screenshot";
        router.push(`/list/${list.id}?import=${importSource}` as never);
      } catch {
        // keep sheet open
      }
    },
    [activeWorkspace, createList, hydrated, t],
  );

  const value = useMemo(() => ({ openCreateList }), [openCreateList]);

  return (
    <CreateListContext.Provider value={value}>
      {children}
      <CreateListSheet
        visible={sheetOpen}
        busy={createList.isPending}
        onClose={() => setSheetOpen(false)}
        onSelect={(path) => void createAndOpen(path)}
      />
    </CreateListContext.Provider>
  );
}
