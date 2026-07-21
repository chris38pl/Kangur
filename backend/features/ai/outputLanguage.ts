import { prisma } from "@/lib/prisma";
import {
  isAppLocale,
  resolveAppLocale,
  type AppLocale,
} from "@/lib/locale";

/** AI may support a subset of AppLocale in the future - keep types separate. */
export type AiOutputLanguage =
  | "pl"
  | "en"
  | "de"
  | "ru"
  | "uk"
  | "fr"
  | "es"
  | "it"
  | "cs"
  | "be";

/**
 * Total mapping AppLocale → AiOutputLanguage.
 * Adding AppLocale without an entry is a TypeScript compile error.
 */
export const AI_LOCALE_BY_APP: Record<AppLocale, AiOutputLanguage> = {
  pl: "pl",
  en: "en",
  de: "de",
  ru: "ru",
  uk: "uk",
  fr: "fr",
  es: "es",
  it: "it",
  cs: "cs",
  be: "be",
};

export function mapToAiLanguage(locale: AppLocale): AiOutputLanguage {
  return AI_LOCALE_BY_APP[locale];
}

export type AiPromptConfig = {
  languageName: string;
  systemInstruction: string;
  fallbackExamples?: string;
  /** Optional local product/unit examples for future prompt enrichment. */
  exampleShoppingTerms?: string[];
};

