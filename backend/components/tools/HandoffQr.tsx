"use client";

import { useMemo } from "react";

import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { packList } from "@/lib/marketing/lists/handoff";
import { encodeQr, qrPath } from "@/lib/marketing/qr/encode";

import styles from "./ToKangur.module.css";

/** Light modules around the code, without which phones do not see where it begins. */
const QUIET = 4;

/** This very list as a code to scan. Drawn here, nothing is sent anywhere. */
export function HandoffQr({ path, list }: { path: string; list: Record<string, unknown> }) {
  const url = window.location.origin + path + packList(list);
  const code = useMemo(() => encodeQr(url), [url]);

  if (!code) return <p className={styles.long}>{HANDOFF.qr.long}</p>;

  const side = code.size + QUIET * 2;
  return (
    <svg
      className={styles.code}
      viewBox={`${-QUIET} ${-QUIET} ${side} ${side}`}
      role="img"
      aria-label={HANDOFF.qr.label}
      shapeRendering="crispEdges"
    >
      <rect x={-QUIET} y={-QUIET} width={side} height={side} fill="#fff" />
      <path d={qrPath(code)} fill="#1f2b45" />
    </svg>
  );
}
