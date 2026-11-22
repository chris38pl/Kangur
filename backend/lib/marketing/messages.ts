import type { AppLocale } from "@shared/locales";

export type MarketingMessages = {
  meta: {
    homeTitle: string;
    homeDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    termsTitle: string;
    termsDescription: string;
    contactTitle: string;
    contactDescription: string;
    deleteTitle: string;
    deleteDescription: string;
    faqTitle: string;
    faqDescription: string;
  };
  nav: {
    features: string;
    faq: string;
    privacy: string;
    terms: string;
    contact: string;
    download: string;
    mainAria: string;
    footerAria: string;
    languageAria: string;
    deleteAccount: string;
    copyright: string;
    rightsReserved: string;
  };
  home: {
    badge: string;
    headlineBefore: string;
    headlineAccent: string;
    lead: string;
    features: [string, string, string, string];
    playSmall: string;
    iosSmall: string;
    /** Under the store buttons. Claims only from the marketing fact bank. */
    storesNote: string;
    heroAlt: string;
    highlightsAria: string;
    highlights: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  contact: {
    title: string;
    intro: string;
    emailLabel: string;
    responseTitle: string;
    responseBody: string;
    helpTitle: string;
    helpBody: string;
    mascotAlt: string;
  };
  faq: {
    title: string;
    meta: string;
    metaEnNote: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
    mascotAlt: string;
  };
  deleteAccount: {
    title: string;
    meta: string;
    intro: string;
    howHeading: string;
    howPath: string;
    howConfirm: string;
    effectsHeading: string;
    effectsBody: string;
    removeHeading: string;
    removeItems: [string, string, string, string, string, string];
    keepHeading: string;
    keepItems: [string, string, string, string];
    accessHeading: string;
    accessBody: string;
    morePrivacy: string;
  };
  notFound: {
    title: string;
    body: string;
    back: string;
  };
};

const en: MarketingMessages = {
  meta: {
    homeTitle: "Kangur - Shared grocery lists with AI",
    homeDescription:
      "Create lists from a photo, text, a recipe or past shopping. Shop aisle by aisle and share your lists with your household.",
    privacyTitle: "Privacy Policy | Kangur",
    privacyDescription:
      "Kangur privacy policy - what data we collect, why, and your rights.",
    termsTitle: "Terms of Use | Kangur",
    termsDescription:
      "Terms for using Kangur - service rules, accounts, Premium, and liability.",
    contactTitle: "Contact | Kangur",
    contactDescription:
      "Questions, suggestions, or need help? Contact the Kangur team - we usually reply within 24-48 hours.",
    deleteTitle: "Delete Account | Kangur",
    deleteDescription:
      "How to delete your Kangur account in the app and what data is removed.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Answers to common questions about Kangur - workspaces, AI Credits, Premium, and shared shopping.",
  },
  nav: {
    features: "Features",
    faq: "FAQ",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    contact: "Contact",
    download: "Get the app",
    mainAria: "Main",
    footerAria: "Footer",
    languageAria: "Language",
    deleteAccount: "Delete account",
    copyright: "© 2026 Kangur",
    rightsReserved: "All rights reserved",
  },
  home: {
    badge: "✨ Your smart shopping assistant",
    headlineBefore: "Remember together.",
    headlineAccent: "Don’t forget what matters.",
    lead: "Kangur is a shared shopping list for your whole household. Create a list the way that suits you, shop aisle by aisle, and everyone at home sees every change.",
    features: [
      "Lists from a photo, screenshot or recipe",
      "Items sorted by store aisle",
      "Shared lists with your household",
      "Shop aisle by aisle, then get a summary",
    ],
    playSmall: "GET IT ON",
    iosSmall: "DOWNLOAD ON THE",
    storesNote: "For iPhone and Android. Start with 10 free AI uses.",
    heroAlt: "Kangur - the app and mascot with a shopping bag",
    highlightsAria: "Features",
    highlights: [
      { title: "Built for families", body: "Everyone in one place." },
      { title: "Private and secure", body: "Your data stays yours." },
      { title: "Everyday ready", body: "Simple, fast, reliable." },
    ],
  },
  contact: {
    title: "Contact",
    intro:
      "Have a question, suggestion, or need help? Write to us - we’ll reply as soon as we can.",
    emailLabel: "E-mail",
    responseTitle: "Response time",
    responseBody: "We usually reply within 24-48 hours.",
    helpTitle: "We’re here to help",
    helpBody: "Write to us about anything - we’re here for you!",
    mascotAlt: "Kangur mascot with a phone",
  },
  faq: {
    title: "FAQ",
    meta: "Frequently asked questions",
    metaEnNote: "Frequently asked questions · English",
    ctaTitle: "Didn’t find an answer?",
    ctaBody: "Our support team is ready to help you.",
    ctaButton: "Contact us",
    mascotAlt: "Kangur support mascot with a headset",
  },
  deleteAccount: {
    title: "Delete account",
    meta: "Delete your Kangur account",
    intro:
      "If you have access to your account, you can delete it yourself - contacting support is not required.",
    howHeading: "How to delete your account",
    howPath: "Profile → Privacy & security → Delete account",
    howConfirm:
      "Then confirm the action by following the instructions shown in the app.",
    effectsHeading: "What happens after deletion",
    effectsBody:
      "Account deletion is permanent and cannot be undone. If you want to use Kangur again later, you will need to create a new account.",
    removeHeading: "What is deleted",
    removeItems: [
      "your user account,",
      "profile data in Kangur,",
      "shopping lists and their contents linked to your account (per Workspace rules - if other members still need the content, we remove your Workspace membership and leave data belonging to remaining members),",
      "settings and list history tied to your account,",
      "push notification tokens linked to the account,",
      "Premium subscription data stored by Kangur.",
    ],
    keepHeading: "What may remain",
    keepItems: [
      "backups and technical logs - until rotation, usually for a limited period,",
      "data we must keep for legal or accounting reasons,",
      "payment history held by Stripe, Google Play, or the App Store under those services’ rules,",
      "workspace content that still belongs to other members.",
    ],
    accessHeading: "If you cannot access your account",
    accessBody:
      "If you no longer have access to your account and cannot delete it in the app, contact us at support@getkangur.com.",
    morePrivacy: "More about data processing:",
  },
  notFound: {
    title: "Page not found",
    body: "This page doesn’t exist or has moved.",
    back: "Back to home",
  },
};

const pl: MarketingMessages = {
  meta: {
    homeTitle: "Kangur - Wspólne listy zakupów z AI",
    homeDescription:
      "Twórz listy ze zdjęcia, tekstu, przepisu albo poprzednich zakupów. Rób zakupy alejka po alejce i dziel listy z domownikami.",
    privacyTitle: "Polityka prywatności | Kangur",
    privacyDescription:
      "Polityka prywatności aplikacji Kangur - jakie dane zbieramy, w jakim celu i jakie masz prawa.",
    termsTitle: "Regulamin | Kangur",
    termsDescription:
      "Regulamin korzystania z aplikacji Kangur - zasady usługi, konta, Premium i odpowiedzialność.",
    contactTitle: "Kontakt | Kangur",
    contactDescription:
      "Masz pytanie, sugestię lub potrzebujesz pomocy? Napisz do zespołu Kangur - zwykle odpowiadamy w ciągu 24-48 godzin.",
    deleteTitle: "Usunięcie konta | Kangur",
    deleteDescription:
      "Jak usunąć konto Kangur w aplikacji i jakie dane są usuwane.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Najczęstsze pytania o Kangura - Workspace, AI Credits, Premium i wspólne zakupy.",
  },
  nav: {
    features: "Funkcje",
    faq: "FAQ",
    privacy: "Polityka prywatności",
    terms: "Regulamin",
    contact: "Kontakt",
    download: "Pobierz aplikację",
    mainAria: "Główne",
    footerAria: "Stopka",
    languageAria: "Język",
    deleteAccount: "Usunięcie konta",
    copyright: "© 2026 Kangur",
    rightsReserved: "Wszelkie prawa zastrzeżone",
  },
  home: {
    badge: "✨ Twój inteligentny asystent zakupów",
    headlineBefore: "Pamiętaj razem.",
    headlineAccent: "Nie zapominaj o tym, co ważne.",
    lead: "Kangur to wspólna lista zakupów dla całego domu. Tworzysz listę tak, jak Ci wygodnie, robisz zakupy alejka po alejce, a domownicy widzą wszystkie zmiany.",
    features: [
      "Lista ze zdjęcia, zrzutu ekranu albo przepisu",
      "Produkty ułożone według alejek w sklepie",
      "Wspólne listy z domownikami",
      "Zakupy alejka po alejce i podsumowanie",
    ],
    playSmall: "POBIERZ Z",
    iosSmall: "POBIERZ W",
    storesNote: "Na iPhone’a i Androida. Na start 10 darmowych użyć AI.",
    heroAlt: "Kangur - aplikacja i maskotka z torbą zakupów",
    highlightsAria: "Funkcje",
    highlights: [
      { title: "Stworzone dla rodzin", body: "Wszyscy w jednym miejscu." },
      { title: "Prywatne i bezpieczne", body: "Twoje dane są tylko Twoje." },
      { title: "Na co dzień", body: "Proste, szybkie, niezawodne." },
    ],
  },
  contact: {
    title: "Kontakt",
    intro:
      "Masz pytanie, sugestię lub potrzebujesz pomocy? Napisz do nas - odpowiemy najszybciej, jak to możliwe.",
    emailLabel: "E-mail",
    responseTitle: "Czas odpowiedzi",
    responseBody: "Zwykle odpowiadamy w ciągu 24-48 godzin.",
    helpTitle: "Jesteśmy tu, aby pomóc",
    helpBody: "Napisz do nas w każdej sprawie - jesteśmy dla Ciebie!",
    mascotAlt: "Maskotka Kangur z telefonem",
  },
  faq: {
    title: "FAQ",
    meta: "Najczęściej zadawane pytania",
    metaEnNote: "Najczęściej zadawane pytania · English",
    ctaTitle: "Nie znalazłeś odpowiedzi?",
    ctaBody: "Nasz zespół pomocy jest gotowy, aby Ci pomóc.",
    ctaButton: "Skontaktuj się z nami",
    mascotAlt: "Maskotka Kangur z headsetem supportu",
  },
  deleteAccount: {
    title: "Usunięcie konta",
    meta: "Usuń konto Kangur",
    intro:
      "Jeżeli masz dostęp do swojego konta, możesz usunąć je samodzielnie - kontakt z supportem nie jest wymagany.",
    howHeading: "Jak usunąć konto",
    howPath: "Profil → Prywatność i bezpieczeństwo → Usuń konto",
    howConfirm:
      "Następnie potwierdź operację zgodnie z instrukcjami wyświetlanymi w aplikacji.",
    effectsHeading: "Skutki usunięcia",
    effectsBody:
      "Usunięcie konta jest trwałe i nieodwracalne. Jeśli później zechcesz wrócić do Kangura, konieczne będzie założenie nowego konta.",
    removeHeading: "Co zostanie usunięte",
    removeItems: [
      "konto użytkownika,",
      "dane profilu w Kangurze,",
      "listy zakupów i ich zawartość powiązane z Twoim kontem (zgodnie z zasadami Workspace - jeśli treści potrzebują inni członkowie, usuwamy Twoje członkostwo w Workspace, pozostawiając dane należące do pozostałych członków),",
      "ustawienia oraz historię list powiązaną z kontem,",
      "tokeny powiadomień push powiązane z kontem,",
      "dane dotyczące subskrypcji Premium przechowywane przez Kangura.",
    ],
    keepHeading: "Co może pozostać",
    keepItems: [
      "kopie zapasowe i logi techniczne - do czasu rotacji, zwykle przez ograniczony okres,",
      "dane, które musimy zachować z powodów prawnych lub rozliczeniowych,",
      "historia płatności przechowywana przez Stripe, Google Play lub App Store zgodnie z zasadami tych usług,",
      "treści Workspace należące do innych członków.",
    ],
    accessHeading: "Problemy z dostępem do konta",
    accessBody:
      "Jeżeli nie masz dostępu do swojego konta i nie możesz usunąć go z poziomu aplikacji, skontaktuj się z nami pod adresem support@getkangur.com.",
    morePrivacy: "Więcej o przetwarzaniu danych:",
  },
  notFound: {
    title: "Nie znaleziono strony",
    body: "Ta strona nie istnieje albo została przeniesiona.",
    back: "Wróć na stronę główną",
  },
};

const de: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Geteilte Einkaufslisten mit AI",
    homeDescription:
      "Erstelle Listen aus Foto, Text, Rezept oder früheren Einkäufen. Kaufe Gang für Gang ein und teile Listen mit deinem Haushalt.",
    privacyTitle: "Datenschutz | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Nutzungsbedingungen | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Kontakt | Kangur",
    contactDescription:
      "Schreib dem Kangur-Team - Support, Datenschutz und Kontofragen.",
    deleteTitle: "Konto löschen | Kangur",
    deleteDescription:
      "So löschst du dein Kangur-Konto und welche Daten entfernt werden.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Funktionen",
    faq: "FAQ",
    privacy: "Datenschutz",
    terms: "AGB",
    contact: "Kontakt",
    download: "App holen",
    mainAria: "Hauptnavigation",
    footerAria: "Fußzeile",
    languageAria: "Sprache",
    deleteAccount: "Konto löschen",
    copyright: "© 2026 Kangur",
    rightsReserved: "Alle Rechte vorbehalten",
  },
  home: {
    badge: "✨ Dein smarter Einkaufsassistent",
    headlineBefore: "Gemeinsam merken.",
    headlineAccent: "Vergiss nicht, was zählt.",
    lead: "Kangur ist die gemeinsame Einkaufsliste für deinen ganzen Haushalt. Erstelle Listen, wie es dir passt, kaufe Gang für Gang ein, und alle zu Hause sehen jede Änderung.",
    features: [
      "Listen aus Foto, Screenshot oder Rezept",
      "Sortiert nach Gängen im Laden",
      "Gemeinsame Listen für den Haushalt",
      "Gang für Gang einkaufen, mit Zusammenfassung",
    ],
    playSmall: "JETZT BEI",
    iosSmall: "LADEN IM",
    storesNote: "Für iPhone und Android. Zum Start 10 kostenlose AI-Nutzungen.",
    heroAlt: "Kangur - App und Maskottchen mit Einkaufstasche",
    highlightsAria: "Funktionen",
    highlights: [
      { title: "Für Familien gemacht", body: "Alle an einem Ort." },
      { title: "Privat und sicher", body: "Deine Daten bleiben deine." },
      { title: "Für den Alltag", body: "Einfach, schnell, zuverlässig." },
    ],
  },
  contact: {
    title: "Kontakt",
    intro:
      "Hast du eine Frage, einen Vorschlag oder brauchst Hilfe? Schreib uns - wir antworten so schnell wie möglich.",
    emailLabel: "E-Mail",
    responseTitle: "Antwortzeit",
    responseBody: "Wir antworten meist innerhalb von 24-48 Stunden.",
    helpTitle: "Wir sind für dich da",
    helpBody: "Schreib uns bei jedem Anliegen - wir helfen gerne!",
    mascotAlt: "Kangur-Maskottchen mit Telefon",
  },
  faq: {
    title: "FAQ",
    meta: "Häufig gestellte Fragen",
    metaEnNote: "Häufig gestellte Fragen · English",
    ctaTitle: "Keine passende Antwort gefunden?",
    ctaBody: "Unser Support-Team hilft dir gerne weiter.",
    ctaButton: "Kontaktiere uns",
    mascotAlt: "Kangur-Support-Maskottchen mit Headset",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Konto löschen",
    howHeading: "So löschst du dein Konto",
    effectsHeading: "Folgen der Löschung",
    removeHeading: "Was gelöscht wird",
    keepHeading: "Was ggf. bleibt",
    accessHeading: "Kein Zugang zum Konto",
    morePrivacy: "Mehr zur Datenverarbeitung:",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Diese Seite existiert nicht oder wurde verschoben.",
    back: "Zur Startseite",
  },
};

