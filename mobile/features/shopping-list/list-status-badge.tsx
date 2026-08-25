import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { radius } from "@/design-system/tokens";
import {
  listLifecycleBadgeColors,
  type ListLifecycleStatus,
} from "@/features/shopping-list/list-lifecycle-status";

type Props = {
  status: ListLifecycleStatus;
};

function statusLabelKey(status: ListLifecycleStatus) {
  if (status === "shopping") return "list.statusShopping" as const;
  if (status === "finished") return "list.statusFinished" as const;
  return "list.statusWaiting" as const;
}

/** Compact lifecycle pill (waiting / in progress / finished). */
export function ListStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const colorsForStatus = listLifecycleBadgeColors(status, scheme);
  const labelKey = statusLabelKey(status);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t(labelKey)}
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.full,
        backgroundColor: colorsForStatus.background,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "700",
          letterSpacing: 0.2,
          color: colorsForStatus.text,
        }}
      >
        {t(labelKey)}
      </Text>
    </View>
  );
}
