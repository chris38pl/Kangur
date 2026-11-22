/**
 * Locale completeness + key-parity vs DEFAULT_LOCALE.
 * Pure Node (no Prisma / path-alias imports) so CI stays light.
 * Run: pnpm test:locales (from backend/)
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const SHARED_LOCALES = path.join(ROOT, "shared/locales.ts");
const MOBILE_I18N = path.join(ROOT, "mobile/lib/i18n");
const BACKEND_LOCALES = path.join(ROOT, "backend/locales");
const AI_SOURCE = path.join(ROOT, "backend/features/ai/outputLanguage.ts");
const RESOURCES = path.join(MOBILE_I18N, "resources/index.ts");
/** iOS permission prompts; one file per non-default locale (see app.config.ts). */
const MOBILE_NATIVE_LOCALES = path.join(ROOT, "mobile/native-locales");
const MOBILE_APP_CONFIG = path.join(ROOT, "mobile/app.config.ts");

function flattenKeys(node: unknown, prefix = ""): string[] {
  if (node == null || typeof node !== "object") return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    const pathKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") keys.push(pathKey);
    else keys.push(...flattenKeys(v, pathKey));
  }
  return keys;
}

function loadJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function parseSupportedLocaleIds(src: string): string[] {
  const ids: string[] = [];
  const re = /^\s*id:\s*"([a-z]{2})"\s*,/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    ids.push(m[1]!);
  }
  return ids;
}

function parseDefaultLocale(src: string): string {
  const m = /export const DEFAULT_LOCALE:\s*AppLocale\s*=\s*"([a-z]{2})"/.exec(
    src,
  );
  if (!m) throw new Error("Could not parse DEFAULT_LOCALE from shared/locales.ts");
  return m[1]!;
}

function pluralBase(key: string): string {
  return key.replace(/_(zero|one|two|few|many|other)$/, "");
}

function assertKeyParity(
  label: string,
  locale: string,
  actualKeys: string[],
  expectedKeys: string[],
  defaultLocale: string,
  errors: string[],
) {
  const actual = new Set(actualKeys);
  const expected = new Set(expectedKeys);

  for (const key of expected) {
    if (!actual.has(key)) {
      errors.push(`${label} ${locale}: missing key "${key}"`);
    }
  }

  for (const key of actual) {
    if (expected.has(key)) continue;
    const base = pluralBase(key);
    const isLocalePluralForm =
      key !== base &&
      [...expected].some((k) => pluralBase(k) === base);
    if (!isLocalePluralForm) {
      errors.push(
        `${label} ${locale}: extra key "${key}" (not in ${defaultLocale})`,
      );
    }
  }
}

function extractObjectKeys(src: string, constName: string): string[] {
  const start = src.indexOf(`export const ${constName}`);
  if (start < 0) return [];
  const brace = src.indexOf("{", start);
  if (brace < 0) return [];
  let depth = 0;
  let end = brace;
  for (let i = brace; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = src.slice(brace, end + 1);
  const keys: string[] = [];
  const re = /^\s*([a-z]{2})\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    keys.push(m[1]!);
  }
  return keys;
}

/**
 * iOS languages in the binary: IOS_LANGUAGES in mobile/app.config.ts must list
 * every locale, and mobile/native-locales must hold exactly the non-default
 * ones, each with the same permission prompts.
 */
function checkNativeLocales(
  localeIds: string[],
  defaultLocale: string,
  errors: string[],
) {
  const configMatch = /const IOS_LANGUAGES = \[([^\]]*)\]/.exec(
    readFileSync(MOBILE_APP_CONFIG, "utf8"),
  );
  if (!configMatch) {
    errors.push("mobile/app.config.ts: IOS_LANGUAGES not found");
  } else {
    const iosIds = [...configMatch[1]!.matchAll(/"([a-z]{2})"/g)].map(
      (m) => m[1]!,
    );
    if ([...iosIds].sort().join() !== [...localeIds].sort().join()) {
      errors.push(
        `mobile/app.config.ts: IOS_LANGUAGES (${iosIds.join(", ")}) must match shared/locales.ts (${localeIds.join(", ")})`,
      );
    }
  }

  if (!existsSync(MOBILE_NATIVE_LOCALES)) {
    errors.push("mobile/native-locales missing");
    return;
  }
  const expectedIds = localeIds.filter((id) => id !== defaultLocale);
  const fileIds = readdirSync(MOBILE_NATIVE_LOCALES)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -".json".length));

  for (const id of fileIds) {
    if (!expectedIds.includes(id)) {
      errors.push(
        `mobile/native-locales/${id}.json: not a non-default locale in shared/locales.ts`,
      );
    }
  }

  let referenceKeys: string[] | null = null;
  let referenceId = "";
  for (const id of expectedIds) {
    const filePath = path.join(MOBILE_NATIVE_LOCALES, `${id}.json`);
    if (!existsSync(filePath)) {
      errors.push(`mobile/native-locales missing: ${id}.json`);
      continue;
    }
    const json = loadJson(filePath) as { ios?: Record<string, unknown> };
    const iosStrings = json.ios ?? {};
    const keys = Object.keys(iosStrings).sort();
    if (keys.length === 0) {
      errors.push(`mobile/native-locales/${id}.json: no "ios" strings`);
      continue;
    }
    for (const [key, value] of Object.entries(iosStrings)) {
      // Expo writes values into InfoPlist.strings without escaping.
      if (typeof value !== "string" || value.trim() === "" || value.includes('"')) {
        errors.push(
          `mobile/native-locales/${id}.json: "${key}" must be a non-empty string without double quotes`,
        );
      }
    }
    if (referenceKeys === null) {
      referenceKeys = keys;
      referenceId = id;
    } else if (keys.join() !== referenceKeys.join()) {
      errors.push(
        `mobile/native-locales/${id}.json: keys differ from ${referenceId}.json`,
      );
    }
  }
}

