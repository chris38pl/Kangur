import { prisma } from "@/lib/prisma";
import { isAppLocale, type AppLocale } from "@/lib/locale";

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
  /** Short good list-title examples for shoppingContext.title. */
  titleExamples: string[];
  /** Bad list-title examples (too long / product dumps / meta). */
  titleAntiExamples: string[];
};

/** Shared across all AI prompts — brands, regional names, natural local terms. */
export const AI_NAMING_RULES = [
  "NAMING RULES (mandatory):",
  "1. Brands / proper nouns: keep as sold (Coca-Cola, Nutella, Kinder Bueno, Philadelphia). Do not translate brand names.",
  "2. Regional specialty products: keep the culinary/shoppable name locals use (e.g. Guanciale), not descriptive paraphrases like \"Italian bacon\". Prefer a common supermarket substitute only when that specialty is not a shoppable SKU in the output market; if you keep the specialty name, do not invent English descriptive paraphrases.",
  "3. Natural local consumer terms: use the most natural name local consumers use, not a word-for-word translation (e.g. PL \"Cukier puder\" ↔ EN \"Powdered sugar\", never \"Sugar powder\").",
].join("\n");

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
    titleExamples: [
      "Na grilla",
      "Na weekend",
      "Do łazienki",
      "Dla kota",
      "Meal prep",
      "Warzywa",
      "Chemia domowa",
      "Zakupy",
    ],
    titleAntiExamples: [
      "Zakupy na weekend dla rodziny",
      "Kup rzeczy do łazienki",
      "Produkty na grilla",
      "Mleko jajka i chleb",
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
      "Examples: \"Buy milk\" → Milk. \"Buy 2 lemons\" → Lemon / \"2\". \"Buy lactose free milk\" → Milk / note lactose free. \"Kup mleko\" → Milk.",
    ].join("\n"),
    exampleShoppingTerms: ["Milk", "Bread", "Eggs", "2 pcs", "500 g", "Shopping"],
    titleExamples: [
      "BBQ",
      "Weekend",
      "Bathroom",
      "For the cat",
      "Meal prep",
      "Vegetables",
      "Household",
      "Shopping",
    ],
    titleAntiExamples: [
      "Shopping for the weekend for the family",
      "Buy bathroom stuff",
      "Products for grilling",
      "Milk eggs and bread",
    ],
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
    titleExamples: [
      "Zum Grillen",
      "Wochenende",
      "Bad",
      "Für die Katze",
      "Meal prep",
      "Gemüse",
      "Haushalt",
      "Einkauf",
    ],
    titleAntiExamples: [
      "Einkauf fürs Wochenende für die Familie",
      "Dinge fürs Bad kaufen",
      "Grillprodukte",
      "Milch Eier und Brot",
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
    titleExamples: [
      "На гриль",
      "На выходные",
      "В ванную",
      "Для кота",
      "Meal prep",
      "Овощи",
      "Бытовая химия",
      "Покупки",
    ],
    titleAntiExamples: [
      "Покупки на выходные для семьи",
      "Купить вещи в ванную",
      "Продукты на гриль",
      "Молоко яйца и хлеб",
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
    titleExamples: [
      "На гриль",
      "На вихідні",
      "У ванну",
      "Для кота",
      "Meal prep",
      "Овочі",
      "Побутова хімія",
      "Покупки",
    ],
    titleAntiExamples: [
      "Покупки на вихідні для сім'ї",
      "Купити речі у ванну",
      "Продукти на гриль",
      "Молоко яйця і хліб",
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
    titleExamples: [
      "Barbecue",
      "Week-end",
      "Salle de bain",
      "Pour le chat",
      "Meal prep",
      "Légumes",
      "Entretien",
      "Courses",
    ],
    titleAntiExamples: [
      "Courses du week-end pour la famille",
      "Acheter des trucs pour la salle de bain",
      "Produits pour le barbecue",
      "Lait œufs et pain",
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
    titleExamples: [
      "Barbacoa",
      "Fin de semana",
      "Baño",
      "Para el gato",
      "Meal prep",
      "Verduras",
      "Limpieza",
      "Compra",
    ],
    titleAntiExamples: [
      "Compra del fin de semana para la familia",
      "Comprar cosas para el baño",
      "Productos para la barbacoa",
      "Leche huevos y pan",
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
    titleExamples: [
      "Barbecue",
      "Weekend",
      "Bagno",
      "Per il gatto",
      "Meal prep",
      "Verdure",
      "Pulizia",
      "Spesa",
    ],
    titleAntiExamples: [
      "Spesa del weekend per la famiglia",
      "Compra cose per il bagno",
      "Prodotti per il barbecue",
      "Latte uova e pane",
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
    titleExamples: [
      "Na gril",
      "Na víkend",
      "Do koupelny",
      "Pro kočku",
      "Meal prep",
      "Zelenina",
      "Domácnost",
      "Nákup",
    ],
    titleAntiExamples: [
      "Nákup na víkend pro rodinu",
      "Koupit věci do koupelny",
      "Produkty na gril",
      "Mléko vejce a chléb",
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
    titleExamples: [
      "На грыль",
      "На выхадныя",
      "У ванную",
      "Для ката",
      "Meal prep",
      "Агародніна",
      "Бытавая хімія",
      "Пакупкі",
    ],
    titleAntiExamples: [
      "Пакупкі на выхадныя для сям'і",
      "Купіць рэчы ў ванную",
      "Прадукты на грыль",
      "Малако яйкі і хлеб",
    ],
  },
};

/**
 * Pure policy: actor UI locale → owner locale → EN.
 * Does not use WorkspaceSettings.language or input-language heuristics.
 */
export function pickAiLanguageFromLocales(
  actorLocale: string | null | undefined,
  ownerLocale: string | null | undefined,
): AiOutputLanguage {
  if (isAppLocale(actorLocale)) {
    return mapToAiLanguage(actorLocale);
  }
  if (isAppLocale(ownerLocale)) {
    return mapToAiLanguage(ownerLocale);
  }
  return "en";
}

export async function resolveOutputLanguageForActor(input: {
  actorUserId: string;
  workspaceId: string;
}): Promise<AiOutputLanguage> {
  const [actor, workspace] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.actorUserId },
      select: { locale: true },
    }),
    prisma.workspace.findUnique({
      where: { id: input.workspaceId },
      select: {
        members: {
          where: { role: "owner" },
          take: 1,
          select: { user: { select: { locale: true } } },
        },
      },
    }),
  ]);

  return pickAiLanguageFromLocales(
    actor?.locale,
    workspace?.members[0]?.user.locale,
  );
}

export async function resolveWorkspaceOutputLanguage(
  workspaceId: string,
  actorUserId: string,
): Promise<AiOutputLanguage> {
  return resolveOutputLanguageForActor({ actorUserId, workspaceId });
}

export async function resolveListOutputLanguage(
  listId: string,
  actorUserId: string,
): Promise<AiOutputLanguage> {
  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
    select: { workspaceId: true },
  });
  if (!list) {
    return "en";
  }
  return resolveOutputLanguageForActor({
    actorUserId,
    workspaceId: list.workspaceId,
  });
}
