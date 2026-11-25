import type { Lines } from "@/lib/marketing/content/home-types";
import type { AppLocale } from "@/lib/marketing/locale";
import { typesetCopy } from "@/lib/marketing/typography";

type Block = { title: string; items: readonly string[] };

export type DeleteAccountCopy = {
  lines: Lines;
  lead: string;
  how: { title: string; path: readonly [string, string, string]; confirm: string };
  premium: { title: string; body: string };
  effects: { title: string; body: string };
  gone: Block;
  stays: Block;
  access: { title: string; body: string };
  more: string;
};

const SUPPORT = "[[mailto:support@getkangur.com|support@getkangur.com]]";

/**
 * What really happens: backend/features/auth/deleteMe.ts. Menu names and the word to type
 * are the app's own, in every language.
 */
const COPY: Record<AppLocale, DeleteAccountCopy> = {
  pl: {
    lines: ["Usuwanie konta.", "Bez pisania do nas."],
    lead: "Masz dostęp do konta? Usuniesz je w aplikacji.",
    how: {
      title: "Jak usunąć konto",
      path: ["Profil", "Prywatność i bezpieczeństwo", "Usuń konto"],
      confirm: "Wpisz USUŃ i potwierdź.",
    },
    premium: {
      title: "Premium anuluj osobno",
      body: "Usunięcie konta nie anuluje subskrypcji. Zrobisz to w ustawieniach subskrypcji w Google Play albo App Store.",
    },
    effects: {
      title: "Co potem",
      body: "Tego nie da się cofnąć. Możesz założyć nowe konto, ale stare listy nie wrócą.",
    },
    gone: {
      title: "Co znika",
      items: [
        "konto i dane profilu",
        "przestrzenie, w których nie ma nikogo poza Tobą, razem z listami i historią",
        "Twoje członkostwo w przestrzeniach z innymi osobami",
        "ustawienia i powiadomienia na Twoich urządzeniach",
      ],
    },
    stays: {
      title: "Co może zostać",
      items: [
        "listy w przestrzeniach, z których korzystają inni",
        "historia płatności w Google Play albo App Store, według zasad sklepu",
        "statystyki użycia bez nazw produktów oraz zgłoszenia wysłane przez „Opinia”",
        "kopie zapasowe i logi techniczne, do czasu ich rotacji",
        "dane, które musimy zachować z powodów prawnych lub rozliczeniowych",
      ],
    },
    access: {
      title: "Nie możesz się zalogować?",
      body: `Napisz na ${SUPPORT}.`,
    },
    more: "Więcej o danych: [[privacy|polityka prywatności]], [[terms|regulamin]], [[contact|kontakt]].",
  },
  en: {
    lines: ["Deleting your account.", "No need to write to us."],
    lead: "Can you sign in? Then you can delete it in the app.",
    how: {
      title: "How to delete your account",
      path: ["Profile", "Privacy & security", "Delete account"],
      confirm: "Type DELETE and confirm.",
    },
    premium: {
      title: "Cancel Premium separately",
      body: "Deleting your account does not cancel a subscription. You do that in the subscription settings of Google Play or the App Store.",
    },
    effects: {
      title: "What happens next",
      body: "This cannot be undone. You can create a new account, but the old lists will not come back.",
    },
    gone: {
      title: "What goes",
      items: [
        "your account and profile data",
        "spaces with nobody but you in them, with their lists and history",
        "your membership in spaces you share with others",
        "settings and notifications on your devices",
      ],
    },
    stays: {
      title: "What may stay",
      items: [
        "lists in spaces that other people use",
        "payment history in Google Play or the App Store, under the store’s own rules",
        "usage statistics without product names, and reports sent through “Feedback”",
        "backups and technical logs, until they rotate",
        "data we have to keep for legal or accounting reasons",
      ],
    },
    access: { title: "Cannot sign in?", body: `Write to ${SUPPORT}.` },
    more: "More about data: [[privacy|privacy policy]], [[terms|terms]], [[contact|contact]].",
  },
  de: {
    lines: ["Konto löschen.", "Ohne uns zu schreiben."],
    lead: "Du kannst dich anmelden? Dann löschst du es in der App.",
    how: {
      title: "So löschst du dein Konto",
      path: ["Profil", "Datenschutz & Sicherheit", "Konto löschen"],
      confirm: "Tipp LÖSCHEN ein und bestätige.",
    },
    premium: {
      title: "Premium extra kündigen",
      body: "Wer das Konto löscht, kündigt damit kein Abo. Das geht in den Abo-Einstellungen von Google Play oder App Store.",
    },
    effects: {
      title: "Was dann passiert",
      body: "Das lässt sich nicht rückgängig machen. Ein neues Konto ist möglich, die alten Listen kommen aber nicht zurück.",
    },
    gone: {
      title: "Was verschwindet",
      items: [
        "Konto und Profildaten",
        "Bereiche, in denen außer dir niemand ist, samt Listen und Verlauf",
        "deine Mitgliedschaft in Bereichen mit anderen",
        "Einstellungen und Mitteilungen auf deinen Geräten",
      ],
    },
    stays: {
      title: "Was bleiben kann",
      items: [
        "Listen in Bereichen, die andere nutzen",
        "die Zahlungshistorie in Google Play oder App Store, nach deren Regeln",
        "Nutzungsstatistiken ohne Produktnamen und Meldungen über „Feedback“",
        "Sicherungskopien und technische Protokolle, bis sie ersetzt werden",
        "Daten, die wir aus rechtlichen oder buchhalterischen Gründen aufbewahren müssen",
      ],
    },
    access: { title: "Anmelden klappt nicht?", body: `Schreib an ${SUPPORT}.` },
    more: "Mehr zu Daten: [[privacy|Datenschutz (Englisch)]], [[terms|Nutzungsbedingungen (Englisch)]], [[contact|Kontakt]].",
  },
  fr: {
    lines: ["Supprimer le compte.", "Sans nous écrire."],
    lead: "Vous pouvez vous connecter ? Alors cela se fait dans l’appli.",
    how: {
      title: "Comment supprimer le compte",
      path: ["Profil", "Confidentialité et sécurité", "Supprimer le compte"],
      confirm: "Tapez SUPPRIMER et confirmez.",
    },
    premium: {
      title: "Résiliez Premium à part",
      body: "Supprimer le compte ne résilie pas l’abonnement. Cela se fait dans les réglages d’abonnement de Google Play ou de l’App Store.",
    },
    effects: {
      title: "Et ensuite",
      body: "C’est définitif. Vous pourrez créer un nouveau compte, mais les anciennes listes ne reviendront pas.",
    },
    gone: {
      title: "Ce qui disparaît",
      items: [
        "le compte et les données du profil",
        "les espaces sans personne d’autre que vous, avec leurs listes et leur historique",
        "votre participation aux espaces partagés avec d’autres",
        "les réglages et les notifications sur vos appareils",
      ],
    },
    stays: {
      title: "Ce qui peut rester",
      items: [
        "les listes des espaces utilisés par d’autres",
        "l’historique des paiements chez Google Play ou l’App Store, selon leurs règles",
        "les statistiques d’utilisation sans noms de produits et les messages envoyés par « Commentaires »",
        "les sauvegardes et les journaux techniques, jusqu’à leur renouvellement",
        "les données que la loi ou la comptabilité nous oblige à garder",
      ],
    },
    access: { title: "Impossible de vous connecter ?", body: `Écrivez à ${SUPPORT}.` },
    more: "Plus d’informations : [[privacy|confidentialité (en anglais)]], [[terms|conditions (en anglais)]], [[contact|contact]].",
  },
  es: {
    lines: ["Eliminar la cuenta.", "Sin escribirnos."],
    lead: "¿Puedes entrar en tu cuenta? Entonces se elimina en la app.",
    how: {
      title: "Cómo eliminar la cuenta",
      path: ["Perfil", "Privacidad y seguridad", "Eliminar cuenta"],
      confirm: "Escribe ELIMINAR y confirma.",
    },
    premium: {
      title: "Cancela Premium aparte",
      body: "Eliminar la cuenta no cancela la suscripción. Eso se hace en los ajustes de suscripciones de Google Play o del App Store.",
    },
    effects: {
      title: "Qué pasa después",
      body: "No se puede deshacer. Puedes crear otra cuenta, pero las listas antiguas no vuelven.",
    },
    gone: {
      title: "Qué desaparece",
      items: [
        "la cuenta y los datos del perfil",
        "los espacios en los que solo estás tú, con sus listas y su historial",
        "tu participación en los espacios con otras personas",
        "los ajustes y los avisos en tus dispositivos",
      ],
    },
    stays: {
      title: "Qué puede quedar",
      items: [
        "las listas de los espacios que usan otras personas",
        "el historial de pagos en Google Play o en el App Store, según sus normas",
        "las estadísticas de uso sin nombres de productos y los mensajes enviados desde «Comentarios»",
        "las copias de seguridad y los registros técnicos, hasta que se renueven",
        "los datos que debemos guardar por motivos legales o contables",
      ],
    },
    access: { title: "¿No puedes entrar?", body: `Escribe a ${SUPPORT}.` },
    more: "Más sobre los datos: [[privacy|privacidad (en inglés)]], [[terms|condiciones (en inglés)]], [[contact|contacto]].",
  },
  it: {
    lines: ["Eliminare l’account.", "Senza scriverci."],
    lead: "Riesci ad accedere? Allora si elimina nell’app.",
    how: {
      title: "Come eliminare l’account",
      path: ["Profilo", "Privacy e sicurezza", "Elimina account"],
      confirm: "Scrivi ELIMINA e conferma.",
    },
    premium: {
      title: "Disdici Premium a parte",
      body: "Eliminare l’account non disdice l’abbonamento. Si fa nelle impostazioni degli abbonamenti di Google Play o dell’App Store.",
    },
    effects: {
      title: "Cosa succede dopo",
      body: "Non si torna indietro. Puoi creare un nuovo account, ma le vecchie liste non tornano.",
    },
    gone: {
      title: "Cosa sparisce",
      items: [
        "l’account e i dati del profilo",
        "gli spazi in cui ci sei solo tu, con liste e cronologia",
        "la tua partecipazione agli spazi con altre persone",
        "impostazioni e notifiche sui tuoi dispositivi",
      ],
    },
    stays: {
      title: "Cosa può restare",
      items: [
        "le liste negli spazi usati da altri",
        "la cronologia dei pagamenti su Google Play o App Store, secondo le loro regole",
        "le statistiche d’uso senza nomi di prodotti e le segnalazioni inviate da «Feedback»",
        "copie di backup e log tecnici, finché non vengono sostituiti",
        "i dati che dobbiamo conservare per motivi legali o contabili",
      ],
    },
    access: { title: "Non riesci ad accedere?", body: `Scrivi a ${SUPPORT}.` },
    more: "Altro sui dati: [[privacy|privacy (in inglese)]], [[terms|termini (in inglese)]], [[contact|contatti]].",
  },
  cs: {
    lines: ["Smazání účtu.", "Psát nám nemusíš."],
    lead: "Dostaneš se do účtu? Pak ho smažeš v aplikaci.",
    how: {
      title: "Jak smazat účet",
      path: ["Profil", "Soukromí a zabezpečení", "Smazat účet"],
      confirm: "Napiš SMAZAT a potvrď.",
    },
    premium: {
      title: "Premium zruš zvlášť",
      body: "Smazáním účtu se předplatné nezruší. To uděláš v nastavení předplatného v Google Play nebo App Store.",
    },
    effects: {
      title: "Co bude dál",
      body: "Vrátit to nejde. Můžeš si založit nový účet, ale staré seznamy se nevrátí.",
    },
    gone: {
      title: "Co zmizí",
      items: [
        "účet a údaje profilu",
        "prostory, ve kterých není nikdo kromě tebe, i se seznamy a historií",
        "tvoje členství v prostorech s dalšími lidmi",
        "nastavení a oznámení na tvých zařízeních",
      ],
    },
    stays: {
      title: "Co může zůstat",
      items: [
        "seznamy v prostorech, které používají jiní",
        "historie plateb v Google Play nebo App Store podle jejich pravidel",
        "statistiky používání bez názvů produktů a hlášení poslaná přes „Zpětná vazba“",
        "zálohy a technické logy, dokud se nepřepíšou",
        "údaje, které musíme uchovat ze zákona nebo kvůli účetnictví",
      ],
    },
    access: { title: "Nejde ti přihlášení?", body: `Napiš na ${SUPPORT}.` },
    more: "Víc o údajích: [[privacy|soukromí (anglicky)]], [[terms|podmínky (anglicky)]], [[contact|kontakt]].",
  },
  ru: {
    lines: ["Удаление аккаунта.", "Писать нам не нужно."],
    lead: "Можете войти в аккаунт? Тогда он удаляется в приложении.",
    how: {
      title: "Как удалить аккаунт",
      path: ["Профиль", "Конфиденциальность и безопасность", "Удалить аккаунт"],
      confirm: "Введите УДАЛИТЬ и подтвердите.",
    },
    premium: {
      title: "Premium отменяется отдельно",
      body: "Удаление аккаунта не отменяет подписку. Это делается в настройках подписок Google Play или App Store.",
    },
    effects: {
      title: "Что будет потом",
      body: "Отменить это нельзя. Можно создать новый аккаунт, но старые списки не вернутся.",
    },
    gone: {
      title: "Что исчезнет",
      items: [
        "аккаунт и данные профиля",
        "пространства, где нет никого, кроме вас, вместе со списками и историей",
        "ваше участие в пространствах с другими людьми",
        "настройки и уведомления на ваших устройствах",
      ],
    },
    stays: {
      title: "Что может остаться",
      items: [
        "списки в пространствах, которыми пользуются другие",
        "история платежей в Google Play или App Store по правилам магазина",
        "статистика использования без названий товаров и сообщения из раздела «Обратная связь»",
        "резервные копии и технические журналы, пока они не обновятся",
        "данные, которые мы обязаны хранить по закону или для бухгалтерии",
      ],
    },
    access: { title: "Не получается войти?", body: `Напишите на ${SUPPORT}.` },
    more: "Подробнее о данных: [[privacy|конфиденциальность (на английском)]], [[terms|условия (на английском)]], [[contact|контакты]].",
  },
  uk: {
    lines: ["Видалення облікового запису.", "Писати нам не треба."],
    lead: "Можете увійти? Тоді він видаляється в застосунку.",
    how: {
      title: "Як видалити обліковий запис",
      path: ["Профіль", "Конфіденційність і безпека", "Видалити обліковий запис"],
      confirm: "Введіть ВИДАЛИТИ й підтвердьте.",
    },
    premium: {
      title: "Premium скасовується окремо",
      body: "Видалення облікового запису не скасовує підписку. Це робиться в налаштуваннях підписок Google Play або App Store.",
    },
    effects: {
      title: "Що буде потім",
      body: "Скасувати це не можна. Можна створити новий обліковий запис, але старі списки не повернуться.",
    },
    gone: {
      title: "Що зникне",
      items: [
        "обліковий запис і дані профілю",
        "простори, де немає нікого, крім вас, разом зі списками й історією",
        "ваша участь у просторах з іншими людьми",
        "налаштування й сповіщення на ваших пристроях",
      ],
    },
    stays: {
      title: "Що може залишитися",
      items: [
        "списки в просторах, якими користуються інші",
        "історія платежів у Google Play або App Store за правилами магазину",
        "статистика використання без назв товарів і повідомлення з розділу «Зворотний зв’язок»",
        "резервні копії й технічні журнали, доки вони не оновляться",
        "дані, які ми мусимо зберігати за законом або для бухгалтерії",
      ],
    },
    access: { title: "Не вдається увійти?", body: `Напишіть на ${SUPPORT}.` },
    more: "Більше про дані: [[privacy|конфіденційність (англійською)]], [[terms|умови (англійською)]], [[contact|контакти]].",
  },
  be: {
    lines: ["Выдаленне ўліковага запісу.", "Пісаць нам не трэба."],
    lead: "Можаце ўвайсці? Тады ён выдаляецца ў праграме.",
    how: {
      title: "Як выдаліць уліковы запіс",
      path: ["Профіль", "Прыватнасць і бяспека", "Выдаліць уліковы запіс"],
      confirm: "Увядзіце ВЫДАЛІЦЬ і пацвердзіце.",
    },
    premium: {
      title: "Premium скасоўваецца асобна",
      body: "Выдаленне ўліковага запісу не скасоўвае падпіску. Гэта робіцца ў наладах падпісак Google Play або App Store.",
    },
    effects: {
      title: "Што будзе потым",
      body: "Скасаваць гэта нельга. Можна стварыць новы ўліковы запіс, але старыя спісы не вернуцца.",
    },
    gone: {
      title: "Што знікне",
      items: [
        "уліковы запіс і даныя профілю",
        "прасторы, дзе няма нікога, акрамя вас, разам са спісамі і гісторыяй",
        "ваш удзел у прасторах з іншымі людзьмі",
        "налады і апавяшчэнні на вашых прыладах",
      ],
    },
    stays: {
      title: "Што можа застацца",
      items: [
        "спісы ў прасторах, якімі карыстаюцца іншыя",
        "гісторыя плацяжоў у Google Play або App Store паводле правілаў крамы",
        "статыстыка выкарыстання без назваў тавараў і паведамленні з раздзела «Зваротная сувязь»",
        "рэзервовыя копіі і тэхнічныя журналы, пакуль яны не абновяцца",
        "даныя, якія мы мусім захоўваць паводле закону або для бухгалтэрыі",
      ],
    },
    access: { title: "Не атрымліваецца ўвайсці?", body: `Напішыце на ${SUPPORT}.` },
    more: "Больш пра даныя: [[privacy|прыватнасць (па-англійску)]], [[terms|умовы (па-англійску)]], [[contact|кантакты]].",
  },
};

export function deleteAccountCopy(locale: AppLocale): DeleteAccountCopy {
  return typesetCopy(COPY[locale], locale);
}
