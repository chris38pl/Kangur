import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { brandAssets } from "@/design-system/brand-assets";
import {
  brand,
  colors,
  radius,
  spacing,
  typography,
} from "@/design-system/tokens";
import type { WorkspaceMember } from "@/features/workspace/schemas";

import { CategoryProgressBar } from "./category-progress-bar";

const AVATAR_PALETTE = [
  { background: "#FDECEC", text: "#C45C5C" },
  { background: "#EAF7F2", text: "#2F8F84" },
  { background: "#EEEAF8", text: "#7B6BC9" },
  { background: "#FFF1E6", text: "#D4783A" },
  { background: "#E8F2FB", text: "#4A7FB5" },
  { background: "#FDF0F5", text: "#C46B8A" },
] as const;

const MAX_AVATARS = 3;
const BAG_SIZE = 68;

function avatarColors(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0];
}

type Props = {
  title: string;
  updatedLabel: string;
  bought: number;
  total: number;
  progress: number;
  members?: WorkspaceMember[];
};

/**
 * Current-list summary card at the top of shopping mode.
 */
export function ShoppingListSummaryCard({
  title,
  updatedLabel,
  bought,
  total,
  progress,
  members = [],
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const visible = members.slice(0, MAX_AVATARS);
  const overflow = Math.max(0, members.length - MAX_AVATARS);

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
        }}
      >
        <View
          style={{
            width: BAG_SIZE,
            height: BAG_SIZE,
            borderRadius: radius.lg,
            backgroundColor: brand.accent,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Image
            source={brandAssets.listBag}
            style={{
              width: BAG_SIZE * 0.82,
              height: BAG_SIZE * 0.82,
              resizeMode: "contain",
            }}
            accessibilityLabel=""
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ ...typography.headline, color: theme.text }}
          >
            {title}
          </Text>
          {updatedLabel ? (
            <Text
              style={{
                ...typography.caption,
                color: theme.textMuted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {updatedLabel}
            </Text>
          ) : null}
        </View>

        {members.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              marginTop: 2,
            }}
          >
            {visible.map((member, index) => {
              const initial = (
                member.displayName.trim()[0] ?? "?"
              ).toUpperCase();
              const colorsFor = avatarColors(member.userId);
              return (
                <View
                  key={member.id}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.full,
                    backgroundColor: colorsFor.background,
                    borderWidth: 2,
                    borderColor: theme.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: index === 0 ? 0 : -8,
                    zIndex: visible.length - index,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
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
                  width: 28,
                  height: 28,
                  borderRadius: radius.full,
                  backgroundColor: theme.section,
                  borderWidth: 2,
                  borderColor: theme.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: -8,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: theme.textMuted,
                  }}
                >
                  +{overflow}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: spacing[4] }}>
        <CategoryProgressBar progress={progress} style={{ marginTop: 0 }} />
        <Text
          style={{
            ...typography.caption,
            color: theme.textBody,
            fontWeight: "500",
            marginTop: spacing[2],
          }}
        >
          {t("shoppingMode.productsProgress", { bought, total })}
        </Text>
      </View>
    </View>
  );
}
