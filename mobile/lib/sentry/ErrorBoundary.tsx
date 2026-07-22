import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, View } from "react-native";

import { colors, spacing } from "@/design-system/tokens";

import { captureException } from "./init";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Reports to Sentry then shows a minimal fallback UI.
 * Replaces bare `export { ErrorBoundary } from "expo-router"`.
 */
export class SentryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureException(error, {
      severity: "fatal",
      extra: { componentStack: info.componentStack ?? undefined },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing[6],
            backgroundColor: colors.light.bg,
          }}
        >
          <Text
            style={{
              color: colors.light.text,
              textAlign: "center",
              fontSize: 16,
            }}
          >
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}
