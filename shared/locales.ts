/**
 * Single source of truth for app locales (UI, API, notifications).
 *
 * How to add a language — checklist:
 * 1. Add an entry here (id, nativeName, englishName, emoji, bcp47, defaultHomeName)
 * 2. mobile/lib/i18n/{id}.json + entry in resources/index.ts
 * 3. backend/locales/{id}.json
 * 4. AI_LOCALE_BY_APP + AI_PROMPTS (if AI should speak that language)
 * 5. pnpm openapi:generate (backend)
 * 6. pnpm test:locales
 *
 * Adding a language must not require editing business handlers, pickers, or
 * `if (locale === …)` branches — extend SSOT and catalogs instead.
 */

const LOCALE_DEFINITIONS = [
  {
    id: "pl",
    nativeName: "Polski",
    englishName: "Polish",
    emoji: "🇵🇱",
    bcp47: "pl-PL",
    defaultHomeName: "Dom",
  },
  {
    id: "en",
    nativeName: "English",
    englishName: "English",
    emoji: "🇬🇧",
    bcp47: "en-GB",
    defaultHomeName: "Home",
  },
  {
    id: "de",
    nativeName: "Deutsch",
    englishName: "German",
    emoji: "🇩🇪",
    bcp47: "de-DE",
    defaultHomeName: "Zuhause",
  },
  {
    id: "ru",
    nativeName: "Русский",
    englishName: "Russian",
    emoji: "🇷🇺",
    bcp47: "ru-RU",
    defaultHomeName: "Дом",
  },
  {
    id: "uk",
    nativeName: "Українська",
    englishName: "Ukrainian",
    emoji: "🇺🇦",
    bcp47: "uk-UA",
    defaultHomeName: "Дім",
  },
  {
    id: "fr",
    nativeName: "Français",
    englishName: "French",
    emoji: "🇫🇷",
    bcp47: "fr-FR",
    defaultHomeName: "Maison",
  },
  {
    id: "es",
    nativeName: "Español",
    englishName: "Spanish",
    emoji: "🇪🇸",
    bcp47: "es-ES",
    defaultHomeName: "Casa",
  },
  {
    id: "it",
    nativeName: "Italiano",
    englishName: "Italian",
    emoji: "🇮🇹",
    bcp47: "it-IT",
    defaultHomeName: "Casa",
  },
  {
    id: "cs",
    nativeName: "Čeština",
    englishName: "Czech",
    emoji: "🇨🇿",
    bcp47: "cs-CZ",
    defaultHomeName: "Domov",
  },
  {
    id: "be",
    nativeName: "Беларуская",
    englishName: "Belarusian",
    emoji: "🇧🇾",
    bcp47: "be-BY",
    defaultHomeName: "Дом",
  },
] as const;

export type AppLocale = (typeof LOCALE_DEFINITIONS)[number]["id"];

export type LocaleMeta = {
  id: AppLocale;
  nativeName: string;
  englishName: string;
  emoji: string;
  bcp47: string;
  defaultHomeName: string;
};

/** Picker order = definition order. */
export const SUPPORTED_LOCALES: readonly LocaleMeta[] = LOCALE_DEFINITIONS;

export const DEFAULT_LOCALE: AppLocale = "en";

export const APP_LOCALE_IDS: readonly AppLocale[] = SUPPORTED_LOCALES.map(
  (m) => m.id,
);

export const LOCALE_META: Record<AppLocale, LocaleMeta> = Object.fromEntries(
  SUPPORTED_LOCALES.map((m) => [m.id, m]),
) as Record<AppLocale, LocaleMeta>;

export function localeMeta(locale: AppLocale): LocaleMeta {
  return LOCALE_META[locale];
}

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (APP_LOCALE_IDS as readonly string[]).includes(value)
  );
}

/** Map BCP-47 / device tag → AppLocale (primary subtag; unknown → DEFAULT). */
export function resolveAppLocale(
  raw: string | null | undefined,
): AppLocale {
  if (!raw) return DEFAULT_LOCALE;
  const primary = raw.trim().toLowerCase().split(/[-_]/)[0] ?? "";
  if (isAppLocale(primary)) return primary;
  return DEFAULT_LOCALE;
}

export function intlLocaleTag(locale: string): string {
  return localeMeta(resolveAppLocale(locale)).bcp47;
}

/**
 * Preference order: profile → Accept-Language (primary tags) → default.
 * Accept-Language examples: `de-AT,de;q=0.9,en;q=0.8` → `de`.
 */
export function resolvePreferredLocale(input: {
  profileLocale?: string | null;
  acceptLanguage?: string | null;
  defaultLocale?: AppLocale;
}): AppLocale {
  const fallback = input.defaultLocale ?? DEFAULT_LOCALE;

  if (isAppLocale(input.profileLocale)) {
    return input.profileLocale;
  }

  const fromHeader = pickFromAcceptLanguage(input.acceptLanguage);
  if (fromHeader) return fromHeader;

  return fallback;
}

function pickFromAcceptLanguage(
  header: string | null | undefined,
): AppLocale | null {
  if (!header?.trim()) return null;

  const tags = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      let q = 1;
      for (const p of params) {
        const m = /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(p);
        if (m) q = Number(m[1]) || 0;
      }
      return { tag: (tag ?? "").trim(), q };
    })
    .filter((t) => t.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    const primary = tag.toLowerCase().split(/[-_]/)[0] ?? "";
    if (isAppLocale(primary)) return primary;
  }

  return null;
}
