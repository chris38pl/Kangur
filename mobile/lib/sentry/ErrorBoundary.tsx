import { Component, type ErrorInfo, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { spacing } from "@/design-system/tokens";
import {
  BOOT_DIAG_ENABLED,
  bootFatal,
  formatBootLogForDisplay,
  hideNativeSplashLogged,
} from "@/lib/boot-diagnostics";

import { captureException } from "./init";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string; stack?: string };

/**
 * Reports to Sentry when configured.
 * With EXPO_PUBLIC_BOOT_DIAG=1: shows real error + boot log (temporary).
 */
export class SentryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message ?? String(error),
      stack: error?.stack,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (BOOT_DIAG_ENABLED) {
      bootFatal(error, "ErrorBoundary");
      void hideNativeSplashLogged("error_boundary");
    }
    captureException(error, {
      severity: "fatal",
      extra: { componentStack: info.componentStack ?? undefined },
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (BOOT_DIAG_ENABLED) {
      const boot = formatBootLogForDisplay();
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#111",
            padding: spacing[4],
            paddingTop: spacing[10],
          }}
        >
          <Text
            style={{
              color: "#fbbf24",
              fontWeight: "700",
              fontSize: 16,
              marginBottom: spacing[3],
            }}
          >
            BOOT / RENDER ERROR (temporary diag)
          </Text>
          <ScrollView>
            <Text
              selectable
              style={{
                color: "#fecaca",
                fontSize: 13,
                marginBottom: spacing[4],
                fontFamily: "monospace",
              }}
            >
              {this.state.message}
              {this.state.stack ? `\n\n${this.state.stack}` : ""}
            </Text>
            <Text
              selectable
              style={{
                color: "#e5e7eb",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              {boot}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing[6],
        }}
      >
        <Text style={{ fontSize: 16, textAlign: "center" }}>
          Something went wrong. Please restart the app.
        </Text>
      </View>
    );
  }
}