const fr: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Listes de courses avec l’IA",
    homeDescription:
      "Créez vos listes à partir d’une photo, d’un texte, d’une recette ou de vos courses passées. Faites les courses rayon par rayon, à plusieurs.",
    privacyTitle: "Confidentialité | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Conditions | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Contact | Kangur",
    contactDescription:
      "Contactez l’équipe Kangur - support, confidentialité et compte.",
    deleteTitle: "Supprimer le compte | Kangur",
    deleteDescription:
      "Comment supprimer votre compte Kangur et quelles données sont effacées.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Fonctions",
    faq: "FAQ",
    privacy: "Confidentialité",
    terms: "Conditions",
    contact: "Contact",
    download: "Télécharger",
    mainAria: "Principal",
    footerAria: "Pied de page",
    languageAria: "Langue",
    deleteAccount: "Supprimer le compte",
    copyright: "© 2026 Kangur",
    rightsReserved: "Tous droits réservés",
  },
  home: {
    badge: "✨ Votre assistant shopping intelligent",
    headlineBefore: "Souvenez-vous ensemble.",
    headlineAccent: "N’oubliez pas l’essentiel.",
    lead: "Kangur est la liste de courses partagée de tout votre foyer. Créez la liste comme vous voulez, faites les courses rayon par rayon, et toute la maison voit chaque modification.",
    features: [
      "Listes à partir d’une photo, d’une capture ou d’une recette",
      "Classée par rayon du magasin",
      "Listes partagées avec tout le foyer",
      "Les courses rayon par rayon, avec un résumé",
    ],
    playSmall: "DISPONIBLE SUR",
    iosSmall: "TÉLÉCHARGER DANS",
    storesNote: "Pour iPhone et Android. Vous commencez avec 10 usages IA gratuits.",
    heroAlt: "Kangur - l’appli et la mascotte avec un sac de courses",
    highlightsAria: "Fonctions",
    highlights: [
      { title: "Fait pour les familles", body: "Tout le monde au même endroit." },
      { title: "Privé et sécurisé", body: "Vos données restent les vôtres." },
      { title: "Au quotidien", body: "Simple, rapide, fiable." },
    ],
  },
  contact: {
    title: "Contact",
    intro:
      "Une question, une suggestion ou besoin d’aide ? Écrivez-nous - nous répondrons dès que possible.",
    emailLabel: "E-mail",
    responseTitle: "Délai de réponse",
    responseBody: "Nous répondons généralement sous 24-48 heures.",
    helpTitle: "Nous sommes là pour vous",
    helpBody: "Écrivez-nous pour tout sujet - nous sommes à votre écoute !",
    mascotAlt: "Mascotte Kangur avec un téléphone",
  },
  faq: {
    title: "FAQ",
    meta: "Questions fréquentes",
    metaEnNote: "Questions fréquentes · English",
    ctaTitle: "Vous n’avez pas trouvé de réponse ?",
    ctaBody: "Notre équipe d’assistance est prête à vous aider.",
    ctaButton: "Nous contacter",
    mascotAlt: "Mascotte Kangur support avec casque",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Supprimer le compte",
    howHeading: "Comment supprimer le compte",
    effectsHeading: "Conséquences de la suppression",
    removeHeading: "Ce qui est supprimé",
    keepHeading: "Ce qui peut rester",
    accessHeading: "Si vous n’avez plus accès au compte",
    morePrivacy: "En savoir plus sur le traitement des données :",
  },
  notFound: {
    title: "Page introuvable",
    body: "Cette page n’existe pas ou a été déplacée.",
    back: "Retour à l’accueil",
  },
};

