import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
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
import type { ShoppingCategory } from "@/features/shopping-item/schemas";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useSheetBottomPadding } from "@/hooks/useSafeAreaLayout";

const CATEGORY_PICKER_ORDER = [
  "other",
  ...SHOPPING_CATEGORIES.filter((cat) => cat !== "other"),
] as const;

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
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const keyboardHeight = useKeyboardHeight(visible);
  const bottomPad = useSheetBottomPadding(spacing[4] + spacing[2], keyboardHeight);
  const nameRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>(defaultCategory);

  useEffect(() => {
    if (!visible) return;
    setCategory(defaultCategory);
    const timer = setTimeout(() => nameRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [visible, defaultCategory]);

  const reset = () => {
    setName("");
    setAmount("");
    setNote("");
    setCategory(defaultCategory);
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

            <TextInput
              ref={nameRef}
              value={name}
              onChangeText={setName}
              placeholder={t("list.namePlaceholder")}
              placeholderTextColor={theme.textMuted}
              returnKeyType="next"
              blurOnSubmit={false}
              style={{ ...fieldStyle, marginTop: spacing[4] }}
            />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder={t("list.amountPlaceholder")}
              placeholderTextColor={theme.textMuted}
              returnKeyType="next"
              blurOnSubmit={false}
              style={fieldStyle}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t("list.notePlaceholder")}
              placeholderTextColor={theme.textMuted}
              returnKeyType="done"
              onSubmitEditing={submit}
              style={fieldStyle}
            />

            <ScrollView
              horizontal
              style={{ marginTop: spacing[3] }}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {CATEGORY_PICKER_ORDER.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    marginRight: spacing[2],
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: radius.md,
                    backgroundColor:
                      category === cat ? theme.primary : theme.bg,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: category === cat ? "#fff" : theme.text,
                    }}
                  >
                    {t(`categories.${cat}`)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

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
