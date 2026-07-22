import { Pressable, ScrollView, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

export type ListStatusFilter = "all" | "pending" | "bought" | "unavailable";

type Counts = {
  pending: number;
  bought: number;
  unavailable: number;
};

type Props = {
  value: ListStatusFilter;
  onChange: (value: ListStatusFilter) => void;
  counts: Counts;
};

type FilterOption = {
  id: ListStatusFilter;
  label: string;
};

/**
 * Horizontal status filter pills for the edit-mode items list.
 * Active: teal outline; inactive: muted filled pill.
 */
export function ListStatusFilterChips({ value, onChange, counts }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];

  const options: FilterOption[] = [
    { id: "all", label: t("list.filterAll") },
    {
      id: "pending",
      label: t("list.filterPending", { count: counts.pending }),
    },
    {
      id: "bought",
      label: t("list.filterBought", { count: counts.bought }),
    },
    {
      id: "unavailable",
      label: t("list.filterUnavailable", { count: counts.unavailable }),
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: spacing[2],
        paddingRight: spacing[2],
      }}
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[3],
              borderRadius: radius.full,
              backgroundColor: selected ? "transparent" : theme.section,
              borderWidth: 1.5,
              borderColor: selected ? theme.primary : "transparent",
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: selected ? "600" : "500",
                color: selected ? theme.primary : theme.text,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
