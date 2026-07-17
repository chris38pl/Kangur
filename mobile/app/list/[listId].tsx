import { useAuth } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { applyAi, ingestAi } from "@/features/ai/api";
import type { ProposalOperation } from "@/features/ai/schemas";
import { getShoppingList } from "@/features/shopping-list/api";
import { useArchiveShoppingList } from "@/features/shopping-list/useShoppingLists";
import {
  useCreateShoppingItem,
  useShoppingItems,
  useUpdateShoppingItem,
} from "@/features/shopping-item/useShoppingItems";
import type { ShoppingCategory } from "@/features/shopping-item/schemas";

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
        clientId: operation.clientId ?? undefined,
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
  const router = useRouter();
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

  const listQuery = useQuery({
    queryKey: ["shopping-list", listId],
    enabled: Boolean(isSignedIn) && typeof listId === "string",
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
    Boolean(isSignedIn),
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
  const ingestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getToken();
      if (!token || typeof listId !== "string") {
        throw new Error("Missing auth token or list id");
      }
      return ingestAi(token, listId, formData);
    },
    onSuccess: (result) => {
      setReviewRunId(result.runId);
      setReviewOperations(result.proposal.operations);
    },
  });
  const applyMutation = useMutation({
    mutationFn: async (operations: ProposalOperation[]) => {
      const token = await getToken();
      if (!token || typeof listId !== "string" || !reviewRunId) {
        throw new Error("Missing auth token, list id, or run id");
      }

      const previousItems =
        queryClient.getQueryData(["shopping-items", listId]) ?? [];

      const result = await applyAi(token, listId, {
        runId: reviewRunId,
        operations: buildApplyOperations(operations),
      });

      queryClient.setQueryData(["shopping-items", listId], result.items);
      setUndoVisible(true);

      const timeout = setTimeout(() => {
        setUndoVisible(false);
        void queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
      }, 5000);

      return { result, previousItems, timeout };
    },
    onSuccess: () => {
      setReviewRunId(null);
      setReviewOperations([]);
      setAiText("");
    },
  });

  const isPending = listQuery.isPending || itemsQuery.isPending;

  const startTextIngest = () => {
    const formData = new FormData();
    formData.append("source", "text");
    formData.append("text", aiText.trim());
    ingestMutation.mutate(formData);
  };

  const startClipboardIngest = async () => {
    const text = (await Clipboard.getStringAsync()).trim();
    if (!text) return;
    const formData = new FormData();
    formData.append("source", "clipboard");
    formData.append("text", text);
    setAiText(text);
    ingestMutation.mutate(formData);
  };

  const startScreenshotIngest = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("source", "screenshot");
    formData.append("file", {
      uri: asset.uri,
      name: asset.fileName ?? "screenshot.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob);
    ingestMutation.mutate(formData);
  };

  // Deep-link from Home create sheet: ?import=screenshot|clipboard|photo
  useEffect(() => {
    if (importTriggered.current) return;
    if (!listQuery.isSuccess || typeof listId !== "string") return;
    if (!importSource) return;
    importTriggered.current = true;
    // Defer so ingest mutations are not scheduled synchronously inside the effect.
    const handle = setTimeout(() => {
      if (importSource === "clipboard") {
        void startClipboardIngest();
      } else if (importSource === "screenshot" || importSource === "photo") {
        void startScreenshotIngest();
      }
    }, 0);
    router.setParams({ import: undefined });
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when list ready
  }, [listQuery.isSuccess, listId, importSource]);

  const fastPathReady =
    reviewOperations.length > 0 &&
    reviewOperations.every((operation) => operation.op === "merge") &&
    reviewOperations.every((operation) => operation.confidence >= 0.85);

  return (
    <>
      <Stack.Screen options={{ title: t("list.title") }} />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: theme.bg, padding: spacing[6] }}
        contentContainerStyle={{ paddingBottom: spacing[12] }}
      >
        {isPending ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 48 }}>
              {listQuery.data?.emoji ?? "🛒"}
            </Text>
            <Text
              style={{
                ...typography.display,
                color: theme.primary,
                marginTop: spacing[3],
              }}
            >
              {listQuery.data?.name ?? t("list.title")}
            </Text>

            <Pressable
              onPress={() => {
                if (typeof listId === "string") {
                  router.push(`/list/${listId}/shop`);
                }
              }}
              style={{
                marginTop: spacing[6],
                backgroundColor: theme.primary,
                borderRadius: radius.md,
                paddingVertical: spacing[4],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: "#fff" }}>
                {t("shoppingMode.startShopping")}
              </Text>
            </Pressable>

            <Pressable
              disabled={archiveList.isPending}
              onPress={() => {
                if (typeof listId !== "string") return;
                Alert.alert(t("list.deleteTitle"), t("list.deleteBody"), [
                  { text: t("list.deleteCancel"), style: "cancel" },
                  {
                    text: t("list.deleteConfirm"),
                    style: "destructive",
                    onPress: () => {
                      void archiveList.mutateAsync(listId).then(() => {
                        console.info("[shopping-list]", "ListDeleted", {
                          listId,
                        });
                        router.replace("/(tabs)");
                      });
                    },
                  },
                ]);
              }}
              style={{
                marginTop: spacing[3],
                borderRadius: radius.md,
                paddingVertical: spacing[4],
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.danger,
                opacity: archiveList.isPending ? 0.6 : 1,
              }}
            >
              {archiveList.isPending ? (
                <ActivityIndicator color={theme.danger} />
              ) : (
                <Text style={{ ...typography.label, color: theme.danger }}>
                  {t("list.delete")}
                </Text>
              )}
            </Pressable>

            <Text
              style={{
                ...typography.label,
                color: theme.textMuted,
                marginTop: spacing[6],
              }}
            >
              {t("list.addLabel")}
            </Text>

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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: spacing[3] }}
              contentContainerStyle={{ gap: spacing[2] }}
            >
              {SHOPPING_CATEGORIES.map((value) => {
                const selected = value === category;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setCategory(value)}
                    style={{
                      borderWidth: 1,
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.surface : theme.bg,
                      borderRadius: radius.md,
                      paddingVertical: spacing[2],
                      paddingHorizontal: spacing[3],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        color: selected ? theme.primary : theme.text,
                      }}
                    >
                      {t(`categories.${value}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              disabled={createItem.isPending || !name.trim()}
              onPress={() =>
                createItem.mutate(
                  {
                    clientId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
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
                    },
                  },
                )
              }
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

            <Text
              style={{
                ...typography.label,
                color: theme.textMuted,
                marginTop: spacing[8],
              }}
            >
              {t("ai.title")}
            </Text>

            <TextInput
              value={aiText}
              onChangeText={setAiText}
              multiline
              placeholder={t("ai.textPlaceholder")}
              placeholderTextColor={theme.textMuted}
              style={{
                marginTop: spacing[3],
                minHeight: 96,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                borderRadius: radius.md,
                padding: spacing[4],
                color: theme.text,
                textAlignVertical: "top",
              }}
            />

            <View style={{ marginTop: spacing[3], gap: spacing[2] }}>
              <Pressable
                disabled={ingestMutation.isPending || !aiText.trim()}
                onPress={startTextIngest}
                style={{
                  backgroundColor: theme.primary,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  alignItems: "center",
                  opacity: ingestMutation.isPending || !aiText.trim() ? 0.6 : 1,
                }}
              >
                <Text style={{ ...typography.label, color: "#fff" }}>
                  {t("ai.importText")}
                </Text>
              </Pressable>

              <Pressable
                disabled={ingestMutation.isPending}
                onPress={() => void startClipboardIngest()}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  alignItems: "center",
                }}
              >
                <Text style={{ ...typography.label, color: theme.text }}>
                  {t("ai.importClipboard")}
                </Text>
              </Pressable>

              <Pressable
                disabled={ingestMutation.isPending}
                onPress={() => void startScreenshotIngest()}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  alignItems: "center",
                }}
              >
                <Text style={{ ...typography.label, color: theme.text }}>
                  {t("ai.importScreenshot")}
                </Text>
              </Pressable>
            </View>

            {reviewOperations.length ? (
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
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: spacing[2] }}
                        contentContainerStyle={{ gap: spacing[2] }}
                      >
                        {SHOPPING_CATEGORIES.map((value) => {
                          const selected = operation.category === value;
                          return (
                            <Pressable
                              key={value}
                              onPress={() =>
                                setReviewOperations((current) =>
                                  current.map((row) =>
                                    row.proposalRowId === operation.proposalRowId
                                      ? { ...row, category: value }
                                      : row,
                                  ),
                                )
                              }
                              style={{
                                borderWidth: 1,
                                borderColor: selected ? theme.primary : theme.border,
                                borderRadius: radius.md,
                                paddingVertical: spacing[1],
                                paddingHorizontal: spacing[2],
                              }}
                            >
                              <Text
                                style={{
                                  ...typography.caption,
                                  color: selected ? theme.primary : theme.text,
                                }}
                              >
                                {t(`categories.${value}`)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
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
                  onPress={() => applyMutation.mutate(reviewOperations)}
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
                ...typography.label,
                color: theme.textMuted,
                marginTop: spacing[8],
              }}
            >
              {t("list.items")}
            </Text>

            <View style={{ marginTop: spacing[3], gap: spacing[3] }}>
              {itemsQuery.data?.length ? (
                itemsQuery.data.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      updateItem.mutate({
                        itemId: item.id,
                        status: item.status === "bought" ? "pending" : "bought",
                      })
                    }
                    style={{
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: radius.lg,
                      padding: spacing[4],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.title,
                        color: item.status === "bought" ? theme.textMuted : theme.text,
                        textDecorationLine:
                          item.status === "bought" ? "line-through" : "none",
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.amount ? (
                      <Text
                        style={{
                          ...typography.body,
                          color: theme.textMuted,
                          marginTop: spacing[1],
                        }}
                      >
                        {item.amount}
                      </Text>
                    ) : null}
                    {item.note ? (
                      <Text
                        style={{
                          ...typography.caption,
                          color: theme.textMuted,
                          marginTop: spacing[1],
                        }}
                      >
                        {item.note}
                      </Text>
                    ) : null}
                  </Pressable>
                ))
              ) : (
                <Text
                  style={{
                    ...typography.body,
                    color: theme.textMuted,
                  }}
                >
                  {t("list.empty")}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}
