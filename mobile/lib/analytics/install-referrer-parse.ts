/**
 * Parses a Google Play install referrer such as
 * "utm_source=tiktok&utm_medium=bio&utm_campaign=start30".
 * Hand-rolled on purpose: React Native's URLSearchParams is incomplete.
 */
export type InstallAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const MAX_VALUE_LENGTH = 100;

function decode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

export function parseInstallReferrer(
  raw: string | null | undefined,
): InstallAttribution {
  const out: InstallAttribution = {};
  if (!raw) return out;
  // Some links double-encode the whole referrer ("utm_source%3Dtiktok%26...").
  const text = raw.includes("=") ? raw : decode(raw);
  for (const pair of text.split("&")) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const key = decode(pair.slice(0, eq)).trim().toLowerCase();
    if (!(KEYS as readonly string[]).includes(key)) continue;
    const value = decode(pair.slice(eq + 1)).trim().slice(0, MAX_VALUE_LENGTH);
    if (value) out[key as (typeof KEYS)[number]] = value;
  }
  return out;
}

/** Person properties set once, prefixed so they never clash with UTM super props. */
export function installSetOnce(
  attribution: InstallAttribution,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of KEYS) {
    const value = attribution[key];
    if (value) out[`install_${key}`] = value;
  }
  return out;
}
