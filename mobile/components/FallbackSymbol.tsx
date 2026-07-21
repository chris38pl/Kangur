import { Text } from "react-native";

type Props = {
  fallback: string;
  color: string;
  size?: number;
};

/**
 * Lightweight icon for places that previously used expo-symbols SymbolView.
 * Avoids native Material Symbols font loading (source of Android render crashes).
 */
export function FallbackSymbol({ fallback, color, size = 22 }: Props) {
  return (
    <Text
      style={{
        fontSize: size,
        lineHeight: size + 2,
        color,
        textAlign: "center",
      }}
    >
      {fallback}
    </Text>
  );
}
