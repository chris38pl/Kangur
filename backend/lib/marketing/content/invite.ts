import type { Lines } from "@/lib/marketing/content/home-types";
import type { AppLocale } from "@/lib/marketing/locale";
import { typesetCopy } from "@/lib/marketing/typography";

type Step = { title: string; body: string };

export type InviteCopy = {
  crumb: string;
  lines: Lines;
  lead: string;
  title: string;
  /** Only on a computer, next to a code that carries the invitation to the phone. */
  computer: Step & { label: string };
  install: Step;
  open: Step & { button: string };
  /** Instead of the button, when the address came without an invitation. */
  missing: string;
  join: Step;
  expiry: string;
};

/**
 * The page the invitation e-mail leads to (lib/email/sendInviteEmail.ts). What really
 * happens: the app opens kangur://invite/<token> (mobile/app/invite/[token].tsx), asks to
 * sign in, and the server accepts only the address the invitation went to, for 7 days
 * (lib/invite/token.ts). Button names in quotes are the app's own, in every language.
 */
const COPY: Record<AppLocale, InviteCopy> = {
  pl: {
    crumb: "Zaproszenie",
    lines: ["Masz zaproszenie", "do wspólnej listy zakupów."],
    lead: "Kangur to aplikacja do wspólnych list zakupów na iPhone’a i Androida. Po dołączeniu widzisz te same listy co osoba, która Cię zaprasza, i dopisujesz do nich u siebie.",
    title: "Jak dołączyć",
    computer: {
      title: "Czytasz to na komputerze?",
      body: "Zeskanuj kod aparatem telefonu. Ta strona otworzy się na nim razem z zaproszeniem.",
      label: "Kod z zaproszeniem do zeskanowania telefonem",
    },
    install: {
      title: "Zainstaluj Kangura",
      body: "Dołączenie nic nie kosztuje. Masz już Kangura? Przejdź do kroku 2.",
    },
    open: {
      title: "Otwórz zaproszenie",
      body: "Po instalacji wróć tutaj i stuknij przycisk. Możesz też jeszcze raz otworzyć link z e-maila.",
      button: "Otwórz zaproszenie w Kangurze",
    },
    missing: "Nie widzimy tu zaproszenia. Otwórz jeszcze raz link z e-maila.",
    join: {
      title: "Zaloguj się i stuknij „Dołącz”",
      body: "Użyj adresu e-mail, na który przyszło zaproszenie. Inny adres go nie otworzy. Przy logowaniu przez Apple nie ukrywaj adresu.",
    },
    expiry: "Zaproszenie jest ważne 7 dni. Potem poproś osobę, która Cię zaprasza, o nowe.",
  },
  en: {
    crumb: "Invitation",
    lines: ["You have an invitation", "to a shared grocery list."],
    lead: "Kangur is a shared grocery list app for iPhone and Android. Once you join, you see the same lists as the person who invites you and add to them on your own phone.",
    title: "How to join",
    computer: {
      title: "Reading this on a computer?",
      body: "Scan the code with your phone’s camera. This page opens there, with the invitation.",
      label: "Code with your invitation, to scan with a phone",
    },
    install: {
      title: "Install Kangur",
      body: "Joining is free. Already have Kangur? Go to step 2.",
    },
    open: {
      title: "Open the invitation",
      body: "Come back here after installing and tap the button. You can also open the link in the email again.",
      button: "Open the invitation in Kangur",
    },
    missing: "There is no invitation on this page. Open the link in the email again.",
    join: {
      title: "Sign in and tap “Join”",
      body: "Use the email address the invitation was sent to. Another address will not open it. Signing in with Apple? Do not hide your email.",
    },
    expiry: "The invitation is valid for 7 days. After that, ask the person who invites you for a new one.",
  },
  de: {
    crumb: "Einladung",
    lines: ["Du hast eine Einladung", "zur gemeinsamen Einkaufsliste."],
    lead: "Kangur ist eine App für gemeinsame Einkaufslisten auf iPhone und Android. Nach dem Beitritt siehst du dieselben Listen wie die Person, die dich einlädt, und ergänzt sie auf deinem Handy.",
    title: "So trittst du bei",
    computer: {
      title: "Liest du das am Computer?",
      body: "Scanne den Code mit der Kamera deines Handys. Diese Seite öffnet sich dort, mit der Einladung.",
      label: "Code mit deiner Einladung, zum Scannen mit dem Handy",
    },
    install: {
      title: "Installiere Kangur",
      body: "Der Beitritt kostet nichts. Du hast Kangur schon? Weiter mit Schritt 2.",
    },
    open: {
      title: "Öffne die Einladung",
      body: "Komm nach der Installation hierher zurück und tippe auf den Button. Du kannst auch den Link in der E-Mail noch einmal öffnen.",
      button: "Einladung in Kangur öffnen",
    },
    missing: "Auf dieser Seite fehlt die Einladung. Öffne den Link in der E-Mail noch einmal.",
    join: {
      title: "Melde dich an und tippe auf „Beitreten“",
      body: "Nimm die E-Mail-Adresse, an die die Einladung ging. Eine andere Adresse öffnet sie nicht. Anmeldung mit Apple? Verbirg deine E-Mail-Adresse nicht.",
    },
    expiry: "Die Einladung gilt 7 Tage. Danach bitte die Person, die dich einlädt, um eine neue.",
  },
  fr: {
    crumb: "Invitation",
    lines: ["Vous avez une invitation", "à une liste de courses partagée."],
    lead: "Kangur est une appli de listes de courses partagées pour iPhone et Android. Dans l’espace, vous voyez les mêmes listes que la personne qui vous invite et vous les complétez sur votre téléphone.",
    title: "Comment rejoindre l’espace",
    computer: {
      title: "Vous lisez ceci sur un ordinateur ?",
      body: "Scannez le code avec l’appareil photo du téléphone. Cette page s’y ouvrira, avec l’invitation.",
      label: "Code avec votre invitation, à scanner avec un téléphone",
    },
    install: {
      title: "Installez Kangur",
      body: "Rejoindre l’espace ne coûte rien. Vous avez déjà Kangur ? Passez à l’étape 2.",
    },
    open: {
      title: "Ouvrez l’invitation",
      body: "Après l’installation, revenez ici et touchez le bouton. Vous pouvez aussi rouvrir le lien de l’e-mail.",
      button: "Ouvrir l’invitation dans Kangur",
    },
    missing: "Cette page ne contient pas d’invitation. Rouvrez le lien de l’e-mail.",
    join: {
      title: "Connectez-vous et touchez « Rejoindre »",
      body: "Utilisez l’adresse e-mail qui a reçu l’invitation. Une autre adresse ne l’ouvrira pas. Connexion avec Apple ? Ne masquez pas votre adresse e-mail.",
    },
    expiry: "L’invitation est valable 7 jours. Ensuite, demandez-en une nouvelle à la personne qui vous invite.",
  },
  es: {
    crumb: "Invitación",
    lines: ["Tienes una invitación", "a una lista de la compra compartida."],
    lead: "Kangur es una app de listas de la compra compartidas para iPhone y Android. Al unirte, ves las mismas listas que la persona que te invita y añades cosas desde tu móvil.",
    title: "Cómo unirte",
    computer: {
      title: "¿Lo lees en un ordenador?",
      body: "Escanea el código con la cámara del móvil. Esta página se abrirá allí, con la invitación.",
      label: "Código con tu invitación, para escanear con el móvil",
    },
    install: {
      title: "Instala Kangur",
      body: "Unirte no cuesta nada. ¿Ya tienes Kangur? Pasa al paso 2.",
    },
    open: {
      title: "Abre la invitación",
      body: "Tras la instalación, vuelve aquí y toca el botón. También puedes abrir otra vez el enlace del correo.",
      button: "Abrir la invitación en Kangur",
    },
    missing: "Esta página no trae ninguna invitación. Abre otra vez el enlace del correo.",
    join: {
      title: "Inicia sesión y toca «Unirse»",
      body: "Usa la dirección de correo a la que llegó la invitación. Otra dirección no la abrirá. ¿Entras con Apple? No ocultes tu correo.",
    },
    expiry: "La invitación vale 7 días. Después, pide una nueva a la persona que te invita.",
  },
  it: {
    crumb: "Invito",
    lines: ["Hai un invito", "a una lista della spesa condivisa."],
    lead: "Kangur è un’app per liste della spesa condivise su iPhone e Android. Nello spazio vedi le stesse liste della persona che ti invita e le completi dal tuo telefono.",
    title: "Come unirti",
    computer: {
      title: "Stai leggendo dal computer?",
      body: "Inquadra il codice con la fotocamera del telefono. Questa pagina si aprirà lì, con l’invito.",
      label: "Codice con il tuo invito, da inquadrare con il telefono",
    },
    install: {
      title: "Installa Kangur",
      body: "Unirti non costa nulla. Hai già Kangur? Vai al passo 2.",
    },
    open: {
      title: "Apri l’invito",
      body: "Dopo l’installazione torna qui e tocca il pulsante. Puoi anche riaprire il link dell’email.",
      button: "Apri l’invito in Kangur",
    },
    missing: "In questa pagina manca l’invito. Riapri il link dell’email.",
    join: {
      title: "Accedi e tocca «Unisciti»",
      body: "Usa l’indirizzo email a cui è arrivato l’invito. Un altro indirizzo non lo apre. Accedi con Apple? Non nascondere la tua email.",
    },
    expiry: "L’invito vale 7 giorni. Dopo, chiedine uno nuovo alla persona che ti invita.",
  },
  cs: {
    crumb: "Pozvánka",
    lines: ["Máš pozvánku", "do sdíleného nákupního seznamu."],
    lead: "Kangur je aplikace na sdílené nákupní seznamy pro iPhone a Android. Po připojení vidíš stejné seznamy jako osoba, která tě zve, a doplňuješ je ve svém telefonu.",
    title: "Jak se připojit",
    computer: {
      title: "Čteš to na počítači?",
      body: "Naskenuj kód fotoaparátem telefonu. Tahle stránka se v něm otevře i s pozvánkou.",
      label: "Kód s pozvánkou, naskenuj ho telefonem",
    },
    install: {
      title: "Nainstaluj si Kangur",
      body: "Připojení nic nestojí. Kangur už máš? Pokračuj krokem 2.",
    },
    open: {
      title: "Otevři pozvánku",
      body: "Po instalaci se sem vrať a klepni na tlačítko. Můžeš taky znovu otevřít odkaz z e-mailu.",
      button: "Otevřít pozvánku v Kangurovi",
    },
    missing: "Na této stránce pozvánka chybí. Otevři znovu odkaz z e-mailu.",
    join: {
      title: "Přihlas se a klepni na „Připojit se“",
      body: "Použij e-mail, na který pozvánka přišla. Jiná adresa ji neotevře. Přihlašuješ se přes Apple? Neskrývej svůj e-mail.",
    },
    expiry: "Pozvánka platí 7 dní. Potom požádej osobu, která tě zve, o novou.",
  },
  ru: {
    crumb: "Приглашение",
    lines: ["У вас приглашение", "в общий список покупок."],
    lead: "Kangur - приложение для общих списков покупок на iPhone и Android. После присоединения вы видите те же списки, что и человек, который вас приглашает, и дополняете их со своего телефона.",
    title: "Как присоединиться",
    computer: {
      title: "Читаете это на компьютере?",
      body: "Отсканируйте код камерой телефона. Эта страница откроется на нём вместе с приглашением.",
      label: "Код с приглашением, отсканируйте его телефоном",
    },
    install: {
      title: "Установите Kangur",
      body: "Присоединиться можно бесплатно. Kangur уже есть? Переходите к шагу 2.",
    },
    open: {
      title: "Откройте приглашение",
      body: "После установки вернитесь сюда и нажмите кнопку. Или ещё раз откройте ссылку из письма.",
      button: "Открыть приглашение в Kangur",
    },
    missing: "На этой странице нет приглашения. Откройте ссылку из письма ещё раз.",
    join: {
      title: "Войдите и нажмите «Присоединиться»",
      body: "Используйте адрес почты, на который пришло приглашение. С другим адресом оно не откроется. Входите через Apple? Не скрывайте почту.",
    },
    expiry: "Приглашение действует 7 дней. Потом попросите новое у человека, который вас приглашает.",
  },
  uk: {
    crumb: "Запрошення",
    lines: ["У вас запрошення", "до спільного списку покупок."],
    lead: "Kangur - застосунок для спільних списків покупок на iPhone та Android. Після приєднання ви бачите ті самі списки, що й людина, яка вас запрошує, і доповнюєте їх зі свого телефона.",
    title: "Як приєднатися",
    computer: {
      title: "Читаєте це на комп’ютері?",
      body: "Відскануйте код камерою телефона. Ця сторінка відкриється на ньому разом із запрошенням.",
      label: "Код із запрошенням, відскануйте його телефоном",
    },
    install: {
      title: "Установіть Kangur",
      body: "Приєднатися можна безкоштовно. Kangur уже є? Переходьте до кроку 2.",
    },
    open: {
      title: "Відкрийте запрошення",
      body: "Після встановлення поверніться сюди й натисніть кнопку. Або ще раз відкрийте посилання з листа.",
      button: "Відкрити запрошення в Kangur",
    },
    missing: "На цій сторінці немає запрошення. Відкрийте посилання з листа ще раз.",
    join: {
      title: "Увійдіть і натисніть «Приєднатись»",
      body: "Використайте адресу пошти, на яку прийшло запрошення. З іншою адресою воно не відкриється. Входите через Apple? Не приховуйте пошту.",
    },
    expiry: "Запрошення дійсне 7 днів. Потім попросіть нове в людини, яка вас запрошує.",
  },
  be: {
    crumb: "Запрашэнне",
    lines: ["У вас запрашэнне", "у агульны спіс пакупак."],
    lead: "Kangur - праграма для агульных спісаў пакупак на iPhone і Android. Пасля далучэння вы бачыце тыя ж спісы, што і чалавек, які вас запрашае, і дапаўняеце іх са свайго тэлефона.",
    title: "Як далучыцца",
    computer: {
      title: "Чытаеце гэта на камп’ютары?",
      body: "Адскануйце код камерай тэлефона. Гэтая старонка адкрыецца на ім разам з запрашэннем.",
      label: "Код з запрашэннем, адскануйце яго тэлефонам",
    },
    install: {
      title: "Усталюйце Kangur",
      body: "Далучыцца можна бясплатна. Kangur ужо ёсць? Пераходзьце да кроку 2.",
    },
    open: {
      title: "Адкрыйце запрашэнне",
      body: "Пасля ўсталёўкі вярніцеся сюды і націсніце кнопку. Або яшчэ раз адкрыйце спасылку з ліста.",
      button: "Адкрыць запрашэнне ў Kangur",
    },
    missing: "На гэтай старонцы няма запрашэння. Адкрыйце спасылку з ліста яшчэ раз.",
    join: {
      title: "Увайдзіце і націсніце «Далучыцца»",
      body: "Выкарыстайце адрас пошты, на які прыйшло запрашэнне. З іншым адрасам яно не адкрыецца. Уваходзіце праз Apple? Не хавайце пошту.",
    },
    expiry: "Запрашэнне дзейнічае 7 дзён. Потым папрасіце новае ў чалавека, які вас запрашае.",
  },
};

export function inviteCopy(locale: AppLocale): InviteCopy {
  return typesetCopy(COPY[locale], locale);
}
