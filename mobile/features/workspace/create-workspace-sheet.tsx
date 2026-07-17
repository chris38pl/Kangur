import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WORKSPACE_ICONS, type WorkspaceIconId } from "@shared/workspace-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

import { createWorkspace } from "./api";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (workspaceId: string) => void;
};

export function CreateWorkspaceSheet({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<WorkspaceIconId>("kangaroo");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing token");
      return createWorkspace(token, { name, icon });
    },
    onSuccess: async (ws) => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setName("");
      setIcon("kangaroo");
      setError(null);
      onCreated(ws.id);
      onClose();
    },
    onError: () => {
      setError(t("workspace.createFailed"));
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing[6],
            maxHeight: "85%",
          }}
        >
          <Text style={{ ...typography.title, color: theme.text }}>
            {t("workspace.createTitle")}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("workspace.namePlaceholder")}
            placeholderTextColor={theme.textMuted}
            style={{
              marginTop: spacing[4],
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              borderRadius: radius.md,
              padding: spacing[4],
              color: theme.text,
            }}
          />

          <Text
            style={{
              ...typography.label,
              color: theme.textMuted,
              marginTop: spacing[4],
            }}
          >
            {t("workspace.pickIcon")}
          </Text>
          <ScrollView
            style={{ marginTop: spacing[3], maxHeight: 200 }}
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing[2],
            }}
          >
            {WORKSPACE_ICONS.map((item) => {
              const selected = item.id === icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setIcon(item.id)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: theme.surface,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {error ? (
            <Text
              style={{
                ...typography.caption,
                color: theme.danger,
                marginTop: spacing[3],
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            disabled={mutation.isPending || !name.trim()}
            onPress={() => mutation.mutate()}
            style={{
              marginTop: spacing[6],
              backgroundColor: theme.primary,
              borderRadius: radius.md,
              paddingVertical: spacing[4],
              alignItems: "center",
              opacity: mutation.isPending || !name.trim() ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ ...typography.label, color: "#fff" }}>
                {t("workspace.create")}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            style={{ marginTop: spacing[3], alignItems: "center" }}
          >
            <Text style={{ ...typography.body, color: theme.textMuted }}>
              {t("workspace.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
