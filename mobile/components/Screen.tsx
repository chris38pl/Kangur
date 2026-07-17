import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Defaults to top + bottom (status bar + Android nav / gesture bar). */
  edges?: readonly Edge[];
};

/**
 * Full-screen shell that respects system insets (Android nav + status bar).
 */
export function Screen({
  children,
  style,
  edges = ["top", "bottom"] as const,
}: Props) {
  return (
    <SafeAreaView edges={[...edges]} style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}
