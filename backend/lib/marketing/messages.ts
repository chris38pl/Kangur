import type { AppLocale } from "@shared/locales";

export type MarketingMessages = {
  nav: {
    faq: string;
    privacy: string;
    terms: string;
    contact: string;
    download: string;
    mainAria: string;
    footerAria: string;
    languageAria: string;
    deleteAccount: string;
    how: string;
    pricing: string;
    safety: string;
    about: string;
    tools: string;
    press: string;
    menu: string;
    skip: string;
    breadcrumbAria: string;
    lists: string;
    legal: string;
    languages: string;
    follow: string;
    copyright: string;
    rightsReserved: string;
  };
};

const en: MarketingMessages = {
  nav: {
    faq: "FAQ",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    contact: "Contact",
    download: "Get the app",
    mainAria: "Main",
    footerAria: "Footer",
    languageAria: "Language",
    deleteAccount: "Delete account",
    how: "How it works",
    pricing: "Pricing",
    safety: "Safety",
    about: "About Kangur",
    tools: "Tools",
    press: "Press",
    menu: "Menu",
    skip: "Skip to content",
    breadcrumbAria: "You are here",
    lists: "Grocery lists",
    legal: "Legal",
    languages: "Languages",
    follow: "Follow Kangur",
    copyright: "© 2026 Kangur",
    rightsReserved: "All rights reserved",
  },
};

const pl: MarketingMessages = {
  nav: {
    faq: "FAQ",
    privacy: "Polityka prywatności",
    terms: "Regulamin",
    contact: "Kontakt",
    download: "Pobierz aplikację",
    mainAria: "Menu główne",
    footerAria: "Stopka",
    languageAria: "Język",
    deleteAccount: "Usunięcie konta",
    how: "Jak to działa",
    pricing: "Cennik",
    safety: "Bezpieczeństwo",
    about: "O Kangurze",
    tools: "Narzędzia",
    press: "Dla mediów",
    menu: "Menu",
    skip: "Przejdź do treści",
    breadcrumbAria: "Gdzie jesteś",
    lists: "Listy zakupów",
    legal: "Zasady",
    languages: "Języki",
    follow: "Kangur w sieci",
    copyright: "© 2026 Kangur",
    rightsReserved: "Wszelkie prawa zastrzeżone",
  },
};

const de: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    contact: "Kontakt",
    download: "App holen",
    mainAria: "Hauptnavigation",
    footerAria: "Fußzeile",
    languageAria: "Sprache",
    deleteAccount: "Konto löschen",
    how: "So geht’s",
    pricing: "Preise",
    safety: "Sicherheit",
    about: "Über Kangur",
    tools: "Werkzeuge",
    press: "Presse",
    menu: "Menü",
    skip: "Zum Inhalt springen",
    breadcrumbAria: "Du bist hier",
    lists: "Einkaufslisten",
    legal: "Rechtliches",
    languages: "Sprachen",
    follow: "Kangur folgen",
    copyright: "© 2026 Kangur",
    rightsReserved: "Alle Rechte vorbehalten",
  },
};

const fr: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Confidentialité",
    terms: "Conditions",
    contact: "Contact",
    download: "Télécharger",
    mainAria: "Principal",
    footerAria: "Pied de page",
    languageAria: "Langue",
    deleteAccount: "Supprimer le compte",
    how: "Comment ça marche",
    pricing: "Tarifs",
    safety: "Sécurité",
    about: "À propos",
    tools: "Outils",
    press: "Presse",
    menu: "Menu",
    skip: "Aller au contenu",
    breadcrumbAria: "Vous êtes ici",
    lists: "Listes de courses",
    legal: "Mentions légales",
    languages: "Langues",
    follow: "Suivre Kangur",
    copyright: "© 2026 Kangur",
    rightsReserved: "Tous droits réservés",
  },
};

const es: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
    download: "Descargar app",
    mainAria: "Principal",
    footerAria: "Pie de página",
    languageAria: "Idioma",
    deleteAccount: "Eliminar cuenta",
    how: "Cómo funciona",
    pricing: "Precios",
    safety: "Seguridad",
    about: "Sobre Kangur",
    tools: "Herramientas",
    press: "Prensa",
    menu: "Menú",
    skip: "Ir al contenido",
    breadcrumbAria: "Estás aquí",
    lists: "Listas de la compra",
    legal: "Legal",
    languages: "Idiomas",
    follow: "Sigue a Kangur",
    copyright: "© 2026 Kangur",
    rightsReserved: "Todos los derechos reservados",
  },
};

