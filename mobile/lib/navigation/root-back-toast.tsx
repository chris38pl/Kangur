import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, shadows, spacing, typography } from "@/design-system/tokens";

type ToastPayload = { message: string; nonce: number };
type Listener = (toast: ToastPayload | null) => void;

let current: ToastPayload | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(current);
}

export function showRootBackToast(message: string): void {
  current = { message, nonce: Date.now() };
  emit();
}

export function clearRootBackToast(): void {
  current = null;
  emit();
}

function subscribeRootBackToast(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

const AUTO_DISMISS_MS = 2_000;

/** Presentation for Android double-back-to-exit hint. Mount once under tabs. */
export function RootBackToast() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => subscribeRootBackToast(setToast), []);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => {
      clearRootBackToast();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(handle);
  }, [toast?.nonce, toast]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: insets.bottom + 72,
        left: spacing[4],
        right: spacing[4],
        zIndex: 50,
      }}
    >
      <Pressable
        onPress={() => clearRootBackToast()}
        style={{
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          ...shadows.soft,
        }}
      >
        <Text
          style={{
            ...typography.label,
            color: theme.text,
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {toast.message}
        </Text>
      </Pressable>
    </View>
  );
}
