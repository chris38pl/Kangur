import {
  getShoppingCategoryIcon,
  SHOPPING_CATEGORIES,
  type ShoppingCategory,
} from "@shared/shopping-categories";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

/** Picker order: “other” first, then the rest of the store flow. */
const CATEGORY_PICKER_ORDER: readonly ShoppingCategory[] = [
  "other",
  ...SHOPPING_CATEGORIES.filter((cat) => cat !== "other"),
];

type Props = {
  value: ShoppingCategory;
  onChange: (category: ShoppingCategory) => void;
  /** Show “Kategoria” label above the row. */
  showLabel?: boolean;
};

function SearchIcon({ color, size = 18 }: { color: string; size?: number }) {
  const lens = size * 0.62;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: lens,
          height: lens,
          borderRadius: lens / 2,
          borderWidth: 1.7,
          borderColor: color,
          marginRight: size * 0.12,
          marginBottom: size * 0.12,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.38,
          height: 1.7,
          backgroundColor: color,
          borderRadius: 1,
          right: 0,
          bottom: size * 0.08,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

function ClearIcon({ color, size = 14 }: { color: string; size?: number }) {
  const bar: ViewStyle = {
    position: "absolute",
    width: size * 0.85,
    height: 1.7,
    backgroundColor: color,
    borderRadius: 1,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

export function CategoryChips({ value, onChange, showLabel = true }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const searchRef = useRef<TextInput>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => searchRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCategories = CATEGORY_PICKER_ORDER.filter((cat) => {
    if (!normalizedQuery) return true;
    return t(`categories.${cat}`).toLocaleLowerCase().includes(normalizedQuery);
  });

  const clearSearch = () => {
    setQuery("");
    searchRef.current?.focus();
  };

  const closeSearch = () => {
    setQuery("");
    setSearchOpen(false);
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing[3],
          minHeight: 28,
        }}
      >
        {showLabel ? (
          <Text
            style={{
              ...typography.headline,
              color: theme.text,
              flex: 1,
            }}
          >
            {t("list.categoryLabel")}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable
          onPress={() => {
            if (searchOpen) {
              closeSearch();
            } else {
              setSearchOpen(true);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t("list.categorySearchA11y")}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: searchOpen ? `${theme.primary}14` : "transparent",
          }}
        >
          <SearchIcon
            color={searchOpen ? theme.primary : theme.textMuted}
            size={18}
          />
        </Pressable>
      </View>

      {searchOpen ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing[3],
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            borderRadius: radius.md,
            paddingLeft: spacing[3],
            paddingRight: spacing[1],
            minHeight: 44,
          }}
        >
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder={t("list.categorySearchPlaceholder")}
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              ...typography.body,
              color: theme.text,
              paddingVertical: spacing[2],
            }}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={clearSearch}
              accessibilityRole="button"
              accessibilityLabel={t("list.categorySearchClearA11y")}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClearIcon color={theme.textMuted} size={14} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {visibleCategories.length === 0 ? (
        <Text
          style={{
            ...typography.caption,
            color: theme.textMuted,
            paddingVertical: spacing[2],
          }}
        >
          {t("list.categorySearchEmpty")}
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: spacing[2], paddingRight: spacing[2] }}
        >
          {visibleCategories.map((cat) => {
            const selected = cat === value;
            return (
              <Pressable
                key={cat}
                onPress={() => onChange(cat)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
                  paddingVertical: spacing[2],
                  paddingHorizontal: spacing[3],
                  borderRadius: radius.full,
                  backgroundColor: selected
                    ? `${theme.primary}14`
                    : theme.section,
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? theme.primary : "transparent",
                }}
              >
                <Text style={{ fontSize: 16 }}>
                  {getShoppingCategoryIcon(cat)}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    fontWeight: selected ? "600" : "500",
                    color: selected ? theme.primary : theme.text,
                  }}
                >
                  {t(`categories.${cat}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
