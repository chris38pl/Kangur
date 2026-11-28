import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, spacing, typography } from "@/design-system/tokens";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useOpenSession } from "@/hooks/useOpenSession";
import { Analytics } from "@/lib/analytics";
import { ApiClientError } from "@/lib/api/client";
import type { NamePromptPlace } from "@shared/analytics/events";

import { normalizeNameInput, savableName } from "./display-name";
import { NameField } from "./name-field";
import { useUpdateDisplayName } from "./useUpdateDisplayName";

type Props = {
  visible: boolean;
  place: NamePromptPlace;
  /** The name now, or null for a person without one. */
  currentName: string | null;
  onClose: () => void;
  onSaved?: (name: string | null) => void;
};

/** "Your name" in a sheet: the members banner, "Change" lines, Profile. Always skippable. */
export function NameSheet(props: Props) {
  const session = useOpenSession(props.visible);
  return <NameSheetContent key={session} {...props} />;
}

function NameSheetContent({ visible, place, currentName, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight(visible);
  const mutation = useUpdateDisplayName(place);
  const [value, setValue] = useState(currentName ?? "");
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !currentName) Analytics.track("name_prompt_shown", { place });
    // Once per opening: the content is new for each one.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [visible]);

  const close = () => {
    if (mutation.isPending) return;
    Keyboard.dismiss();
    if (!currentName) Analytics.track("name_skipped", { place });
    onClose();
  };

  const name = normalizeNameInput(value);
  // In Profile an empty field removes the name; elsewhere it simply closes.
  const removes = place === "profile" && !name && Boolean(currentName);
  const canSave =
    !mutation.isPending &&
    (removes || (savableName(value) !== null && name !== (currentName ?? "")));

  const save = () => {
    if (!canSave) return;
    setFailed(null);
    const next = removes ? null : savableName(value);
    mutation.mutate(next, {
      onSuccess: () => {
        Keyboard.dismiss();
        onSaved?.(next);
        onClose();
      },
      onError: (error) => {
        const reason = error instanceof ApiClientError ? error.details?.reason : null;
        setFailed(reason === "name_email" ? t("name.notEmail") : t("name.saveFailed"));
      },
    });
  };

  const bottomPad =
    keyboardHeight > 0 ? spacing[4] : spacing[6] + Math.max(insets.bottom, spacing[4]);

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
          accessibilityLabel={t("name.skip")}
          onPress={close}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing[6],
            paddingHorizontal: spacing[6],
            paddingBottom: bottomPad,
            marginBottom: keyboardHeight,
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <Text style={{ ...typography.title, color: theme.text }}>
              {t("name.sheetTitle")}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: theme.textBody,
                marginTop: spacing[2],
                marginBottom: spacing[4],
              }}
            >
              {t("name.sheetBody")}
            </Text>
            <NameField
              label={t("name.fieldLabelProfile")}
              value={value}
              onChangeText={setValue}
              autoFocus
              onSubmitEditing={save}
            />
            {failed ? (
              <Text style={{ ...typography.caption, color: theme.danger, marginTop: spacing[1] }}>
                {failed}
              </Text>
            ) : null}
            <Pressable
              onPress={save}
              disabled={!canSave}
              accessibilityRole="button"
              style={{
                marginTop: spacing[4],
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                paddingVertical: spacing[4],
                alignItems: "center",
                opacity: canSave ? 1 : 0.6,
              }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <Text style={{ ...typography.label, color: theme.onPrimary }}>
                  {removes ? t("name.remove") : t("name.save")}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              style={{ marginTop: spacing[3], minHeight: 44, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ ...typography.label, color: theme.textMuted }}>
                {currentName ? t("workspace.cancel") : t("name.skip")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