const it: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Privacy",
    terms: "Termini",
    contact: "Contatti",
    download: "Scarica l’app",
    mainAria: "Principale",
    footerAria: "Piè di pagina",
    languageAria: "Lingua",
    deleteAccount: "Elimina account",
    how: "Come funziona",
    pricing: "Prezzi",
    safety: "Sicurezza",
    about: "Chi siamo",
    tools: "Strumenti",
    press: "Stampa",
    menu: "Menu",
    skip: "Vai al contenuto",
    breadcrumbAria: "Sei qui",
    lists: "Liste della spesa",
    legal: "Note legali",
    languages: "Lingue",
    follow: "Segui Kangur",
    copyright: "© 2026 Kangur",
    rightsReserved: "Tutti i diritti riservati",
  },
};

const cs: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Soukromí",
    terms: "Podmínky",
    contact: "Kontakt",
    download: "Stáhnout aplikaci",
    mainAria: "Hlavní",
    footerAria: "Zápatí",
    languageAria: "Jazyk",
    deleteAccount: "Smazat účet",
    how: "Jak to funguje",
    pricing: "Ceník",
    safety: "Bezpečnost",
    about: "O Kangurovi",
    tools: "Nástroje",
    press: "Pro média",
    menu: "Menu",
    skip: "Přejít na obsah",
    breadcrumbAria: "Jsi tady",
    lists: "Nákupní seznamy",
    legal: "Právní informace",
    languages: "Jazyky",
    follow: "Sleduj Kangura",
    copyright: "© 2026 Kangur",
    rightsReserved: "Všechna práva vyhrazena",
  },
};

const ru: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Конфиденциальность",
    terms: "Условия",
    contact: "Контакты",
    download: "Скачать приложение",
    mainAria: "Основная",
    footerAria: "Подвал",
    languageAria: "Язык",
    deleteAccount: "Удалить аккаунт",
    how: "Как это работает",
    pricing: "Цены",
    safety: "Безопасность",
    about: "О Kangur",
    tools: "Инструменты",
    press: "Для прессы",
    menu: "Меню",
    skip: "Перейти к содержанию",
    breadcrumbAria: "Вы здесь",
    lists: "Списки покупок",
    legal: "Правила",
    languages: "Языки",
    follow: "Kangur в сети",
    copyright: "© 2026 Kangur",
    rightsReserved: "Все права защищены",
  },
};

const uk: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Конфіденційність",
    terms: "Умови",
    contact: "Контакти",
    download: "Завантажити",
    mainAria: "Головна",
    footerAria: "Підвал",
    languageAria: "Мова",
    deleteAccount: "Видалити обліковий запис",
    how: "Як це працює",
    pricing: "Ціни",
    safety: "Безпека",
    about: "Про Kangur",
    tools: "Інструменти",
    press: "Для преси",
    menu: "Меню",
    skip: "Перейти до вмісту",
    breadcrumbAria: "Ви тут",
    lists: "Списки покупок",
    legal: "Правила",
    languages: "Мови",
    follow: "Kangur у мережі",
    copyright: "© 2026 Kangur",
    rightsReserved: "Усі права захищено",
  },
};

const be: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Прыватнасць",
    terms: "Умовы",
    contact: "Кантакты",
    download: "Спампаваць",
    mainAria: "Галоўная",
    footerAria: "Падвал",
    languageAria: "Мова",
    deleteAccount: "Выдаліць уліковы запіс",
    how: "Як гэта працуе",
    pricing: "Цэны",
    safety: "Бяспека",
    about: "Пра Kangur",
    tools: "Інструменты",
    press: "Для прэсы",
    menu: "Меню",
    skip: "Перайсці да зместу",
    breadcrumbAria: "Вы тут",
    lists: "Спісы пакупак",
    legal: "Правілы",
    languages: "Мовы",
    follow: "Kangur у сетцы",
    copyright: "© 2026 Kangur",
    rightsReserved: "Усе правы абаронены",
  },
};

export const marketingMessages: Record<AppLocale, MarketingMessages> = {
  en,
  pl,
  de,
  fr,
  es,
  it,
  cs,
  ru,
  uk,
  be,
};

export function getMessages(locale: AppLocale): MarketingMessages {
  return marketingMessages[locale] ?? marketingMessages.en;
}
