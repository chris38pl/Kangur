import { encodeQr, qrPath } from "@shared/qr/encode";
import { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

/** Light modules around the code, without which phones do not find where it begins. */
const QUIET = 4;

/**
 * The invitation link as a code for the other person's camera. Drawn on the phone: the link
 * goes nowhere else. Same encoder as the site (shared/qr/encode.ts).
 */
export function InviteQrCode({
  url,
  size,
  label,
}: {
  url: string;
  size: number;
  label: string;
}) {
  const code = useMemo(() => encodeQr(url), [url]);
  if (!code) return null;
  const side = code.size + QUIET * 2;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-QUIET} ${-QUIET} ${side} ${side}`}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Rect x={-QUIET} y={-QUIET} width={side} height={side} fill="#FFFFFF" />
      <Path d={qrPath(code)} fill="#1F2B45" />
    </Svg>
  );
}

export function QrGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill={color} />
    </Svg>
  );
}

export function ShareGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MailGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16v12H4zM4 7l8 6 8-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