const es: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Listas de la compra con IA",
    homeDescription:
      "Crea listas desde una foto, un texto, una receta o compras anteriores. Compra pasillo a pasillo y comparte las listas con tu familia.",
    privacyTitle: "Privacidad | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Términos | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Contacto | Kangur",
    contactDescription:
      "Contacta con el equipo de Kangur - soporte, privacidad y cuenta.",
    deleteTitle: "Eliminar cuenta | Kangur",
    deleteDescription:
      "Cómo eliminar tu cuenta de Kangur y qué datos se borran.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Funciones",
    faq: "FAQ",
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
    download: "Descargar app",
    mainAria: "Principal",
    footerAria: "Pie de página",
    languageAria: "Idioma",
    deleteAccount: "Eliminar cuenta",
    copyright: "© 2026 Kangur",
    rightsReserved: "Todos los derechos reservados",
  },
  home: {
    badge: "✨ Tu asistente de compras inteligente",
    headlineBefore: "Recordad juntos.",
    headlineAccent: "No olvidéis lo importante.",
    lead: "Kangur es la lista de la compra compartida para toda tu casa. Crea la lista como prefieras, compra pasillo a pasillo y todos en casa ven cada cambio.",
    features: [
      "Listas desde una foto, una captura o una receta",
      "Ordenada por pasillos del súper",
      "Listas compartidas con toda la casa",
      "Compra pasillo a pasillo, con resumen al final",
    ],
    playSmall: "DISPONIBLE EN",
    iosSmall: "DESCARGAR EN",
    storesNote: "Para iPhone y Android. Empiezas con 10 usos de IA gratis.",
    heroAlt: "Kangur - la app y la mascota con bolsa de la compra",
    highlightsAria: "Funciones",
    highlights: [
      { title: "Hecho para familias", body: "Todos en un solo lugar." },
      { title: "Privado y seguro", body: "Tus datos son solo tuyos." },
      { title: "Para el día a día", body: "Simple, rápido, fiable." },
    ],
  },
  contact: {
    title: "Contacto",
    intro:
      "¿Tienes una pregunta, sugerencia o necesitas ayuda? Escríbenos - te responderemos lo antes posible.",
    emailLabel: "E-mail",
    responseTitle: "Tiempo de respuesta",
    responseBody: "Solemos responder en 24-48 horas.",
    helpTitle: "Estamos aquí para ayudar",
    helpBody: "Escríbenos por cualquier asunto - ¡estamos para ti!",
    mascotAlt: "Mascota Kangur con un teléfono",
  },
  faq: {
    title: "FAQ",
    meta: "Preguntas frecuentes",
    metaEnNote: "Preguntas frecuentes · English",
    ctaTitle: "¿No encontraste respuesta?",
    ctaBody: "Nuestro equipo de ayuda está listo para ayudarte.",
    ctaButton: "Contáctanos",
    mascotAlt: "Mascota Kangur de soporte con auriculares",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Eliminar cuenta",
    howHeading: "Cómo eliminar la cuenta",
    effectsHeading: "Consecuencias de la eliminación",
    removeHeading: "Qué se elimina",
    keepHeading: "Qué puede permanecer",
    accessHeading: "Si no puedes acceder a tu cuenta",
    morePrivacy: "Más sobre el tratamiento de datos:",
  },
  notFound: {
    title: "Página no encontrada",
    body: "Esta página no existe o se ha movido.",
    back: "Volver al inicio",
  },
};