function main() {
  const errors: string[] = [];
  const localesSrc = readFileSync(SHARED_LOCALES, "utf8");
  const localeIds = parseSupportedLocaleIds(localesSrc);
  const defaultLocale = parseDefaultLocale(localesSrc);

  if (localeIds.length === 0) {
    errors.push("No locale ids parsed from shared/locales.ts");
  }

  if (!existsSync(RESOURCES)) {
    errors.push("mobile resources/index.ts missing");
  } else {
    const resourcesSrc = readFileSync(RESOURCES, "utf8");
    for (const id of localeIds) {
      if (!new RegExp(`\\b${id}\\s*:`).test(resourcesSrc)) {
        errors.push(`mobile resources/index.ts: missing entry for "${id}"`);
      }
    }
  }

  const mobileDefaultPath = path.join(MOBILE_I18N, `${defaultLocale}.json`);
  if (!existsSync(mobileDefaultPath)) {
    errors.push(`mobile catalog missing: ${defaultLocale}.json`);
  }
  const mobileDefaultKeys = existsSync(mobileDefaultPath)
    ? flattenKeys(loadJson(mobileDefaultPath)).sort()
    : [];

  const backendDefaultPath = path.join(
    BACKEND_LOCALES,
    `${defaultLocale}.json`,
  );
  if (!existsSync(backendDefaultPath)) {
    errors.push(`backend catalog missing: ${defaultLocale}.json`);
  }
  const backendDefaultKeys = existsSync(backendDefaultPath)
    ? flattenKeys(loadJson(backendDefaultPath)).sort()
    : [];

  const aiSrc = existsSync(AI_SOURCE) ? readFileSync(AI_SOURCE, "utf8") : "";
  if (!aiSrc) {
    errors.push("backend/features/ai/outputLanguage.ts missing");
  }
  const aiMapKeys = extractObjectKeys(aiSrc, "AI_LOCALE_BY_APP");
  const aiPromptKeys = extractObjectKeys(aiSrc, "AI_PROMPTS");

  for (const id of localeIds) {
    const mobilePath = path.join(MOBILE_I18N, `${id}.json`);
    if (!existsSync(mobilePath)) {
      errors.push(`mobile catalog missing: ${id}.json`);
    } else if (mobileDefaultKeys.length > 0) {
      assertKeyParity(
        "mobile",
        id,
        flattenKeys(loadJson(mobilePath)),
        mobileDefaultKeys,
        defaultLocale,
        errors,
      );
    }

    const backendPath = path.join(BACKEND_LOCALES, `${id}.json`);
    if (!existsSync(backendPath)) {
      errors.push(`backend catalog missing: ${id}.json`);
    } else if (backendDefaultKeys.length > 0) {
      assertKeyParity(
        "backend",
        id,
        flattenKeys(loadJson(backendPath)),
        backendDefaultKeys,
        defaultLocale,
        errors,
      );
    }

    if (!aiMapKeys.includes(id)) {
      errors.push(`AI_LOCALE_BY_APP missing "${id}"`);
    } else {
      // Mapped AI language must have a prompt entry (same id today; still check map target).
      const mapMatch = new RegExp(`${id}\\s*:\\s*"([a-z]{2})"`).exec(
        aiSrc.slice(aiSrc.indexOf("AI_LOCALE_BY_APP")),
      );
      const mapped = mapMatch?.[1] ?? id;
      if (!aiPromptKeys.includes(mapped)) {
        errors.push(
          `AI_PROMPTS missing for mapped language of "${id}" (${mapped})`,
        );
      }
    }
  }

  checkNativeLocales(localeIds, defaultLocale, errors);

  if (errors.length > 0) {
    console.error("Locale completeness check failed:\n");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `Locale check OK: ${localeIds.length} locales (${localeIds.join(", ")}), mobile + backend key parity vs ${defaultLocale}, AI maps complete.`,
  );
}

main();
