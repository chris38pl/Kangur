import { compareSemver } from "@/lib/semver";
import { intlLocaleTag } from "@/lib/i18n/locales";

import { RELEASE_NOTES_RAW } from "./releases";
import type {
  LocalizedString,
  ReleaseLocale,
  ReleaseNotes,
} from "./types";

const RELEASE_LOCALES: ReleaseLocale[] = ["en", "pl"];

function isReleaseLocale(value: string): value is ReleaseLocale {
  return value === "en" || value === "pl";
}

/** Resolve PL/EN body text; non-EN/PL app locales fall back to en → pl. */
export function resolveLocalizedString(
  value: LocalizedString,
  locale: string,
): string {
  const base = locale.trim().toLowerCase().split("-")[0] ?? "en";
  if (isReleaseLocale(base) && value[base]?.trim()) {
    return value[base];
  }
  for (const key of RELEASE_LOCALES) {
    const text = value[key]?.trim();
    if (text) return text;
  }
  return "";
}

/**
 * Format ISO YYYY-MM-DD for display. Parses as local calendar date
 * to avoid UTC off-by-one.
 */
export function formatReleaseDate(isoDate: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  try {
    return new Intl.DateTimeFormat(intlLocaleTag(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
}

/** All releases sorted by semver descending (never by date). */
export function loadReleases(): ReleaseNotes[] {
  return [...RELEASE_NOTES_RAW].sort((a, b) => {
    const cmp = compareSemver(a.version, b.version);
    if (cmp === null) return 0;
    return -cmp;
  });
}

export function getReleaseByVersion(version: string): ReleaseNotes | null {
  const needle = version.trim();
  return RELEASE_NOTES_RAW.find((r) => r.version === needle) ?? null;
}
