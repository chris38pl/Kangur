import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import { colors, radius, shadows, spacing, typography } from "@/design-system/tokens";
import { ToastMotion } from "@/lib/motion";

import {
  clearRemoteChangeToast,
  subscribeRemoteChangeToast,
} from "./remote-change-toast-store";

const AUTO_DISMISS_MS = 3_200;

/**
 * Soft toast for remote list changes. Presentation only - never refreshes data.
 * Replace-in-place when a new batch arrives.
 */
export function RemoteChangeToast() {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; nonce: number } | null>(
    null,
  );
  const [rendered, setRendered] = useState<{
    message: string;
    nonce: number;
  } | null>(null);

  useEffect(() => subscribeRemoteChangeToast(setToast), []);

  useEffect(() => {
    if (!toast) return;
    // Defer so we don't sync-setState inside the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => setRendered(toast));
  }, [toast]);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => {
      clearRemoteChangeToast();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(handle);
  }, [toast?.nonce, toast]);

  if (!rendered) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + spacing[2],
        left: spacing[4],
        right: spacing[4],
        zIndex: 40,
      }}
    >
      <ToastMotion
        visible={toast != null}
        onExited={() => {
          if (!toast) setRendered(null);
        }}
      >
        <Pressable
          onPress={() => clearRemoteChangeToast()}
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
            {rendered.message}
          </Text>
        </Pressable>
      </ToastMotion>
    </View>
  );
}
