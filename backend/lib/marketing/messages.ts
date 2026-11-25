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
    guides: string;
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
    guides: "Guides",
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
};

const pl: MarketingMessages = {
  nav: {
    faq: "FAQ",
    privacy: "Polityka prywatności",
    terms: "Regulamin",
    contact: "Kontakt",
    download: "Pobierz aplikację",
    mainAria: "Główne",
    footerAria: "Stopka",
    languageAria: "Język",
    deleteAccount: "Usunięcie konta",
    how: "Jak działa",
    pricing: "Cennik",
    safety: "Bezpieczeństwo",
    about: "O Kangurze",
    guides: "Poradniki",
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
};

const de: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Datenschutz",
    terms: "AGB",
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
    guides: "Ratgeber",
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
    pricing: "Prix",
    safety: "Sécurité",
    about: "À propos",
    guides: "Guides",
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
    guides: "Guías",
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
    about: "Su Kangur",
    guides: "Guide",
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
    about: "O Kanguru",
    guides: "Rady",
    press: "Pro média",
    menu: "Menu",
    skip: "Přejít na obsah",
    breadcrumbAria: "Jste tady",
    lists: "Nákupní seznamy",
    legal: "Podmínky",
    languages: "Jazyky",
    follow: "Sledujte Kangur",
    copyright: "© 2026 Kangur",
    rightsReserved: "Všechna práva vyhrazena",
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
    guides: "Советы",
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
};

const uk: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Конфіденційність",
    terms: "Умови",
    contact: "Контакти",
    download: "Завантажити додаток",
    mainAria: "Головна",
    footerAria: "Підвал",
    languageAria: "Мова",
    deleteAccount: "Видалити обліковий запис",
    how: "Як це працює",
    pricing: "Ціни",
    safety: "Безпека",
    about: "Про Kangur",
    guides: "Поради",
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
};

const be: MarketingMessages = {
  ...en,
  nav: {
    faq: "FAQ",
    privacy: "Прыватнасць",
    terms: "Умовы",
    contact: "Кантакты",
    download: "Спампаваць праграму",
    mainAria: "Галоўная",
    footerAria: "Падвал",
    languageAria: "Мова",
    deleteAccount: "Выдаліць акаўнт",
    how: "Як гэта працуе",
    pricing: "Цэны",
    safety: "Бяспека",
    about: "Пра Kangur",
    guides: "Парады",
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
