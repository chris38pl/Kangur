import { Platform, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";

import { DISPLAY_NAME_MAX, nameProblem, normalizeNameInput } from "./display-name";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

/**
 * One empty field with an example and a preview of what the household will see. An address
 * typed by mistake gets "a name, not an address".
 */
export function NameField({
  label,
  value,
  onChangeText,
  autoFocus,
  onSubmitEditing,
  onFocus,
  onBlur,
}: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const problem = nameProblem(value);
  const name = normalizeNameInput(value);

  return (
    <View>
      <Text style={{ ...typography.label, color: theme.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t("name.placeholder")}
        placeholderTextColor={theme.textMuted}
        autoFocus={autoFocus}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
        textContentType="givenName"
        maxLength={DISPLAY_NAME_MAX + 10}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityLabel={label}
        style={{
          marginTop: spacing[2],
          borderWidth: 1,
          borderColor: problem ? theme.danger : theme.border,
          backgroundColor: theme.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing[3],
          paddingVertical: Platform.OS === "ios" ? spacing[3] : spacing[2] + 2,
          color: theme.text,
          ...typography.body,
        }}
      />
      <Text
        style={{
          ...typography.caption,
          color: problem ? theme.danger : theme.textMuted,
          marginTop: spacing[2],
          minHeight: 18,
        }}
      >
        {problem === "email"
          ? t("name.notEmail")
          : problem === "too_long"
            ? t("name.tooLong")
            : name
              ? t("name.preview", { name })
              : ""}
      </Text>
    </View>
  );
}
