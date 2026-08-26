import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { CategoryChips } from "@/features/shopping-item/category-chips";
import { ProductNameFieldWithClear, ProductNameSuggestions } from "@/features/shopping-item/product-name-suggestions";
import type { ShoppingCategory } from "@/features/shopping-item/schemas";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useSheetBottomPadding } from "@/hooks/useSafeAreaLayout";
import {
  resolveCatalogLabel,
  type CatalogProduct,
} from "@shared/product-catalog";
import { resolveAppLocale } from "@/lib/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    amount?: string;
    note?: string;
    category: ShoppingCategory;
  }) => void;
  defaultCategory?: ShoppingCategory;
};

export function AddItemSheet({
  visible,
  onClose,
  onSubmit,
  defaultCategory = "other",
}: Props) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const keyboardHeight = useKeyboardHeight(visible);
  const bottomPad = useSheetBottomPadding(spacing[4] + spacing[2], keyboardHeight);
  const nameRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>(defaultCategory);
  const [nameFieldFocused, setNameFieldFocused] = useState(false);
  const nameBlurHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => nameRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (nameBlurHideTimerRef.current) {
        clearTimeout(nameBlurHideTimerRef.current);
      }
    };
  }, []);

  const reset = () => {
    setName("");
    setAmount("");
    setNote("");
    setCategory(defaultCategory);
    setNameFieldFocused(false);
  };

  const close = () => {
    Keyboard.dismiss();
    reset();
    onClose();
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      amount: amount.trim() || undefined,
      note: note.trim() || undefined,
      category,
    });
    reset();
    Keyboard.dismiss();
    onClose();
  };

  const fieldStyle = {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing[3],
    color: theme.text,
    backgroundColor: theme.bg,
  } as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("workspace.cancel")}
          onPress={close}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: "92%",
            paddingTop: spacing[6],
            paddingHorizontal: spacing[6],
            paddingBottom: bottomPad,
            marginBottom: keyboardHeight,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: spacing[2] }}
          >
            <Text style={{ ...typography.headline, color: theme.text }}>
              {t("shoppingMode.addItem")}
            </Text>

            <ProductNameFieldWithClear
              query={name}
              focused={nameFieldFocused}
              onClear={() => setName("")}
              style={{ marginTop: spacing[4] }}
            >
              {(clearVisible) => (
                <TextInput
                  ref={nameRef}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => {
                    if (nameBlurHideTimerRef.current) {
                      clearTimeout(nameBlurHideTimerRef.current);
                      nameBlurHideTimerRef.current = null;
                    }
                    setNameFieldFocused(true);
                  }}
                  onBlur={() => {
                    nameBlurHideTimerRef.current = setTimeout(() => {
                      setNameFieldFocused(false);
                      nameBlurHideTimerRef.current = null;
                    }, 180);
                  }}
                  placeholder={t("list.namePlaceholder")}
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  style={{
                    ...fieldStyle,
                    marginTop: 0,
                    paddingRight: clearVisible
                      ? spacing[3] + 36
                      : spacing[3],
                  }}
                />
              )}
            </ProductNameFieldWithClear>
            <ProductNameSuggestions
              query={name}
              visible={nameFieldFocused}
              onSelect={(product: CatalogProduct) => {
                if (nameBlurHideTimerRef.current) {
                  clearTimeout(nameBlurHideTimerRef.current);
                  nameBlurHideTimerRef.current = null;
                }
                setNameFieldFocused(false);
                const locale = resolveAppLocale(i18n.language);
                onSubmit({
                  name: resolveCatalogLabel(product, locale),
                  amount: amount.trim() || undefined,
                  note: note.trim() || undefined,
                  category: product.category as ShoppingCategory,
                });
                reset();
                Keyboard.dismiss();
                onClose();
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "stretch",
                gap: spacing[2],
                marginTop: spacing[2],
              }}
            >
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder={t("list.amountPlaceholderShort")}
                placeholderTextColor={theme.textMuted}
                returnKeyType="next"
                blurOnSubmit={false}
                style={{
                  ...fieldStyle,
                  marginTop: 0,
                  flexGrow: 35,
                  flexShrink: 1,
                  flexBasis: 0,
                }}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t("list.notePlaceholderShort")}
                placeholderTextColor={theme.textMuted}
                returnKeyType="done"
                onSubmitEditing={submit}
                style={{
                  ...fieldStyle,
                  marginTop: 0,
                  flexGrow: 65,
                  flexShrink: 1,
                  flexBasis: 0,
                }}
              />
            </View>

            <View style={{ marginTop: spacing[5] }}>
              <CategoryChips value={category} onChange={setCategory} />
            </View>

            <Pressable
              onPress={submit}
              style={{
                marginTop: spacing[6],
                backgroundColor: theme.primary,
                borderRadius: radius.md,
                paddingVertical: spacing[4],
                alignItems: "center",
                opacity: name.trim() ? 1 : 0.6,
              }}
            >
              <Text style={{ ...typography.label, color: "#fff" }}>
                {t("list.addItem")}
              </Text>
            </Pressable>
            <Pressable
              onPress={close}
              style={{
                marginTop: spacing[3],
                alignItems: "center",
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {t("workspace.cancel")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
