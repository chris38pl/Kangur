import { getShoppingCategoryIcon } from "@shared/shopping-categories";
import {
  resolveCatalogLabel,
  searchCatalogProducts,
  type CatalogProduct,
  type CatalogSearchHit,
} from "@shared/product-catalog";
import { useMemo, type ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { resolveAppLocale } from "@/lib/i18n";

import { CATEGORY_BADGE_COLORS } from "./category-badge-colors";

type SuggestionsProps = {
  query: string;
  /** When false, suggestions are hidden (e.g. name field blurred). */
  visible?: boolean;
  onSelect: (product: CatalogProduct) => void;
};

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

export function useProductCatalogHits(query: string): CatalogSearchHit[] {
  const { i18n } = useTranslation();
  const locale = resolveAppLocale(i18n.language);
  return useMemo(
    () => searchCatalogProducts(query, locale, 6),
    [query, locale],
  );
}

type NameFieldProps = {
  query: string;
  onClear: () => void;
  /** Trailing X only while the name field is focused and hits exist. */
  focused?: boolean;
  children: (clearVisible: boolean) => ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Wraps the product-name TextInput and shows a trailing X while autocomplete
 * has visible hits. `children(clearVisible)` so the input can pad for the icon.
 */
export function ProductNameFieldWithClear({
  query,
  onClear,
  focused = true,
  children,
  style,
}: NameFieldProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const hits = useProductCatalogHits(query);
  const clearVisible = focused && hits.length > 0;

  return (
    <View style={[{ position: "relative" }, style]}>
      {children(clearVisible)}
      {clearVisible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("list.catalogSuggestionClearA11y")}
          onPress={onClear}
          hitSlop={8}
          android_ripple={{ color: theme.border, borderless: true }}
          style={{
            position: "absolute",
            right: spacing[2],
            top: 0,
            bottom: 0,
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <ClearIcon color={theme.textMuted} size={14} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Catalog autocomplete. Row layout lives on an inner View (same as ListItemRow).
 * Do NOT put flexDirection:"row" on Pressable - Android often ignores it and
 * stacks children vertically (icon above label).
 */
export function ProductNameSuggestions({
  query,
  visible = true,
  onSelect,
}: SuggestionsProps) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const locale = resolveAppLocale(i18n.language);
  const hits = useProductCatalogHits(query);

  if (!visible || hits.length === 0) return null;

  return (
    <View
      style={{
        marginTop: spacing[2],
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: radius.md,
        backgroundColor: theme.surface,
        overflow: "hidden",
      }}
    >
      {hits.map(({ product }, index) => {
        const label = resolveCatalogLabel(product, locale);
        const badge = CATEGORY_BADGE_COLORS[product.category];
        const isLast = index === hits.length - 1;

        return (
          <View key={product.slug}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("list.catalogSuggestionA11y", {
                name: label,
              })}
              onPress={() => onSelect(product)}
              android_ripple={{ color: theme.border }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.bg : theme.surface,
              })}
            >
              {/* Row MUST be a View — not Pressable — for Android flexDirection */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[3],
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[4],
                  minHeight: 48,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>
                    {getShoppingCategoryIcon(product.category)}
                  </Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...typography.headline,
                      color: theme.text,
                    }}
                  >
                    {label}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: badge.background,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing[2] + 2,
                    paddingVertical: spacing[1],
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      fontWeight: "600",
                      color: badge.text,
                    }}
                  >
                    {t(`categories.${product.category}`)}
                  </Text>
                </View>
              </View>
            </Pressable>

            {!isLast ? (
              <View style={{ height: 1, backgroundColor: theme.border }} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
