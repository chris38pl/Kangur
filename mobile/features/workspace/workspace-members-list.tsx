import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

import type { WorkspaceMember } from "./schemas";

const AVATAR_PALETTE = [
  { background: "#FDECEC", text: "#C45C5C" },
  { background: "#EAF7F2", text: "#2F8F84" },
  { background: "#EEEAF8", text: "#7B6BC9" },
  { background: "#FFF1E6", text: "#D4783A" },
  { background: "#E8F2FB", text: "#4A7FB5" },
  { background: "#FDF0F5", text: "#C46B8A" },
] as const;

type Props = {
  members: WorkspaceMember[];
  currentUserId: string | null;
  loading?: boolean;
};

function avatarColors(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0];
}

function roleLabelKey(role: WorkspaceMember["role"]) {
  if (role === "owner") return "workspace.roleOwner";
  return "workspace.roleEditor";
}

function roleBadgeStyle(role: WorkspaceMember["role"], theme: (typeof colors)["light"]) {
  if (role === "owner") {
    return {
      background: "#EAF7F2",
      text: theme.primary,
    };
  }
  return {
    background: theme.section,
    text: theme.textMuted,
  };
}

export function WorkspaceMembersList({
  members,
  currentUserId,
  loading,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  return (
    <View style={{ marginTop: spacing[6] }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing[3],
        }}
      >
        <Text style={{ ...typography.headline, color: theme.text }}>
          {t("workspace.accessTitle")}
        </Text>
        <Text style={{ ...typography.caption, color: theme.textMuted }}>
          {t("workspace.peopleCount", { count: members.length })}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[4] }} />
      ) : (
        <View style={{ gap: spacing[1] }}>
          {members.map((member) => {
            const isYou = member.userId === currentUserId;
            const initial = (member.displayName.trim()[0] ?? "?").toUpperCase();
            const avatar = avatarColors(member.userId);
            const badge = roleBadgeStyle(member.role, theme);
            const name = isYou
              ? `${member.displayName} ${t("workspace.youSuffix")}`
              : member.displayName;

            return (
              <View
                key={member.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[3],
                  paddingVertical: spacing[3],
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.full,
                    backgroundColor: avatar.background,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      ...typography.label,
                      color: avatar.text,
                      fontWeight: "700",
                    }}
                  >
                    {initial}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={{
                    ...typography.label,
                    color: theme.text,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {name}
                </Text>

                <View
                  style={{
                    backgroundColor: badge.background,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[1],
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      fontWeight: "600",
                      color: badge.text,
                    }}
                  >
                    {t(roleLabelKey(member.role))}
                  </Text>
                </View>

                <Pressable
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t("workspace.memberMenu")}
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      lineHeight: 20,
                      color: theme.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    ⋯
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