const it: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Lista della spesa con l’AI",
    homeDescription:
      "Crea liste da una foto, un testo, una ricetta o dalle spese precedenti. Fai la spesa reparto per reparto e condividi le liste in famiglia.",
    privacyTitle: "Privacy | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Termini | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Contatti | Kangur",
    contactDescription:
      "Contatta il team Kangur - supporto, privacy e account.",
    deleteTitle: "Elimina account | Kangur",
    deleteDescription:
      "Come eliminare l’account Kangur e quali dati vengono rimossi.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Funzioni",
    faq: "FAQ",
    privacy: "Privacy",
    terms: "Termini",
    contact: "Contatti",
    download: "Scarica l’app",
    mainAria: "Principale",
    footerAria: "Piè di pagina",
    languageAria: "Lingua",
    deleteAccount: "Elimina account",
    copyright: "© 2026 Kangur",
    rightsReserved: "Tutti i diritti riservati",
  },
  home: {
    badge: "✨ Il tuo assistente shopping intelligente",
    headlineBefore: "Ricordate insieme.",
    headlineAccent: "Non dimenticate l’essenziale.",
    lead: "Kangur è la lista della spesa condivisa per tutta la casa. Crei la lista come preferisci, fai la spesa reparto per reparto e tutti in casa vedono ogni modifica.",
    features: [
      "Liste da una foto, uno screenshot o una ricetta",
      "Ordinata per corsie del supermercato",
      "Liste condivise con tutta la famiglia",
      "La spesa reparto per reparto, con riepilogo",
    ],
    playSmall: "SCARICA SU",
    iosSmall: "SCARICA SU",
    storesNote: "Per iPhone e Android. Inizi con 10 usi AI gratuiti.",
    heroAlt: "Kangur - l’app e la mascotte con la borsa della spesa",
    highlightsAria: "Funzioni",
    highlights: [
      { title: "Pensato per le famiglie", body: "Tutti in un unico posto." },
      { title: "Privato e sicuro", body: "I tuoi dati restano tuoi." },
      { title: "Per tutti i giorni", body: "Semplice, veloce, affidabile." },
    ],
  },
  contact: {
    title: "Contatti",
    intro:
      "Hai una domanda, un suggerimento o ti serve aiuto? Scrivici - risponderemo il prima possibile.",
    emailLabel: "E-mail",
    responseTitle: "Tempi di risposta",
    responseBody: "Di solito rispondiamo entro 24-48 ore.",
    helpTitle: "Siamo qui per aiutarti",
    helpBody: "Scrivici per qualsiasi cosa - siamo al tuo fianco!",
    mascotAlt: "Mascotte Kangur con telefono",
  },
  faq: {
    title: "FAQ",
    meta: "Domande frequenti",
    metaEnNote: "Domande frequenti · English",
    ctaTitle: "Non hai trovato una risposta?",
    ctaBody: "Il nostro team di assistenza è pronto ad aiutarti.",
    ctaButton: "Contattaci",
    mascotAlt: "Mascotte Kangur supporto con cuffie",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Elimina account",
    howHeading: "Come eliminare l’account",
    effectsHeading: "Conseguenze dell’eliminazione",
    removeHeading: "Cosa viene eliminato",
    keepHeading: "Cosa può rimanere",
    accessHeading: "Se non puoi accedere all’account",
    morePrivacy: "Maggiori informazioni sul trattamento dei dati:",
  },
  notFound: {
    title: "Pagina non trovata",
    body: "Questa pagina non esiste o è stata spostata.",
    back: "Torna alla home",
  },
};

