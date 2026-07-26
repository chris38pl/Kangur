import { View, type ViewStyle } from "react-native";

type MicIconProps = {
  color: string;
  size?: number;
};

const STROKE = 1.7;

/** Simple microphone mark for dictate controls. */
export function MicIcon({ color, size = 20 }: MicIconProps) {
  const capsuleW = size * 0.36;
  const capsuleH = size * 0.52;
  const stemH = size * 0.14;
  const baseW = size * 0.42;

  return (
    <View
      style={
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        } satisfies ViewStyle
      }
    >
      <View
        style={{
          width: capsuleW,
          height: capsuleH,
          borderRadius: capsuleW / 2,
          borderWidth: STROKE,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.62,
          height: size * 0.28,
          borderWidth: STROKE,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: size * 0.32,
          borderBottomRightRadius: size * 0.32,
          marginTop: -size * 0.04,
        }}
      />
      <View
        style={{
          width: STROKE,
          height: stemH,
          backgroundColor: color,
          marginTop: -STROKE,
        }}
      />
      <View
        style={{
          width: baseW,
          height: STROKE,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}
