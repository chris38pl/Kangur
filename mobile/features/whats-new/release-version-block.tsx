import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

import { formatReleaseDate, resolveLocalizedString } from "./load-releases";
import { ReleaseChangeRow } from "./release-change-row";
import type { ReleaseNotes } from "./types";

type Props = {
  release: ReleaseNotes;
  locale: string;
  showDivider?: boolean;
};

export function ReleaseVersionBlock({
  release,
  locale,
  showDivider,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const title = release.title
    ? resolveLocalizedString(release.title, locale)
    : null;
  const dateLabel = formatReleaseDate(release.releaseDate, locale);

  return (
    <View
      style={{
        paddingBottom: showDivider ? spacing[6] : 0,
        marginBottom: showDivider ? spacing[6] : 0,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[2],
          flexWrap: "wrap",
        }}
      >
        <Text
          style={{
            ...typography.title,
            fontSize: 20,
            lineHeight: 26,
            color: theme.text,
            fontWeight: "700",
          }}
        >
          {release.version}
        </Text>
        {release.highlight ? (
          <View
            style={{
              paddingHorizontal: spacing[2],
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: `${theme.primary}18`,
            }}
          >
            <Text
              style={{
                ...typography.caption,
                color: theme.primary,
                fontWeight: "600",
              }}
            >
              {t("whatsNew.highlight")}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          ...typography.caption,
          color: theme.textMuted,
          marginTop: spacing[1],
        }}
      >
        {dateLabel}
      </Text>

      {title ? (
        <Text
          style={{
            ...typography.body,
            color: theme.textBody,
            marginTop: spacing[2],
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing[3], gap: spacing[1] }}>
        {release.changes.map((change, index) => (
          <ReleaseChangeRow
            key={`${release.version}-${index}`}
            change={change}
            locale={locale}
          />
        ))}
      </View>
    </View>
  );
}