const cs: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Sdílené nákupní seznamy s AI",
    homeDescription:
      "Vytvářejte seznamy z fotky, textu, receptu nebo předchozích nákupů. Nakupujte ulička po uličce a sdílejte seznamy s domácností.",
    privacyTitle: "Soukromí | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Podmínky | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Kontakt | Kangur",
    contactDescription:
      "Kontaktujte tým Kangur - podpora, soukromí a účet.",
    deleteTitle: "Smazání účtu | Kangur",
    deleteDescription:
      "Jak smazat účet Kangur a která data se odstraní.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Funkce",
    faq: "FAQ",
    privacy: "Soukromí",
    terms: "Podmínky",
    contact: "Kontakt",
    download: "Stáhnout aplikaci",
    mainAria: "Hlavní",
    footerAria: "Zápatí",
    languageAria: "Jazyk",
    deleteAccount: "Smazat účet",
    copyright: "© 2026 Kangur",
    rightsReserved: "Všechna práva vyhrazena",
  },
  home: {
    badge: "✨ Váš chytrý nákupní asistent",
    headlineBefore: "Pamatujte spolu.",
    headlineAccent: "Nezapomeňte na to důležité.",
    lead: "Kangur je společný nákupní seznam pro celou domácnost. Seznam vytvoříte, jak vám to vyhovuje, nakupujete ulička po uličce a všichni doma vidí každou změnu.",
    features: [
      "Seznam z fotky, snímku obrazovky nebo receptu",
      "Seřazený podle uliček v obchodě",
      "Společné seznamy pro celou domácnost",
      "Nákup ulička po uličce se shrnutím",
    ],
    playSmall: "STÁHNOUT Z",
    iosSmall: "STÁHNOUT V",
    storesNote: "Pro iPhone a Android. Na začátek 10 bezplatných použití AI.",
    heroAlt: "Kangur - aplikace a maskot s nákupní taškou",
    highlightsAria: "Funkce",
    highlights: [
      { title: "Pro rodiny", body: "Všichni na jednom místě." },
      { title: "Soukromé a bezpečné", body: "Vaše data zůstávají vaše." },
      { title: "Na každý den", body: "Jednoduché, rychlé, spolehlivé." },
    ],
  },
  contact: {
    title: "Kontakt",
    intro:
      "Máte otázku, návrh nebo potřebujete pomoc? Napište nám - odpovíme co nejdříve.",
    emailLabel: "E-mail",
    responseTitle: "Doba odpovědi",
    responseBody: "Obvykle odpovídáme do 24-48 hodin.",
    helpTitle: "Jsme tu, abychom pomohli",
    helpBody: "Napište nám s čímkoli - jsme tu pro vás!",
    mascotAlt: "Maskot Kangur s telefonem",
  },
  faq: {
    title: "FAQ",
    meta: "Často kladené otázky",
    metaEnNote: "Často kladené otázky · English",
    ctaTitle: "Nenašli jste odpověď?",
    ctaBody: "Náš tým podpory je připraven vám pomoci.",
    ctaButton: "Kontaktujte nás",
    mascotAlt: "Maskot Kangur podpory se sluchátky",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Smazání účtu",
    howHeading: "Jak smazat účet",
    effectsHeading: "Důsledky smazání",
    removeHeading: "Co se smaže",
    keepHeading: "Co může zůstat",
    accessHeading: "Když nemáš přístup k účtu",
    morePrivacy: "Více o zpracování údajů:",
  },
  notFound: {
    title: "Stránka nenalezena",
    body: "Tato stránka neexistuje nebo byla přesunuta.",
    back: "Zpět na úvod",
  },
};