export const AI_PROMPTS: Record<AiOutputLanguage, AiPromptConfig> = {
  pl: {
    languageName: "Polish (pl-PL)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Polish (pl-PL).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Polish.",
      "Use Polish canonical product names: Mleko, Ser, Chleb, Jabłka, Kawa, Jogurt, Masło, Jajka - NEVER English Milk/Cheese/Bread/Apples/Coffee.",
      "If the source text/image is Polish, KEEP Polish - do not translate to English.",
      "If the source is English (or mixed), TRANSLATE product names into Polish.",
      "Amount: keep digits; use Polish unit wording when present (np. \"2 szt.\", \"500 g\", \"1 l\").",
      "List title fallback when no clear theme: \"Zakupy\".",
      "Examples: \"Kup mleko\" → name Mleko. \"Kup 2 cytryny\" → Cytryna / amount \"2\". \"Kup mleko bez laktozy\" → Mleko / note bez laktozy. \"Buy milk\" → Mleko.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Mleko",
      "Chleb",
      "Jajka",
      "2 szt.",
      "500 g",
      "Zakupy",
    ],
  },
  en: {
    languageName: "English (en)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): English (en).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in English.",
      "Use English canonical product names: Milk, Cheese, Bread, Apples, Coffee.",
      "If the source is another language, TRANSLATE product names into English.",
      "List title fallback when no clear theme: \"Shopping\".",
      "Examples: \"Buy milk\" → Milk. \"Buy 2 lemons\" → Lemon / \"2\". \"Buy lactose free milk\" → Milk / note lactose free.",
    ].join("\n"),
    exampleShoppingTerms: ["Milk", "Bread", "Eggs", "2 pcs", "500 g", "Shopping"],
  },
  de: {
    languageName: "German (de-DE)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): German (de-DE).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in German.",
      "Use German canonical product names: Milch, Käse, Brot, Äpfel, Kaffee, Joghurt, Butter, Eier - NEVER English Milk/Cheese/Bread.",
      "If the source text/image is German, KEEP German - do not translate to English.",
      "If the source is another language, TRANSLATE product names into German.",
      "Amount: keep digits; use German unit wording when present (z. B. \"2 Stk.\", \"500 g\", \"1 l\").",
      "List title fallback when no clear theme: \"Einkauf\".",
      "Examples: \"Milch kaufen\" → Milch. \"2 Zitronen\" → Zitrone / \"2\". \"laktosefreie Milch\" → Milch / note laktosefrei.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Milch",
      "Brot",
      "Eier",
      "2 Stk.",
      "500 g",
      "Einkauf",
    ],
  },
  ru: {
    languageName: "Russian (ru-RU)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Russian (ru-RU).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Russian.",
      "Use Russian canonical product names: Молоко, Сыр, Хлеб, Яблоки, Кофе, Йогурт, Масло, Яйца - NEVER English Milk/Cheese/Bread.",
      "If the source text/image is Russian, KEEP Russian - do not translate to English.",
      "If the source is another language, TRANSLATE product names into Russian.",
      "Amount: keep digits; use Russian unit wording when present (напр. \"2 шт.\", \"500 г\", \"1 л\").",
      "List title fallback when no clear theme: \"Покупки\".",
      "Examples: \"Купи молоко\" → Молоко. \"2 лимона\" → Лимон / \"2\". \"молоко без лактозы\" → Молоко / note без лактозы.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Молоко",
      "Хлеб",
      "Яйца",
      "2 шт.",
      "500 г",
      "Покупки",
    ],
  },
  uk: {
    languageName: "Ukrainian (uk-UA)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Ukrainian (uk-UA).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Ukrainian.",
      "Use Ukrainian canonical product names: Молоко, Сир, Хліб, Яблука, Кава, Йогурт, Масло, Яйця - NEVER English or Russian equivalents when the output language is Ukrainian.",
      "If the source text/image is Ukrainian, KEEP Ukrainian - do not translate to Russian or English.",
      "If the source is another language, TRANSLATE product names into Ukrainian.",
      "Amount: keep digits; use Ukrainian unit wording when present (напр. \"2 шт.\", \"500 г\", \"1 л\").",
      "List title fallback when no clear theme: \"Покупки\".",
      "Examples: \"Купи молоко\" → Молоко. \"2 лимони\" → Лимон / \"2\". \"молоко без лактози\" → Молоко / note без лактози.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Молоко",
      "Хліб",
      "Яйця",
      "2 шт.",
      "500 г",
      "Покупки",
    ],
  },
  fr: {
    languageName: "French (fr-FR)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): French (fr-FR).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in French.",
      "Use French canonical product names: Lait, Fromage, Pain, Pommes, Café, Yaourt, Beurre, Œufs - NEVER English Milk/Cheese/Bread.",
      "If the source text/image is French, KEEP French - do not translate to English.",
      "If the source is another language, TRANSLATE product names into French.",
      "Amount: keep digits; use French unit wording when present (p. ex. \"2 pcs\", \"500 g\", \"1 l\").",
      "List title fallback when no clear theme: \"Courses\".",
      "Examples: \"Acheter du lait\" → Lait. \"2 citrons\" → Citron / \"2\". \"lait sans lactose\" → Lait / note sans lactose.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Lait",
      "Pain",
      "Œufs",
      "2 pcs",
      "500 g",
      "Courses",
    ],
  },
  es: {
    languageName: "Spanish (es-ES)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Spanish (es-ES).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Spanish.",
      "Use Spanish canonical product names: Leche, Queso, Pan, Manzanas, Café, Yogur, Mantequilla, Huevos - NEVER English Milk/Cheese/Bread.",
      "If the source text/image is Spanish, KEEP Spanish - do not translate to English.",
      "If the source is another language, TRANSLATE product names into Spanish.",
      "Amount: keep digits; use Spanish unit wording when present (p. ej. \"2 uds.\", \"500 g\", \"1 l\").",
      "List title fallback when no clear theme: \"Compra\".",
      "Examples: \"Comprar leche\" → Leche. \"2 limones\" → Limón / \"2\". \"leche sin lactosa\" → Leche / note sin lactosa.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Leche",
      "Pan",
      "Huevos",
      "2 uds.",
      "500 g",
      "Compra",
    ],
  },
  it: {
    languageName: "Italian (it-IT)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Italian (it-IT).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Italian.",
      "Use Italian canonical product names: Latte, Formaggio, Pane, Mele, Caffè, Yogurt, Burro, Uova - NEVER English Milk/Cheese/Bread.",
      "If the source text/image is Italian, KEEP Italian - do not translate to English.",
      "If the source is another language, TRANSLATE product names into Italian.",
      "Amount: keep digits; use Italian unit wording when present (es. \"2 pz\", \"500 g\", \"1 l\").",
      "List title fallback when no clear theme: \"Spesa\".",
      "Examples: \"Compra il latte\" → Latte. \"2 limoni\" → Limone / \"2\". \"latte senza lattosio\" → Latte / note senza lattosio.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Latte",
      "Pane",
      "Uova",
      "2 pz",
      "500 g",
      "Spesa",
    ],
  },
  cs: {
    languageName: "Czech (cs-CZ)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Czech (cs-CZ).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Czech.",
      "Use Czech canonical product names: Mléko, Sýr, Chléb, Jablka, Káva, Jogurt, Máslo, Vejce - NEVER English Milk/Cheese/Bread.",
      "If the source text/image is Czech, KEEP Czech - do not translate to English or Polish.",
      "If the source is another language, TRANSLATE product names into Czech.",
      "Amount: keep digits; use Czech unit wording when present (např. \"2 ks\", \"500 g\", \"1 l\").",
      "List title fallback when no clear theme: \"Nákup\".",
      "Examples: \"Kup mléko\" → Mléko. \"2 citrony\" → Citron / \"2\". \"mléko bez laktózy\" → Mléko / note bez laktózy.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Mléko",
      "Chléb",
      "Vejce",
      "2 ks",
      "500 g",
      "Nákup",
    ],
  },
  be: {
    languageName: "Belarusian (be-BY)",
    systemInstruction: [
      "OUTPUT LANGUAGE (mandatory, non-negotiable): Belarusian (be-BY).",
      "Every `name`, `note`, `reason`, and `shoppingContext.title` MUST be written in Belarusian.",
      "Use Belarusian canonical product names: Малако, Сыр, Хлеб, Яблыкі, Кава, Ягурт, Масла, Яйкі - NEVER Russian or English when output is Belarusian (use і/ў orthography).",
      "If the source text/image is Belarusian, KEEP Belarusian - do not translate to Russian or English.",
      "If the source is another language, TRANSLATE product names into Belarusian.",
      "Amount: keep digits; use Belarusian unit wording when present (напр. \"2 шт.\", \"500 г\", \"1 л\").",
      "List title fallback when no clear theme: \"Пакупкі\".",
      "Examples: \"Купі малако\" → Малако. \"2 лімоны\" → Лімон / \"2\". \"малако без лактозы\" → Малако / note без лактозы.",
    ].join("\n"),
    exampleShoppingTerms: [
      "Малако",
      "Хлеб",
      "Яйкі",
      "2 шт.",
      "500 г",
      "Пакупкі",
    ],
  },
};

