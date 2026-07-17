import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import type { Workspace, WorkspaceMember } from "@/features/workspace/schemas";

const AVATAR_PALETTE = [
  { background: "#FDECEC", text: "#C45C5C" },
  { background: "#EAF7F2", text: "#2F8F84" },
  { background: "#EEEAF8", text: "#7B6BC9" },
  { background: "#FFF1E6", text: "#D4783A" },
  { background: "#E8F2FB", text: "#4A7FB5" },
  { background: "#FDF0F5", text: "#C46B8A" },
] as const;

const MAX_AVATARS = 3;

type Props = {
  workspace: Workspace;
  members: WorkspaceMember[];
  onPress: () => void;
};

function avatarColors(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0];
}

export function HomeWorkspaceBanner({ workspace, members, onPress }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const emoji = getWorkspaceIconEmoji(workspace.icon) ?? "🏠";
  const visible = members.slice(0, MAX_AVATARS);
  const overflow = Math.max(0, members.length - MAX_AVATARS);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("home.workspaceBannerA11y", {
        name: workspace.name,
      })}
      style={{
        backgroundColor: theme.section,
        borderRadius: radius.full,
        paddingVertical: spacing[2] + 2,
        paddingLeft: spacing[2],
        paddingRight: spacing[3],
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ ...typography.headline, color: theme.text }}
        >
          {workspace.name}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {visible.map((member, index) => {
          const initial = (member.displayName.trim()[0] ?? "?").toUpperCase();
          const colorsFor = avatarColors(member.userId);
          return (
            <View
              key={member.id}
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.full,
                backgroundColor: colorsFor.background,
                borderWidth: 2,
                borderColor: theme.section,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: index === 0 ? 0 : -10,
                zIndex: visible.length - index,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: "700",
                  color: colorsFor.text,
                }}
              >
                {initial}
              </Text>
            </View>
          );
        })}
        {overflow > 0 ? (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: theme.surface,
              borderWidth: 2,
              borderColor: theme.section,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -10,
              zIndex: 0,
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: "700",
                color: theme.textMuted,
                fontSize: 11,
              }}
            >
              +{overflow}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          fontSize: 22,
          lineHeight: 24,
          color: theme.textMuted,
          fontWeight: "300",
          marginLeft: spacing[1],
        }}
      >
        ›
      </Text>
    </Pressable>
  );
}
