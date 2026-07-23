/**
 * TEMPORARY: on-screen boot log for black-screen diagnosis.
 * Auto-shows after stall or when a fatal is recorded. Force-hides native splash.
 */
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BOOT_DIAG_ENABLED,
  formatBootLogForDisplay,
  getBootEvents,
  getBootFatal,
  hideNativeSplashLogged,
  subscribeBootDiagnostics,
} from "@/lib/boot-diagnostics";

/** Show overlay if boot not marked ready within this window. */
const STALL_MS = 4000;

type Props = {
  /** Optional; overlay also watches boot_ready log events. */
  bootComplete?: boolean;
};

function isBootComplete(bootCompleteProp: boolean | undefined): boolean {
  if (bootCompleteProp) return true;
  return getBootEvents().some((e) => e.stage === "boot_ready");
}

export function BootDiagnosticsOverlay({ bootComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState(() => formatBootLogForDisplay());
  const [dismissed, setDismissed] = useState(false);
  const [complete, setComplete] = useState(() => isBootComplete(bootComplete));

  useEffect(() => {
    if (!BOOT_DIAG_ENABLED) return;
    return subscribeBootDiagnostics(() => {
      setText(formatBootLogForDisplay());
      if (isBootComplete(bootComplete)) setComplete(true);
      if (getBootFatal()) {
        setVisible(true);
        void hideNativeSplashLogged("diag_fatal");
      }
    });
  }, [bootComplete]);

  useEffect(() => {
    if (!BOOT_DIAG_ENABLED || complete) return;
    const t = setTimeout(() => {
      if (isBootComplete(bootComplete) || dismissed) return;
      setVisible(true);
      setText(formatBootLogForDisplay());
      void hideNativeSplashLogged("diag_stall");
    }, STALL_MS);
    return () => clearTimeout(t);
  }, [complete, bootComplete, dismissed]);

  if (!BOOT_DIAG_ENABLED || dismissed || !visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.wrap]}
    >
      <View
        style={[
          styles.card,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>BOOT DIAG (temporary)</Text>
          <Pressable onPress={() => setDismissed(true)} hitSlop={12}>
            <Text style={styles.dismiss}>Close</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.scroll}>
          <Text selectable style={styles.mono}>
            {text}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 99999,
    elevation: 99999,
    justifyContent: "flex-end",
  },
  card: {
    maxHeight: "70%",
    margin: 8,
    backgroundColor: "#111",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    color: "#fbbf24",
    fontWeight: "700",
    fontSize: 13,
  },
  dismiss: {
    color: "#93c5fd",
    fontSize: 13,
  },
  scroll: {
    flexGrow: 0,
  },
  mono: {
    color: "#e5e7eb",
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 15,
    paddingBottom: 8,
  },
});