/** Heuristic: Czech-specific letters or grocery words. */
export function looksCzech(text: string): boolean {
  // Letters unique to Czech among app locales (not PL/ES/FR).
  if (/[ěřůďťňĚŘŮĎŤŇ]/.test(text)) return true;
  return /\b(mléko|chléb|vejce|sýr|máslo|nákup|nakupní|seznam|jablka|prosím|bez\s+laktózy)\b/i.test(
    text,
  );
}

export function looksPolish(text: string): boolean {
  if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text)) return true;
  return /\b(mleko|chleb|masło|maslo|jajka|jajko|ser|woda|kup|kupić|kupic|proszę|prosze|lista|zakupy|ziemniaki|jabłka|jablka|pomidory|ogórki|ogorki|kurczak|wołowina|wolowina|ryż|ryz|makaron|kawa|herbata|jogurt|śmietana|smietana|kiełbasa|kielbasa|bez\s+laktozy)\b/i.test(
    text,
  );
}

export function looksGerman(text: string): boolean {
  if (/[äöüÄÖÜß]/.test(text)) return true;
  return /\b(milch|brot|eier|käse|kaese|butter|wasser|kaufen|einkauf|liste|apfel|äpfel|tomaten|huhn|reis|nudeln|kaffee|tee|joghurt|sahne)\b/i.test(
    text,
  );
}

export function looksUkrainian(text: string): boolean {
  // Ukrainian-specific letters (ї/є/ґ). Plain і is shared with Belarusian.
  if (/[їєґЇЄҐ]/.test(text)) return true;
  return /\b(хліб|яйця|яблука|будь\s*ласка|список\s*покупок|видалити)\b/i.test(
    text,
  );
}

export function looksBelarusian(text: string): boolean {
  // ў is unique to Belarusian among app locales.
  if (/[ўЎ]/.test(text)) return true;
  return /\b(малако|пакупкі|спіс|выдаліць|калі\s*ласка|яблыкі|тавар)\b/i.test(
    text,
  );
}

