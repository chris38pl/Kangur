import { getShoppingCategoryOrder } from "@shared/shopping-categories";
import { useAuth } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import { primaryButtonStyle } from "@/design-system/shopping-density";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { applyAi, ingestAi } from "@/features/ai/api";
import type { ProposalOperation } from "@/features/ai/schemas";
import { BackIcon } from "@/features/auth/auth-icons";
import { CategoryChips } from "@/features/shopping-item/category-chips";
import { EditItemSheet } from "@/features/shopping-item/edit-item-sheet";
import { ListItemRow } from "@/features/shopping-item/list-item-row";
import type { ShoppingItem } from "@/features/shopping-item/schemas";
import {
  getShoppingList,
} from "@/features/shopping-list/api";
import { CreateListOptionRow } from "@/features/shopping-list/create-list-option-row";
import { DeleteListDialog } from "@/features/shopping-list/delete-list-dialog";
import { RenameListSheet } from "@/features/shopping-list/rename-list-sheet";
import { takePendingListImport } from "@/features/shopping-list/pending-list-import";
import {
  clearListProvisional,
  isListProvisional,
} from "@/features/shopping-list/provisional-list";
import {
  useArchiveShoppingList,
  useUpdateShoppingList,
} from "@/features/shopping-list/useShoppingLists";
import {
  useCreateShoppingItem,
  useShoppingItems,
  useUpdateShoppingItem,
} from "@/features/shopping-item/useShoppingItems";
import type { ShoppingCategory } from "@/features/shopping-item/schemas";
import { createClientId } from "@/lib/createClientId";
import { isAiReviewEnabled } from "@/lib/aiReview";
import { ApiClientError } from "@/lib/api/client";

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
  const router = useRouter();
  const navigation = useNavigation();
  const { listId, import: importSource } = useLocalSearchParams<{
    listId: string;
    import?: string;
  }>();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const importTriggered = useRef(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("other");
  const [aiText, setAiText] = useState("");
  const [reviewRunId, setReviewRunId] = useState<string | null>(null);
  const [reviewOperations, setReviewOperations] = useState<ProposalOperation[]>([]);
  const [undoVisible, setUndoVisible] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

      const previousItems =
        queryClient.getQueryData(["shopping-items", listId]) ?? [];

      const result = await applyAi(token, listId, {
        runId: input.runId,
        operations: buildApplyOperations(input.operations),
      });

      queryClient.setQueryData(["shopping-items", listId], result.items);
      setUndoVisible(true);

      const timeout = setTimeout(() => {
        setUndoVisible(false);
        void queryClient.invalidateQueries({
          queryKey: ["shopping-items", listId],
        });
      }, 5000);

      return { result, previousItems, timeout };
    },
    onSuccess: () => {
      setReviewRunId(null);
      setReviewOperations([]);
      setAiText("");
      if (typeof listId === "string") {
        clearListProvisional(listId);
        void queryClient.invalidateQueries({
          queryKey: ["shopping-list", listId],
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

      // Backend renames untitled lists on ingest — refresh header immediately.
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
  const mountedAt = useRef(Date.now());

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

  const startTextIngest = () => {
    Keyboard.dismiss();
    const formData = new FormData();
    formData.append("source", "text");
    formData.append("text", aiText.trim());
    ingestMutation.mutate(formData);
  };

  const startClipboardIngest = async (textOverride?: string) => {
    Keyboard.dismiss();
    const text = (textOverride ?? (await Clipboard.getStringAsync())).trim();
    if (!text) return;
    const formData = new FormData();
    formData.append("source", "clipboard");
    formData.append("text", text);
    setAiText(text);
    ingestMutation.mutate(formData);
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
    const formData = new FormData();
    formData.append("source", "screenshot");
    formData.append("file", {
      uri: picked.uri,
      name: picked.fileName ?? "screenshot.jpg",
      type: picked.mimeType ?? "image/jpeg",
    } as unknown as Blob);
    ingestMutation.mutate(formData);
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

  const fastPathReady =
    reviewOperations.length > 0 &&
    reviewOperations.every((operation) => operation.op === "merge") &&
    reviewOperations.every((operation) => operation.confidence >= 0.85);

  const categoryOrder = getShoppingCategoryOrder();
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

  const confirmDeleteList = () => {
    if (typeof listId !== "string") return;
    setDeleteOpen(true);
  };

  const performDeleteList = () => {
    if (typeof listId !== "string") return;
    void archiveList.mutateAsync(listId).then(() => {
      console.info("[shopping-list]", "ListDeleted", { listId });
      setDeleteOpen(false);
      router.replace("/(tabs)");
    });
  };

  const openItemMenu = (item: ShoppingItem) => {
    setEditingItem(item);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
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
                else router.replace("/(tabs)");
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

            <Pressable
              onPress={() => {
                if (typeof listId === "string") {
                  router.push(`/list/${listId}/shop`);
                }
              }}
              style={{
                ...primaryButtonStyle(theme),
                borderRadius: radius.full,
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[4],
                minHeight: 40,
              }}
            >
              <Text style={{ ...typography.label, color: theme.onPrimary }}>
                {t("shoppingMode.startShopping")}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing[6],
            paddingTop: spacing[5],
            paddingBottom: spacing[12] + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
        {isPending ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] }}>
            <ActivityIndicator color={theme.primary} />
          </View>
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
              <Text style={{ ...typography.headline, color: theme.text }}>
                {t("ai.quickAddTitle")}
              </Text>
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
                    <Text style={{ fontSize: 14, color: theme.onPrimary }}>✨</Text>
                    <Text style={{ ...typography.label, color: theme.onPrimary }}>
                      {t(
                        itemCount > 0 ? "ai.addToList" : "ai.createFromText",
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
                  style={{ flex: 1, height: 1, backgroundColor: theme.border }}
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
                  style={{ flex: 1, height: 1, backgroundColor: theme.border }}
                />
              </View>

              <CreateListOptionRow
                icon="📷"
                title={t("home.createImage")}
                subtitle={t("home.createImageHint")}
                disabled={ingestMutation.isPending || applyMutation.isPending}
                onPress={() => void startScreenshotIngest()}
              />
              <CreateListOptionRow
                icon="🛒"
                title={t("home.createClipboard")}
                subtitle={t("home.createClipboardHint")}
                disabled={ingestMutation.isPending || applyMutation.isPending}
                onPress={() => void startClipboardIngest()}
              />
            </View>

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

            {undoVisible ? (
              <View
                style={{
                  marginTop: spacing[4],
                  borderWidth: 1,
                  borderColor: theme.primary,
                  borderRadius: radius.md,
                  padding: spacing[3],
                  backgroundColor: theme.surface,
                }}
              >
                <Text style={{ ...typography.body, color: theme.text }}>
                  {t("ai.undoMessage")}
                </Text>
                <Pressable
                  onPress={async () => {
                    const mutationData = applyMutation.data;
                    if (!mutationData || typeof listId !== "string") return;
                    clearTimeout(mutationData.timeout);
                    queryClient.setQueryData(
                      ["shopping-items", listId],
                      mutationData.previousItems,
                    );
                    setUndoVisible(false);
                  }}
                  style={{ marginTop: spacing[2], alignSelf: "flex-start" }}
                >
                  <Text style={{ ...typography.label, color: theme.primary }}>
                    {t("ai.undo")}
                  </Text>
                </Pressable>
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

            <View style={{ marginTop: spacing[3] }}>
              {itemCount > 0 ? (
                activeItems.map((item, index) => (
                  <ListItemRow
                    key={item.id}
                    item={item}
                    showDivider={index < activeItems.length - 1}
                    onMenuPress={() => openItemMenu(item)}
                  />
                ))
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
        </ScrollView>
      </View>

      <RenameListSheet
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
