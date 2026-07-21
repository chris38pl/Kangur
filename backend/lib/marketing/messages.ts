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
    iosNote: string;
    iosDisabledTitle: string;
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
    homeTitle: "Kangur – Smart shopping list",
    homeDescription:
      "Kangur helps you build shopping lists, reminds you what you need, and makes sure you forget nothing - every day.",
    privacyTitle: "Privacy Policy | Kangur",
    privacyDescription:
      "Kangur privacy policy - what data we collect, why, and your rights.",
    termsTitle: "Terms of Use | Kangur",
    termsDescription:
      "Terms for using Kangur - service rules, accounts, Premium, and liability.",
    contactTitle: "Contact | Kangur",
    contactDescription:
      "Questions, suggestions, or need help? Contact the Kangur team - we usually reply within 24–48 hours.",
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
    lead: "Kangur helps you create shopping lists, reminds you about the products you need, and makes sure you forget nothing - every day.",
    features: [
      "Shared lists and live updates",
      "Smart reminders",
      "AI import - text, photos, screenshots",
      "Works on every device",
    ],
    playSmall: "GET IT ON",
    iosSmall: "DOWNLOAD ON THE",
    iosNote: "Coming soon to iOS",
    iosDisabledTitle: "Coming soon",
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
    responseBody: "We usually reply within 24–48 hours.",
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
    homeTitle: "Kangur – Inteligentna lista zakupów",
    homeDescription:
      "Kangur pomaga tworzyć listy zakupów, przypomina o produktach i dba, by niczego nie zapomnieć - każdego dnia.",
    privacyTitle: "Polityka prywatności | Kangur",
    privacyDescription:
      "Polityka prywatności aplikacji Kangur - jakie dane zbieramy, w jakim celu i jakie masz prawa.",
    termsTitle: "Regulamin | Kangur",
    termsDescription:
      "Regulamin korzystania z aplikacji Kangur - zasady usługi, konta, Premium i odpowiedzialność.",
    contactTitle: "Kontakt | Kangur",
    contactDescription:
      "Masz pytanie, sugestię lub potrzebujesz pomocy? Napisz do zespołu Kangur - zwykle odpowiadamy w ciągu 24–48 godzin.",
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
    lead: "Kangur pomaga Ci tworzyć listy zakupów, przypomina o potrzebnych produktach i dba o to, by niczego nie zapomnieć – każdego dnia.",
    features: [
      "Wspólne listy i aktualizacje na żywo",
      "Inteligentne przypomnienia",
      "Import z AI – tekst, zdjęcia, zrzuty ekranu",
      "Działa na wszystkich urządzeniach",
    ],
    playSmall: "POBIERZ Z",
    iosSmall: "POBIERZ W",
    iosNote: "Aplikacja już wkrótce na iOS",
    iosDisabledTitle: "Wkrótce",
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
      "Masz pytanie, sugestię lub potrzebujesz pomocy? Napisz do nas – odpowiemy najszybciej, jak to możliwe.",
    emailLabel: "E-mail",
    responseTitle: "Czas odpowiedzi",
    responseBody: "Zwykle odpowiadamy w ciągu 24–48 godzin.",
    helpTitle: "Jesteśmy tu, aby pomóc",
    helpBody: "Napisz do nas w każdej sprawie – jesteśmy dla Ciebie!",
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
    homeTitle: "Kangur – Intelligente Einkaufsliste",
    homeDescription:
      "Kangur hilft beim Erstellen von Einkaufslisten, erinnert an Produkte und sorgt dafür, dass nichts vergessen wird - jeden Tag.",
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
    lead: "Kangur hilft dir, Einkaufslisten zu erstellen, erinnert an benötigte Produkte und sorgt dafür, dass nichts vergessen wird - jeden Tag.",
    features: [
      "Gemeinsame Listen und Live-Updates",
      "Intelligente Erinnerungen",
      "KI-Import - Text, Fotos, Screenshots",
      "Auf allen Geräten",
    ],
    playSmall: "JETZT BEI",
    iosSmall: "LADEN IM",
    iosNote: "Bald auch für iOS",
    iosDisabledTitle: "Demnächst",
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
    responseBody: "Wir antworten meist innerhalb von 24–48 Stunden.",
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
    homeTitle: "Kangur – Liste de courses intelligente",
    homeDescription:
      "Kangur aide à créer des listes, rappelle les produits nécessaires et évite les oublis - chaque jour.",
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
    lead: "Kangur vous aide à créer des listes de courses, rappelle les produits nécessaires et veille à ce que rien ne soit oublié - chaque jour.",
    features: [
      "Listes partagées et mises à jour en direct",
      "Rappels intelligents",
      "Import IA - texte, photos, captures",
      "Sur tous les appareils",
    ],
    playSmall: "DISPONIBLE SUR",
    iosSmall: "TÉLÉCHARGER DANS",
    iosNote: "Bientôt sur iOS",
    iosDisabledTitle: "Bientôt",
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
    responseBody: "Nous répondons généralement sous 24–48 heures.",
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
    homeTitle: "Kangur – Lista de la compra inteligente",
    homeDescription:
      "Kangur te ayuda a crear listas, recuerda productos y evita que olvides nada - cada día.",
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
    lead: "Kangur te ayuda a crear listas de la compra, recuerda los productos que necesitas y procura que no se te olvide nada - cada día.",
    features: [
      "Listas compartidas y actualizaciones en vivo",
      "Recordatorios inteligentes",
      "Importación con IA - texto, fotos, capturas",
      "En todos los dispositivos",
    ],
    playSmall: "DISPONIBLE EN",
    iosSmall: "DESCARGAR EN",
    iosNote: "Pronto en iOS",
    iosDisabledTitle: "Próximamente",
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
    responseBody: "Solemos responder en 24–48 horas.",
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
    homeTitle: "Kangur – Lista della spesa intelligente",
    homeDescription:
      "Kangur aiuta a creare liste, ricorda i prodotti e fa sì che non dimentichi nulla - ogni giorno.",
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
    lead: "Kangur ti aiuta a creare liste della spesa, ricorda i prodotti necessari e fa sì che non dimentichi nulla - ogni giorno.",
    features: [
      "Liste condivise e aggiornamenti in tempo reale",
      "Promemoria intelligenti",
      "Import AI - testo, foto, screenshot",
      "Su tutti i dispositivi",
    ],
    playSmall: "SCARICA SU",
    iosSmall: "SCARICA SU",
    iosNote: "Presto su iOS",
    iosDisabledTitle: "Presto",
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
    responseBody: "Di solito rispondiamo entro 24–48 ore.",
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
    homeTitle: "Kangur – Chytrý nákupní seznam",
    homeDescription:
      "Kangur pomáhá tvořit seznamy, připomíná produkty a hlídá, abyste na nic nezapomněli - každý den.",
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
    lead: "Kangur vám pomáhá tvořit nákupní seznamy, připomíná potřebné produkty a hlídá, abyste na nic nezapomněli - každý den.",
    features: [
      "Sdílené seznamy a živé aktualizace",
      "Chytrá připomenutí",
      "Import s AI - text, fotky, snímky",
      "Na všech zařízeních",
    ],
    playSmall: "STÁHNOUT Z",
    iosSmall: "STÁHNOUT V",
    iosNote: "Brzy na iOS",
    iosDisabledTitle: "Již brzy",
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
    responseBody: "Obvykle odpovídáme do 24–48 hodin.",
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
    homeTitle: "Kangur – Умный список покупок",
    homeDescription:
      "Kangur помогает составлять списки, напоминает о продуктах и следит, чтобы ничего не забыть - каждый день.",
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
    lead: "Kangur помогает создавать списки покупок, напоминает о нужных продуктах и следит, чтобы ничего не забыть - каждый день.",
    features: [
      "Общие списки и обновления в реальном времени",
      "Умные напоминания",
      "Импорт с ИИ - текст, фото, скриншоты",
      "На всех устройствах",
    ],
    playSmall: "СКАЧАТЬ В",
    iosSmall: "СКАЧАТЬ В",
    iosNote: "Скоро на iOS",
    iosDisabledTitle: "Скоро",
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
    responseBody: "Обычно отвечаем в течение 24–48 часов.",
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
    homeTitle: "Kangur – Розумний список покупок",
    homeDescription:
      "Kangur допомагає створювати списки, нагадує про продукти й стежить, щоб нічого не забути - щодня.",
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
    lead: "Kangur допомагає створювати списки покупок, нагадує про потрібні продукти й стежить, щоб нічого не забути - щодня.",
    features: [
      "Спільні списки та оновлення наживо",
      "Розумні нагадування",
      "Імпорт з ШІ - текст, фото, знімки",
      "На всіх пристроях",
    ],
    playSmall: "ЗАВАНТАЖИТИ З",
    iosSmall: "ЗАВАНТАЖИТИ В",
    iosNote: "Незабаром на iOS",
    iosDisabledTitle: "Незабаром",
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
    responseBody: "Зазвичай відповідаємо протягом 24–48 годин.",
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
    homeTitle: "Kangur – Разумны спіс пакупак",
    homeDescription:
      "Kangur дапамагае складаць спісы, нагадвае пра прадукты і сочыць, каб нічога не забыць - кожны дзень.",
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
    lead: "Kangur дапамагае ствараць спісы пакупак, нагадвае пра патрэбныя прадукты і сочыць, каб нічога не забыць - кожны дзень.",
    features: [
      "Агульныя спісы і абнаўленні ў рэальным часе",
      "Разумныя нагадванні",
      "Імпарт з ШІ - тэкст, фота, скрыншоты",
      "На ўсіх прыладах",
    ],
    playSmall: "СПАМПАВАЦЬ З",
    iosSmall: "СПАМПАВАЦЬ У",
    iosNote: "Хутка на iOS",
    iosDisabledTitle: "Хутка",
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
    responseBody: "Звычайна адказваем на працягу 24–48 гадзін.",
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