const ru: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Общие списки покупок с AI",
    homeDescription:
      "Создавайте списки из фото, текста, рецепта или прошлых покупок. Покупайте отдел за отделом и делитесь списками с семьёй.",
    privacyTitle: "Конфиденциальность | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Условия | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Контакты | Kangur",
    contactDescription:
      "Свяжитесь с командой Kangur - поддержка, конфиденциальность и аккаунт.",
    deleteTitle: "Удаление аккаунта | Kangur",
    deleteDescription:
      "Как удалить аккаунт Kangur и какие данные удаляются.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Функции",
    faq: "FAQ",
    privacy: "Конфиденциальность",
    terms: "Условия",
    contact: "Контакты",
    download: "Скачать приложение",
    mainAria: "Основная",
    footerAria: "Подвал",
    languageAria: "Язык",
    deleteAccount: "Удалить аккаунт",
    copyright: "© 2026 Kangur",
    rightsReserved: "Все права защищены",
  },
  home: {
    badge: "✨ Ваш умный помощник по покупкам",
    headlineBefore: "Помните вместе.",
    headlineAccent: "Не забывайте важное.",
    lead: "Kangur - общий список покупок для всей семьи. Создавайте список как удобно, покупайте отдел за отделом, а все дома видят каждое изменение.",
    features: [
      "Список из фото, скриншота или рецепта",
      "По отделам магазина",
      "Общие списки для всей семьи",
      "Покупки отдел за отделом и итог",
    ],
    playSmall: "СКАЧАТЬ В",
    iosSmall: "СКАЧАТЬ В",
    storesNote: "Для iPhone и Android. Для начала 10 бесплатных использований AI.",
    heroAlt: "Kangur - приложение и маскот с сумкой для покупок",
    highlightsAria: "Функции",
    highlights: [
      { title: "Для семей", body: "Все в одном месте." },
      { title: "Приватно и безопасно", body: "Ваши данные только ваши." },
      { title: "На каждый день", body: "Просто, быстро, надёжно." },
    ],
  },
  contact: {
    title: "Контакты",
    intro:
      "Есть вопрос, предложение или нужна помощь? Напишите нам - ответим как можно скорее.",
    emailLabel: "E-mail",
    responseTitle: "Время ответа",
    responseBody: "Обычно отвечаем в течение 24-48 часов.",
    helpTitle: "Мы здесь, чтобы помочь",
    helpBody: "Пишите по любому вопросу - мы на связи!",
    mascotAlt: "Маскот Kangur с телефоном",
  },
  faq: {
    title: "FAQ",
    meta: "Частые вопросы",
    metaEnNote: "Частые вопросы · English",
    ctaTitle: "Не нашли ответ?",
    ctaBody: "Наша команда поддержки готова помочь.",
    ctaButton: "Связаться с нами",
    mascotAlt: "Маскот Kangur поддержки с гарнитурой",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Удаление аккаунта",
    howHeading: "Как удалить аккаунт",
    effectsHeading: "Последствия удаления",
    removeHeading: "Что удаляется",
    keepHeading: "Что может остаться",
    accessHeading: "Если нет доступа к аккаунту",
    morePrivacy: "Подробнее об обработке данных:",
  },
  notFound: {
    title: "Страница не найдена",
    body: "Этой страницы нет или она была перемещена.",
    back: "На главную",
  },
};

