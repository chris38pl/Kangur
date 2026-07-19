import {
  DEFAULT_LOCALE,
  resolveAppLocale,
  type AppLocale,
} from "@/lib/locale";

import be from "../locales/be.json";
import cs from "../locales/cs.json";
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import it from "../locales/it.json";
import pl from "../locales/pl.json";
import ru from "../locales/ru.json";
import uk from "../locales/uk.json";

type Catalog = typeof en;

const CATALOGS: Record<AppLocale, Catalog> = {
  en,
  pl,
  de,
  ru,
  uk,
  fr,
  es,
  it,
  cs,
  be,
};

function lookup(
  catalog: Catalog,
  key: string,
): string | undefined {
  const parts = key.split(".");
  let cur: unknown = catalog;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name];
    return value == null ? `{{${name}}}` : String(value);
  });
}

/**
 * Backend message catalogs (notifications, email).
 * Missing key for requested locale → warn + fallback to DEFAULT_LOCALE.
 */
export function t(
  locale: string | null | undefined,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const code = resolveAppLocale(locale);
  const primary = lookup(CATALOGS[code], key);
  if (primary != null) {
    return interpolate(primary, vars);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing translation: ${code} ${key}`);
  } else {
    console.info("[i18n]", "MissingTranslation", { locale: code, key });
  }

  if (code !== DEFAULT_LOCALE) {
    const fallback = lookup(CATALOGS[DEFAULT_LOCALE], key);
    if (fallback != null) {
      return interpolate(fallback, vars);
    }
  }

  return key;
}

export function getBackendCatalog(locale: AppLocale): Catalog {
  return CATALOGS[locale];
}

export function listBackendCatalogKeys(locale: AppLocale = DEFAULT_LOCALE): string[] {
  const keys: string[] = [];
  const walk = (node: unknown, prefix: string) => {
    if (node == null || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") keys.push(path);
      else walk(v, path);
    }
  };
  walk(CATALOGS[locale], "");
  return keys.sort();
}
