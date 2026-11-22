/**
 * Store links that carry the visitor's campaign (utm_*) to the stores, so App Store
 * Connect and Google Play Console can attribute installs. Pure, no Next or React imports.
 */

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** sessionStorage key: the campaign survives moving between landing pages. */
export const UTM_STORAGE_KEY = "kangur_utm";

/**
 * App Store Connect provider token (App Analytics → Campaigns). Without it Apple
 * ignores `ct`. Not a secret: it is part of every public campaign link.
 */
export const APP_STORE_PROVIDER_TOKEN = "129764493";

/** Apple's `ct` allows at most 30 characters. */
const APPLE_CAMPAIGN_MAX = 30;

/** Campaign used when the visitor came without UTM. */
export const DEFAULT_CAMPAIGN = "landing";

export function readUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 100);
  }
  return utm;
}

export function hasUtm(utm: Utm): boolean {
  return Object.keys(utm).length > 0;
}

/** Parse what `UTM_STORAGE_KEY` holds; anything malformed counts as no campaign. */
export function parseStoredUtm(raw: string | null | undefined): Utm {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return {};
    const utm: Utm = {};
    for (const key of UTM_KEYS) {
      const entry = (value as Record<string, unknown>)[key];
      if (typeof entry === "string" && entry.trim()) utm[key] = entry.trim().slice(0, 100);
    }
    return utm;
  } catch {
    return {};
  }
}

/** Apple `ct`: "<source>-<campaign>", e.g. "tiktok-start30"; "landing" without UTM. */
export function appStoreCampaign(utm: Utm): string {
  const raw = [utm.utm_source, utm.utm_campaign].filter(Boolean).join("-");
  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .slice(0, APPLE_CAMPAIGN_MAX)
    .replace(/-+$/, "");
  return clean || DEFAULT_CAMPAIGN;
}

/** `https://apps.apple.com/app/apple-store/id…?pt=…&ct=…&mt=8` */
export function appStoreLink(base: string, utm: Utm): string {
  try {
    const url = new URL(base);
    url.searchParams.set("pt", APP_STORE_PROVIDER_TOKEN);
    url.searchParams.set("ct", appStoreCampaign(utm));
    url.searchParams.set("mt", "8");
    return url.toString();
  } catch {
    return base;
  }
}

/** Google Play reads campaign data from `referrer` (URL-encoded utm_* pairs). */
export function playStoreLink(base: string, utm: Utm): string {
  try {
    const url = new URL(base);
    const referrer = new URLSearchParams(
      hasUtm(utm)
        ? (utm as Record<string, string>)
        : { utm_source: DEFAULT_CAMPAIGN, utm_medium: "website" },
    );
    url.searchParams.set("referrer", referrer.toString());
    return url.toString();
  } catch {
    return base;
  }
}