const uk: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Спільні списки покупок з AI",
    homeDescription:
      "Створюйте списки з фото, тексту, рецепта або попередніх покупок. Купуйте відділ за відділом і діліться списками з родиною.",
    privacyTitle: "Конфіденційність | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Умови | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Контакти | Kangur",
    contactDescription:
      "Зв’яжіться з командою Kangur - підтримка, конфіденційність і обліковий запис.",
    deleteTitle: "Видалення облікового запису | Kangur",
    deleteDescription:
      "Як видалити обліковий запис Kangur і які дані видаляються.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Функції",
    faq: "FAQ",
    privacy: "Конфіденційність",
    terms: "Умови",
    contact: "Контакти",
    download: "Завантажити додаток",
    mainAria: "Головна",
    footerAria: "Підвал",
    languageAria: "Мова",
    deleteAccount: "Видалити обліковий запис",
    copyright: "© 2026 Kangur",
    rightsReserved: "Усі права захищено",
  },
  home: {
    badge: "✨ Ваш розумний помічник з покупок",
    headlineBefore: "Пам’ятайте разом.",
    headlineAccent: "Не забувайте важливе.",
    lead: "Kangur - спільний список покупок для всієї родини. Створюйте список як зручно, купуйте відділ за відділом, а всі вдома бачать кожну зміну.",
    features: [
      "Список із фото, скриншота або рецепта",
      "За відділами магазину",
      "Спільні списки для всієї родини",
      "Покупки відділ за відділом і підсумок",
    ],
    playSmall: "ЗАВАНТАЖИТИ З",
    iosSmall: "ЗАВАНТАЖИТИ В",
    storesNote: "Для iPhone і Android. Для початку 10 безкоштовних використань AI.",
    heroAlt: "Kangur - додаток і маскот із сумкою для покупок",
    highlightsAria: "Функції",
    highlights: [
      { title: "Для родин", body: "Усі в одному місці." },
      { title: "Приватно й безпечно", body: "Ваші дані лише ваші." },
      { title: "На щодень", body: "Просто, швидко, надійно." },
    ],
  },
  contact: {
    title: "Контакти",
    intro:
      "Є питання, пропозиція чи потрібна допомога? Напишіть нам - відповімо якнайшвидше.",
    emailLabel: "E-mail",
    responseTitle: "Час відповіді",
    responseBody: "Зазвичай відповідаємо протягом 24-48 годин.",
    helpTitle: "Ми тут, щоб допомогти",
    helpBody: "Пишіть з будь-якої справи - ми на зв’язку!",
    mascotAlt: "Маскот Kangur з телефоном",
  },
  faq: {
    title: "FAQ",
    meta: "Часті запитання",
    metaEnNote: "Часті запитання · English",
    ctaTitle: "Не знайшли відповідь?",
    ctaBody: "Наша команда підтримки готова допомогти.",
    ctaButton: "Зв’язатися з нами",
    mascotAlt: "Маскот Kangur підтримки з гарнітурою",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Видалення облікового запису",
    howHeading: "Як видалити обліковий запис",
    effectsHeading: "Наслідки видалення",
    removeHeading: "Що видаляється",
    keepHeading: "Що може залишитися",
    accessHeading: "Якщо немає доступу до облікового запису",
    morePrivacy: "Більше про обробку даних:",
  },
  notFound: {
    title: "Сторінку не знайдено",
    body: "Цієї сторінки немає або її переміщено.",
    back: "На головну",
  },
};

