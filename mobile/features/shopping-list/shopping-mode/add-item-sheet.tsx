import { SHOPPING_CATEGORIES } from "@shared/shopping-categories";
import { useState } from "react";
import {
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
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>(defaultCategory);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      amount: amount.trim() || undefined,
      note: note.trim() || undefined,
      category,
    });
    setName("");
    setAmount("");
    setNote("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing[6],
            maxHeight: "80%",
          }}
        >
          <Text style={{ ...typography.headline, color: theme.text }}>
            {t("shoppingMode.addItem")}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("list.namePlaceholder")}
            placeholderTextColor={theme.textMuted}
            style={{
              marginTop: spacing[4],
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: radius.md,
              padding: spacing[3],
              color: theme.text,
            }}
          />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={t("list.amountPlaceholder")}
            placeholderTextColor={theme.textMuted}
            style={{
              marginTop: spacing[2],
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: radius.md,
              padding: spacing[3],
              color: theme.text,
            }}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("list.notePlaceholder")}
            placeholderTextColor={theme.textMuted}
            style={{
              marginTop: spacing[2],
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: radius.md,
              padding: spacing[3],
              color: theme.text,
            }}
          />
          <ScrollView
            horizontal
            style={{ marginTop: spacing[3] }}
            showsHorizontalScrollIndicator={false}
          >
            {SHOPPING_CATEGORIES.map((cat) => (
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
            }}
          >
            <Text style={{ ...typography.label, color: "#fff" }}>
              {t("list.addItem")}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: spacing[3], alignItems: "center" }}>
            <Text style={{ ...typography.label, color: theme.textMuted }}>
              {t("workspace.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
