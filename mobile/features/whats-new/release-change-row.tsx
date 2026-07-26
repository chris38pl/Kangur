import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing, typography } from "@/design-system/tokens";

import { CHANGE_TYPE_EMOJI, changeTypeLabelKey } from "./change-type";
import { resolveLocalizedString } from "./load-releases";
import type { ReleaseChange } from "./types";

type Props = {
  change: ReleaseChange;
  locale: string;
};

export function ReleaseChangeRow({ change, locale }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const text = resolveLocalizedString(change.text, locale);
  const isBreaking = change.type === "breaking";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing[3],
        paddingVertical: spacing[2],
      }}
    >
      <Text
        style={{
          fontSize: 16,
          lineHeight: 22,
          marginTop: 1,
        }}
        accessibilityLabel={t(changeTypeLabelKey(change.type))}
      >
        {CHANGE_TYPE_EMOJI[change.type]}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            ...typography.body,
            color: isBreaking ? theme.text : theme.textBody,
            fontWeight: isBreaking ? "600" : "400",
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