const be: MarketingMessages = {
  ...en,
  meta: {
    homeTitle: "Kangur - Агульныя спісы пакупак з AI",
    homeDescription:
      "Стварайце спісы з фота, тэксту, рэцэпта або папярэдніх пакупак. Купляйце аддзел за аддзелам і дзяліцеся спісамі з сям’ёй.",
    privacyTitle: "Прыватнасць | Kangur",
    privacyDescription: en.meta.privacyDescription,
    termsTitle: "Умовы | Kangur",
    termsDescription: en.meta.termsDescription,
    contactTitle: "Кантакты | Kangur",
    contactDescription:
      "Звяжыцеся з камандай Kangur - падтрымка, прыватнасць і акаўнт.",
    deleteTitle: "Выдаленне акаўнта | Kangur",
    deleteDescription:
      "Як выдаліць акаўнт Kangur і якія даныя выдаляюцца.",
    faqTitle: "FAQ | Kangur",
    faqDescription:
      "Frequently asked questions about Kangur - workspaces, AI, Premium, and shared shopping.",
  },
  nav: {
    features: "Функцыі",
    faq: "FAQ",
    privacy: "Прыватнасць",
    terms: "Умовы",
    contact: "Кантакты",
    download: "Спампаваць праграму",
    mainAria: "Галоўная",
    footerAria: "Падвал",
    languageAria: "Мова",
    deleteAccount: "Выдаліць акаўнт",
    copyright: "© 2026 Kangur",
    rightsReserved: "Усе правы абаронены",
  },
  home: {
    badge: "✨ Ваш разумны памочнік па пакупках",
    headlineBefore: "Памятайце разам.",
    headlineAccent: "Не забывайце важнае.",
    lead: "Kangur - агульны спіс пакупак для ўсёй сям’і. Стварайце спіс як зручна, купляйце аддзел за аддзелам, а ўсе дома бачаць кожную змену.",
    features: [
      "Спіс з фота, скрыншота або рэцэпта",
      "Па аддзелах крамы",
      "Агульныя спісы для ўсёй сям’і",
      "Пакупкі аддзел за аддзелам і вынікі",
    ],
    playSmall: "СПАМПАВАЦЬ З",
    iosSmall: "СПАМПАВАЦЬ У",
    storesNote: "Для iPhone і Android. Для пачатку 10 бясплатных выкарыстанняў AI.",
    heroAlt: "Kangur - праграма і маскот з торбай для пакупак",
    highlightsAria: "Функцыі",
    highlights: [
      { title: "Для сем’яў", body: "Усе ў адным месцы." },
      { title: "Прыватна і бяспечна", body: "Вашы даныя толькі вашы." },
      { title: "На кожны дзень", body: "Проста, хутка, надзейна." },
    ],
  },
  contact: {
    title: "Кантакты",
    intro:
      "Ёсць пытанне, прапанова ці патрэбна дапамога? Напішыце нам - адкажам як мага хутчэй.",
    emailLabel: "E-mail",
    responseTitle: "Час адказу",
    responseBody: "Звычайна адказваем на працягу 24-48 гадзін.",
    helpTitle: "Мы тут, каб дапамагчы",
    helpBody: "Пішыце па любой справе - мы на сувязі!",
    mascotAlt: "Маскот Kangur з тэлефонам",
  },
  faq: {
    title: "FAQ",
    meta: "Частыя пытанні",
    metaEnNote: "Частыя пытанні · English",
    ctaTitle: "Не знайшлі адказ?",
    ctaBody: "Наша каманда падтрымкі гатовая дапамагчы.",
    ctaButton: "Звязацца з намі",
    mascotAlt: "Маскот Kangur падтрымкі з гарнітурай",
  },
  deleteAccount: {
    ...en.deleteAccount,
    title: "Выдаленне акаўнта",
    howHeading: "Як выдаліць акаўнт",
    effectsHeading: "Наступствы выдалення",
    removeHeading: "Што выдаляецца",
    keepHeading: "Што можа застацца",
    accessHeading: "Калі няма доступу да акаўнта",
    morePrivacy: "Больш пра апрацоўку даных:",
  },
  notFound: {
    title: "Старонка не знойдзена",
    body: "Гэтай старонкі няма або яна перамешчана.",
    back: "На галоўную",
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
