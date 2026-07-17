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
import type {
  ShoppingCategory,
  ShoppingItem,
} from "@/features/shopping-item/schemas";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useSheetBottomPadding } from "@/hooks/useSafeAreaLayout";

type Props = {
  visible: boolean;
  item: ShoppingItem | null;
  onClose: () => void;
  onSave: (input: {
    name: string;
    amount: string | null;
    note: string | null;
    category: ShoppingCategory;
  }) => void;
  onDelete: () => void;
};

export function EditItemSheet({
  visible,
  item,
  onClose,
  onSave,
  onDelete,
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
  const [category, setCategory] = useState<ShoppingCategory>("other");

  useEffect(() => {
    if (!visible || !item) return;
    setName(item.name);
    setAmount(item.amount ?? "");
    setNote(item.note ?? "");
    setCategory(item.category);
    const timer = setTimeout(() => nameRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [visible, item]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      name: trimmed,
      amount: amount.trim() ? amount.trim() : null,
      note: note.trim() ? note.trim() : null,
      category,
    });
    Keyboard.dismiss();
    onClose();
  };

  const fieldStyle = {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing[4],
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
          accessibilityLabel={t("list.editItemCancel")}
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
              {t("list.editItemTitle")}
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
                {t("list.editItemSave")}
              </Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              style={{
                marginTop: spacing[3],
                borderWidth: 1,
                borderColor: `${theme.danger}55`,
                backgroundColor: theme.surface,
                borderRadius: radius.md,
                paddingVertical: spacing[4],
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.label, color: theme.danger }}>
                {t("list.editItemDelete")}
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
                {t("list.editItemCancel")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
