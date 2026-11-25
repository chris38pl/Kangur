"use client";

import { useDeferredValue, useMemo } from "react";

import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { encodeQr, qrPath } from "@/lib/marketing/qr/encode";

import styles from "./ToKangur.module.css";

/** Light modules around the code, without which phones do not see where it begins. */
const QUIET = 4;
/** About this wide on the screen: small codes get bigger modules, dense ones stay readable. */
const TARGET = 300;

/** This very list as a code to scan. Drawn here, nothing is sent anywhere. */
export function HandoffQr({ url }: { url: string }) {
  // Ticking a product must not wait for the code.
  const later = useDeferredValue(url);
  const code = useMemo(() => encodeQr(later), [later]);
  if (!code) return null;

  const side = code.size + QUIET * 2;
  // A whole number of screen pixels per module, or the edges blur and phones give up.
  const ratio = window.devicePixelRatio || 1;
  const width = (Math.max(2, Math.floor((TARGET * ratio) / side)) * side) / ratio;
  return (
    <svg
      className={styles.code}
      viewBox={`${-QUIET} ${-QUIET} ${side} ${side}`}
      width={width}
      height={width}
      role="img"
      aria-label={HANDOFF.qr.label}
      shapeRendering="crispEdges"
    >
      <rect x={-QUIET} y={-QUIET} width={side} height={side} fill="#fff" />
      <path d={qrPath(code)} fill="#1f2b45" />
    </svg>
  );
}
