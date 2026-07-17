import { useWindowDimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getWorkspaceIconEmoji } from "@shared/workspace-icons";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

import type { Workspace } from "./schemas";

type Props = {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

/** Matches ScrollView horizontal padding on the workspace screen. */
const SCREEN_PAD = spacing[6];
const TILE_GAP = spacing[2];
const VISIBLE_TILES = 3;

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  onCreate,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const { width: windowWidth } = useWindowDimensions();

  const rowWidth = windowWidth - SCREEN_PAD * 2;
  const tileWidth =
    (rowWidth - TILE_GAP * (VISIBLE_TILES - 1)) / VISIBLE_TILES;

  return (
    <View style={{ marginTop: spacing[8] }}>
      <View
        style={{
          height: 1,
          backgroundColor: theme.border,
          marginBottom: spacing[6],
        }}
      />

      <Text style={{ ...typography.headline, color: theme.text }}>
        {t("workspace.switcher")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        style={{ marginTop: spacing[3] }}
        contentContainerStyle={{ gap: TILE_GAP, paddingRight: TILE_GAP }}
      >
        {workspaces.map((ws) => {
          const selected = ws.id === activeId;
          const emoji = getWorkspaceIconEmoji(ws.icon) ?? "🏠";
          return (
            <Pressable
              key={ws.id}
              onPress={() => onSelect(ws.id)}
              style={{
                width: tileWidth,
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[2],
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

        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel={t("workspace.addNew")}
          style={{
            width: tileWidth,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[2],
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: theme.border,
            borderStyle: "dashed",
            backgroundColor: theme.section,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 28,
              lineHeight: 32,
              color: theme.primary,
              fontWeight: "300",
            }}
          >
            +
          </Text>
          <Text
            numberOfLines={1}
            style={{
              ...typography.caption,
              color: theme.textMuted,
              marginTop: spacing[1],
              fontWeight: "600",
            }}
          >
            {t("workspace.addNew")}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