export function looksRussian(text: string): boolean {
  if (looksUkrainian(text) || looksBelarusian(text)) return false;
  if (/[а-яёА-ЯЁ]/.test(text)) return true;
  return /\b(moloko|khleb|hleb|yajca|jajca|syr|voda|kupi|spisok|pokupki|moloka)\b/i.test(
    text,
  );
}

export function looksFrench(text: string): boolean {
  if (/[àâäéèêëïîôùûüçœæÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ]/.test(text)) return true;
  return /\b(lait|pain|œufs|oeufs|fromage|beurre|acheter|courses|liste\s+de\s+courses|pommes|yaourt|café|cafe)\b/i.test(
    text,
  );
}

export function looksSpanish(text: string): boolean {
  if (/[áéíóúüñ¿¡ÁÉÍÓÚÜÑ]/.test(text)) return true;
  return /\b(leche|pan|huevos|queso|mantequilla|comprar|compra|lista\s+de\s+la\s+compra|manzanas|yogur|café|cafe)\b/i.test(
    text,
  );
}

export function looksItalian(text: string): boolean {
  // Prefer Italian-specific vowels / shopping vocabulary before FR/ES heuristics.
  if (/[ìòùÌÒÙ]/.test(text)) return true;
  return /\b(latte|pane|uova|formaggio|burro|spesa|lista\s+della\s+spesa|mele|yogurt|comprare|caffè|caffe)\b/i.test(
    text,
  );
}

export async function resolveWorkspaceOutputLanguage(
  workspaceId: string,
): Promise<AiOutputLanguage> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      settings: { select: { language: true } },
      members: {
        where: { role: "owner" },
        take: 1,
        select: { user: { select: { locale: true } } },
      },
    },
  });

  const settingsLang = workspace?.settings?.language;
  if (isAppLocale(settingsLang)) {
    return mapToAiLanguage(settingsLang);
  }

  const ownerLocale = workspace?.members[0]?.user.locale;
  return mapToAiLanguage(resolveAppLocale(ownerLocale));
}

export async function resolveListOutputLanguage(
  listId: string,
  inputText?: string | null,
): Promise<AiOutputLanguage> {
  if (inputText && looksCzech(inputText)) {
    return "cs";
  }
  if (inputText && looksPolish(inputText)) {
    return "pl";
  }
  if (inputText && looksGerman(inputText)) {
    return "de";
  }
  if (inputText && looksUkrainian(inputText)) {
    return "uk";
  }
  if (inputText && looksBelarusian(inputText)) {
    return "be";
  }
  if (inputText && looksRussian(inputText)) {
    return "ru";
  }
  if (inputText && looksItalian(inputText)) {
    return "it";
  }
  if (inputText && looksFrench(inputText)) {
    return "fr";
  }
  if (inputText && looksSpanish(inputText)) {
    return "es";
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
    select: {
      workspace: {
        select: {
          settings: { select: { language: true } },
          members: {
            where: { role: "owner" },
            take: 1,
            select: { user: { select: { locale: true } } },
          },
        },
      },
      items: {
        where: { status: { not: "removed" } },
        take: 12,
        select: { name: true },
      },
    },
  });

  const settingsLang = list?.workspace.settings?.language;
  if (isAppLocale(settingsLang)) {
    return mapToAiLanguage(settingsLang);
  }

  const sample = (list?.items ?? []).map((item) => item.name).join(" ");
  if (sample && looksCzech(sample)) {
    return "cs";
  }
  if (sample && looksPolish(sample)) {
    return "pl";
  }
  if (sample && looksGerman(sample)) {
    return "de";
  }
  if (sample && looksUkrainian(sample)) {
    return "uk";
  }
  if (sample && looksBelarusian(sample)) {
    return "be";
  }
  if (sample && looksRussian(sample)) {
    return "ru";
  }
  if (sample && looksItalian(sample)) {
    return "it";
  }
  if (sample && looksFrench(sample)) {
    return "fr";
  }
  if (sample && looksSpanish(sample)) {
    return "es";
  }

  const ownerLocale = list?.workspace.members[0]?.user.locale;
  return mapToAiLanguage(resolveAppLocale(ownerLocale));
}
