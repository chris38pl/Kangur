import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getWorkspaceIconEmoji } from "@shared/workspace-icons";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

import type { Workspace } from "./schemas";

type Props = {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function WorkspaceSwitcher({ workspaces, activeId, onSelect }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ marginTop: spacing[6] }}>
      <Text style={{ ...typography.label, color: theme.textMuted }}>
        {t("workspace.switcher")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: spacing[3] }}
        contentContainerStyle={{ gap: spacing[2] }}
      >
        {workspaces.map((ws) => {
          const selected = ws.id === activeId;
          const emoji = getWorkspaceIconEmoji(ws.icon) ?? "🏠";
          return (
            <Pressable
              key={ws.id}
              onPress={() => onSelect(ws.id)}
              style={{
                minWidth: 96,
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[3],
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.surface : theme.bg,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
              <Text
                numberOfLines={1}
                style={{
                  ...typography.caption,
                  color: theme.text,
                  marginTop: spacing[1],
                }}
              >
                {ws.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
