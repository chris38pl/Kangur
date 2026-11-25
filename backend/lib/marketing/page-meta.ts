import type { AppLocale } from "@/lib/marketing/locale";
import { canonicalLocale, type MarketingRouteId } from "@/lib/marketing/routes";

export type PageMeta = {
  /** Up to 60 characters, or Google cuts it. Checked by scripts/check-seo.ts. */
  title: string;
  /** 70-160 characters. */
  description: string;
};

/**
 * What Google and link previews show for every page. "Kangur" alone means a maths contest,
 * an animal and a scam in the news, so the title says what Kangur is: a grocery list.
 * Claims only from the marketing fact bank.
 */
const PAGE_META: Record<
  MarketingRouteId,
  Partial<Record<AppLocale, PageMeta>>
> = {
  home: {
    pl: {
      title: "Kangur - aplikacja do wspólnej listy zakupów z AI",
      description:
        "Kangur to aplikacja do list zakupów na iPhone’a i Androida. Zrób listę ze zdjęcia, zrzutu czatu lub przepisu. Produkty ułożą się według alejek.",
    },
    en: {
      title: "Kangur - shared grocery list app with AI",
      description:
        "Kangur is a grocery list app for iPhone and Android. Make a list from a photo, a chat screenshot or a recipe. Items line up by store aisle.",
    },
    de: {
      title: "Kangur - App für gemeinsame Einkaufslisten mit KI",
      description:
        "Kangur ist eine Einkaufslisten-App für iPhone und Android. Erstelle Listen aus Foto, Chat-Screenshot oder Rezept, sortiert nach Gängen im Markt.",
    },
    fr: {
      title: "Kangur - appli de liste de courses partagée avec l’IA",
      description:
        "Kangur est une appli de liste de courses pour iPhone et Android. Créez une liste depuis une photo, une capture de chat ou une recette, triée par rayon.",
    },
    es: {
      title: "Kangur - app de lista de la compra compartida con IA",
      description:
        "Kangur es una app de lista de la compra para iPhone y Android. Crea una lista desde una foto, una captura de chat o una receta, ordenada por pasillos.",
    },
    it: {
      title: "Kangur - app per la lista della spesa condivisa con AI",
      description:
        "Kangur è un’app per la lista della spesa su iPhone e Android. Crea la lista da una foto, uno screenshot della chat o una ricetta, divisa per reparti.",
    },
    cs: {
      title: "Kangur - aplikace na společný nákupní seznam s AI",
      description:
        "Kangur je aplikace na nákupní seznamy pro iPhone a Android. Seznam vytvoříte z fotky, snímku chatu nebo receptu a položky se seřadí podle uliček.",
    },
    ru: {
      title: "Kangur - приложение для общих списков покупок с AI",
      description:
        "Kangur - приложение для списков покупок на iPhone и Android. Список из фото, скриншота чата или рецепта, товары разложены по отделам магазина.",
    },
    uk: {
      title: "Kangur - застосунок для спільних списків покупок з AI",
      description:
        "Kangur - застосунок для списків покупок на iPhone та Android. Список із фото, скриншота чату чи рецепта, товари розкладено за відділами магазину.",
    },
    be: {
      title: "Kangur - праграма для агульных спісаў пакупак з AI",
      description:
        "Kangur - праграма для спісаў пакупак на iPhone і Android. Спіс з фота, скрыншота чата або рэцэпта, тавары раскладзены па аддзелах крамы.",
    },
  },
  pricing: {
    pl: {
      title: "Kangur - cennik. Ile kosztuje Premium i co jest za darmo",
      description:
        "Listy zakupów, domownicy i tryb zakupów w Kangurze są darmowe. Premium kosztuje 9,99 zł miesięcznie za cały dom, pierwszy miesiąc za darmo.",
    },
    en: {
      title: "Kangur pricing - what is free and what Premium adds",
      description:
        "Grocery lists, your household and shopping mode are free in Kangur. Premium adds unlimited AI and a longer history for the whole home.",
    },
  },
  safety: {
    pl: {
      title: "Czy aplikacja Kangur jest bezpieczna? Fakty i zgody",
      description:
        "Kangur to lista zakupów z Google Play i App Store. Kto go tworzy, o jakie zgody prosi, czego nie robi i jak sprawdzić, że to na pewno my.",
    },
    en: {
      title: "Is the Kangur app safe? Facts and permissions",
      description:
        "Kangur is a grocery list from Google Play and the App Store. Who makes it, which permissions it asks for, what it never does and how to check it is us.",
    },
  },
  about: {
    pl: {
      title: "O Kangurze - kto robi tę listę zakupów i po co",
      description:
        "Kangur powstał w Poznaniu, bo lista zakupów mieszkała w czacie. Kto go robi, jak powstawał, pod jakimi nazwami jest w sklepach i z czym go nie mylić.",
    },
    en: {
      title: "About Kangur - who makes this grocery list and why",
      description:
        "Kangur comes from Poznań, Poland, because the shopping list lived in a chat. Who makes it, how it grew, its names in the stores and what it is not.",
    },
  },
  press: {
    pl: {
      title: "Kangur dla mediów - fakty, grafiki i kontakt",
      description:
        "Opis Kangura w jednym i trzech zdaniach, sprawdzone fakty, logo i zrzuty ekranu do pobrania, pomysły na tekst i bezpośredni kontakt do twórcy.",
    },
  },
  faq: {
    pl: {
      title: "Pytania i odpowiedzi o aplikacji Kangur",
      description:
        "Jak zrobić listę ze zrzutu czatu, zaprosić domownika, co daje Premium i co działa przy słabym zasięgu. Odpowiedzi o liście zakupów Kangur.",
    },
    en: {
      title: "Questions and answers about the Kangur app",
      description:
        "How to make a list from a chat screenshot, invite your household, what Premium adds and what works on a weak signal. Answers about the Kangur grocery list.",
    },
  },
  sharedList: {
    pl: {
      title: "Wspólna lista zakupów dla pary i rodziny - Kangur",
      description:
        "Jedna lista zakupów na iPhone’a i Androida, dla całego domu. Zapraszasz e-mailem, każdy dopisuje u siebie, a w sklepie widać, co już w koszyku.",
    },
  },
  photoList: {
    pl: {
      title: "Lista zakupów ze zdjęcia i zrzutu ekranu - Kangur",
      description:
        "Zrzut czatu albo zdjęcie kartki zamienia się w listę zakupów ułożoną według alejek. Zobacz na przykładzie, co AI robi z siedmiu wiadomości.",
    },
  },
  recipeList: {
    pl: {
      title: "Lista zakupów z przepisu - aplikacja Kangur",
      description:
        "Wpisz do pięciu dań, a dostaniesz składniki na jednej liście zakupów. Co się powtarza, jest raz. Odznaczasz to, co masz w domu.",
    },
  },
  aiList: {
    pl: {
      title: "Lista zakupów z AI: co AI umie, a czego nie - Kangur",
      description:
        "AI w Kangurze robi listę zakupów z czatu, kartki albo nazwy dania. Nie wymyśla ilości i nie doradza. Zobacz zasady, błędy i cenę.",
    },
  },
  aisleTool: {
    pl: {
      title: "Lista zakupów z podziałem na kategorie - narzędzie",
      description:
        "Wklej listę zakupów, a narzędzie podzieli ją na 24 alejki sklepu. Za darmo, bez konta, w przeglądarce. Kolejność ustawisz, listę wydrukujesz.",
    },
  },
  guides: {
    pl: {
      title: "Poradniki o listach zakupów - Kangur",
      description:
        "Krótkie poradniki z narzędziami: lista zakupów na Wigilię i święta przeliczona na gości, lista na tydzień i kartki do druku.",
    },
  },
  guideChristmas: {
    pl: {
      title: "Lista zakupów na Wigilię i święta 2026 + kalkulator",
      description:
        "Policz zakupy na Wigilię: dwanaście dań, liczba gości, kto co przynosi i co kupić wcześniej. Sklepy zamknięte od 24 do 27 grudnia.",
    },
  },
  guideWeek: {
    pl: {
      title: "Lista zakupów na tydzień: dla 1, 2 osób i rodziny",
      description:
        "Gotowa lista zakupów na tydzień z ilościami dla jednej osoby, dwóch i rodziny. Duże zakupy, mała dokupka w środku tygodnia i druk.",
    },
  },
  guidePrint: {
    pl: {
      title: "Lista zakupów do druku (PDF, A4) - 4 darmowe wzory",
      description:
        "Cztery listy zakupów do druku w PDF: z alejkami, z gotowymi produktami, na tydzień z obiadami i na Wigilię. Za darmo, bez maila.",
    },
  },
  contact: {
    pl: {
      title: "Kontakt - Kangur, lista zakupów z AI",
      description:
        "Masz pytanie, pomysł albo kłopot z listą zakupów? Napisz do nas, zwykle odpowiadamy w ciągu 24-48 godzin.",
    },
    en: {
      title: "Contact - Kangur, grocery list with AI",
      description:
        "A question, an idea or a problem with your grocery list? Write to us, we usually reply within 24-48 hours.",
    },
    de: {
      title: "Kontakt - Kangur, Einkaufsliste mit KI",
      description:
        "Eine Frage, eine Idee oder ein Problem mit der Einkaufsliste? Schreib uns, meist antworten wir innerhalb von 24-48 Stunden.",
    },
    fr: {
      title: "Contact - Kangur, liste de courses avec l’IA",
      description:
        "Une question, une idée ou un souci avec votre liste de courses ? Écrivez-nous, nous répondons en général sous 24 à 48 heures.",
    },
    es: {
      title: "Contacto - Kangur, lista de la compra con IA",
      description:
        "¿Una pregunta, una idea o un problema con tu lista de la compra? Escríbenos, solemos responder en 24-48 horas.",
    },
    it: {
      title: "Contatti - Kangur, lista della spesa con AI",
      description:
        "Una domanda, un’idea o un problema con la lista della spesa? Scrivici, di solito rispondiamo entro 24-48 ore.",
    },
    cs: {
      title: "Kontakt - Kangur, nákupní seznam s AI",
      description:
        "Máš otázku, nápad nebo problém s nákupním seznamem? Napiš nám, obvykle odpovídáme do 24-48 hodin.",
    },
    ru: {
      title: "Контакты - Kangur, список покупок с AI",
      description:
        "Вопрос, идея или проблема со списком покупок? Напишите нам, обычно мы отвечаем в течение 24-48 часов.",
    },
    uk: {
      title: "Контакти - Kangur, список покупок з AI",
      description:
        "Питання, ідея або проблема зі списком покупок? Напишіть нам, зазвичай ми відповідаємо протягом 24-48 годин.",
    },
    be: {
      title: "Кантакты - Kangur, спіс пакупак з AI",
      description:
        "Пытанне, ідэя або праблема са спісам пакупак? Напішыце нам, звычайна мы адказваем на працягу 24-48 гадзін.",
    },
  },
  privacy: {
    pl: {
      title: "Polityka prywatności aplikacji Kangur",
      description:
        "Polityka prywatności aplikacji Kangur - jakie dane zbieramy, w jakim celu i jakie masz prawa.",
    },
    en: {
      title: "Privacy Policy of the Kangur app",
      description:
        "Privacy policy of Kangur, the grocery list app: what data we collect, why we need it and what your rights are.",
    },
  },
  terms: {
    pl: {
      title: "Regulamin aplikacji Kangur",
      description:
        "Regulamin korzystania z aplikacji Kangur - zasady usługi, konta, Premium i odpowiedzialność.",
    },
    en: {
      title: "Terms of Use of the Kangur app",
      description:
        "Terms for using Kangur, the grocery list app: service rules, accounts, Premium and liability.",
    },
  },
  deleteAccount: {
    pl: {
      title: "Jak usunąć konto w aplikacji Kangur",
      description:
        "Usuń konto Kangur w aplikacji, krok po kroku. Co znika razem z kontem, a co może zostać, na przykład historia płatności w sklepie.",
    },
    en: {
      title: "How to delete your Kangur account",
      description:
        "Delete your Kangur account in the app, step by step. What goes with the account and what may remain, such as payment history in the store.",
    },
  },
};

/** Languages without their own text describe the page they canonicalise to. */
export function pageMeta(id: MarketingRouteId, locale: AppLocale): PageMeta {
  const meta = PAGE_META[id][locale] ?? PAGE_META[id][canonicalLocale(id, locale)];
  if (!meta) throw new Error(`No title and description for "${id}" in "${locale}"`);
  return meta;
}
