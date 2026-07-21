import { Image, type ImageStyle, type StyleProp } from "react-native";

type IconProps = {
  size?: number;
  /** Optional tint for monochrome PNGs (e.g. back chevron). */
  color?: string;
  style?: StyleProp<ImageStyle>;
};

const mailWhiteSource = require("@/assets/brand/icon-mail-white.png");
const mailTealSource = require("@/assets/brand/icon-mail-teal.png");
const lockTealSource = require("@/assets/brand/icon-lock-teal.png");
const eyeSource = require("@/assets/brand/icon-eye.png");
const eyeOffSource = require("@/assets/brand/icon-eye-off.png");
const backSource = require("@/assets/brand/icon-back.png");
const googleSource = require("@/assets/brand/icon-google.png");
const appleSource = require("@/assets/brand/icon-apple.png");

function BrandImage({
  source,
  size = 20,
  color,
  style,
}: IconProps & { source: number }) {
  return (
    <Image
      source={source}
      style={[
        { width: size, height: size },
        color ? { tintColor: color } : null,
        style,
      ]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Envelope - white, for primary CTA. */
export function MailIcon({ size = 20, style }: IconProps) {
  return <BrandImage source={mailWhiteSource} size={size} style={style} />;
}

/** Envelope - teal, for form fields. */
export function MailFieldIcon({ size = 20, style }: IconProps) {
  return <BrandImage source={mailTealSource} size={size} style={style} />;
}

/** Lock - teal, for password fields. */
export function LockFieldIcon({ size = 20, style }: IconProps) {
  return <BrandImage source={lockTealSource} size={size} style={style} />;
}

/** Eye / eye-off - password visibility toggle. */
export function EyeIcon({
  size = 20,
  off = false,
  style,
}: IconProps & { off?: boolean }) {
  return (
    <BrandImage
      source={off ? eyeOffSource : eyeSource}
      size={size}
      style={style}
    />
  );
}

/** Back chevron. */
export function BackIcon({ size = 20, color, style }: IconProps) {
  return (
    <BrandImage source={backSource} size={size} color={color} style={style} />
  );
}

/** Official multicolor Google "G". */
export function GoogleIcon({ size = 20, style }: IconProps) {
  return <BrandImage source={googleSource} size={size} style={style} />;
}

/** Apple logo mark. */
export function AppleIcon({ size = 20, style }: IconProps) {
  return <BrandImage source={appleSource} size={size} style={style} />;
}
