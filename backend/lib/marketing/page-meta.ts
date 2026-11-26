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
        "Kangur to aplikacja do list zakupów na iPhone’a i Androida. Zrób listę ze zdjęcia, zrzutu czatu lub nazwy dania. Produkty ułożą się według alejek.",
    },
    en: {
      title: "Kangur - shared grocery list app with AI",
      description:
        "Kangur is a grocery list app for iPhone and Android. Make a list from a photo, a chat screenshot or a dish name. Items line up by store aisle.",
    },
    de: {
      title: "Kangur - App für die gemeinsame Einkaufsliste, mit KI",
      description:
        "Kangur ist eine Einkaufslisten-App für iPhone und Android. Erstelle Listen aus Foto, Chat-Screenshot oder Gericht, sortiert nach Gängen im Markt.",
    },
    fr: {
      title: "Kangur - appli de liste de courses partagée, avec IA",
      description:
        "Kangur est une appli de liste de courses pour iPhone et Android. Créez une liste depuis une photo, une capture d’écran ou un plat, triée par rayon.",
    },
    es: {
      title: "Kangur - app de lista de la compra compartida, con IA",
      description:
        "Kangur es una app de lista de la compra para iPhone y Android. Crea una lista desde una foto, una captura de chat o un plato, ordenada por pasillos.",
    },
    it: {
      title: "Kangur - app con AI per la lista della spesa condivisa",
      description:
        "Kangur è un’app per la lista della spesa su iPhone e Android. Crea la lista da una foto, uno screenshot della chat o un piatto, divisa per reparti.",
    },
    cs: {
      title: "Kangur - aplikace s AI na sdílený nákupní seznam",
      description:
        "Kangur je aplikace na nákupní seznamy pro iPhone a Android. Seznam vytvoříš z fotky, screenshotu chatu nebo jídla a položky se seřadí podle uliček.",
    },
    ru: {
      title: "Kangur - приложение с AI для общего списка покупок",
      description:
        "Kangur - приложение для списков покупок на iPhone и Android. Список из фото, скриншота чата или блюда, товары разложены по отделам магазина.",
    },
    uk: {
      title: "Kangur - додаток з AI для спільного списку покупок",
      description:
        "Kangur - застосунок для списків покупок на iPhone та Android. Список із фото, скриншота чату чи страви, товари розкладено за відділами магазину.",
    },
    be: {
      title: "Kangur - праграма з AI для агульнага спіса пакупак",
      description:
        "Kangur - праграма для спісаў пакупак на iPhone і Android. Спіс з фота, скрыншота чата або стравы, тавары раскладзены па аддзелах крамы.",
    },
  },
  pricing: {
    pl: {
      title: "Kangur - cennik. Ile kosztuje Premium i co jest za darmo",
      description:
        "Listy zakupów, domownicy i tryb zakupów w Kangurze są darmowe. Premium kosztuje 9,99 zł miesięcznie za całą przestrzeń. Pełny cennik na paragonie.",
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
        "Opis Kangura w jednym i czterech zdaniach, fakty, ikona i ekrany do pobrania, pomysły na tekst i kontakt z twórcą.",
    },
  },
  faq: {
    pl: {
      title: "Pytania i odpowiedzi o aplikacji Kangur",
      description:
        "Jak zrobić listę ze zrzutu czatu, zaprosić domownika, co daje Premium i co działa przy słabym zasięgu. Odpowiedzi na pytania o Kangura, listę zakupów.",
    },
    en: {
      title: "Questions and answers about the Kangur app",
      description:
        "How to make a list from a chat screenshot, invite your household, what Premium adds and what works on a weak signal. Answers about the Kangur grocery list.",
    },
  },
  sharedList: {
    pl: {
      title: "Wspólna lista zakupów - aplikacja dla pary i rodziny",
      description:
        "Aplikacja do wspólnej listy zakupów na iPhone’a i Androida. Zapraszasz e-mailem, każdy dopisuje u siebie, w sklepie widać, co już w koszyku.",
    },
  },
  photoList: {
    pl: {
      title: "Lista zakupów ze zdjęcia kartki albo zrzutu czatu",
      description:
        "Zrzut rozmowy albo zdjęcie kartki zamienia się w listę zakupów według alejek. Przykład: siedem wiadomości, 22 pozycje. I kiedy AI się myli.",
    },
  },
  recipeList: {
    pl: {
      title: "Lista zakupów z przepisu: wpisz dania, odznacz, co masz",
      description:
        "Do pięciu dań naraz, składniki na jednej liście zakupów, a sól tylko raz. Odznaczasz to, co masz w domu. Własny przepis wkleisz ze schowka.",
    },
  },
  aiList: {
    pl: {
      title: "Lista zakupów z AI w aplikacji: co umie, a czego nie",
      description:
        "Aplikacja, w której AI robi listę zakupów z czatu, kartki albo nazwy dania. Ilości przepisuje z tekstu, nie doradza. Zasady, błędy i cena, po ludzku.",
    },
  },
  aisleTool: {
    pl: {
      title: "Lista zakupów z podziałem na kategorie - wklej swoją",
      description:
        "Wklej listę zakupów, a narzędzie ułoży ją według 24 kategorii w kolejności sklepu. Za darmo, bez konta. Gotową listę wczytasz do aplikacji Kangur.",
    },
  },
  tools: {
    pl: {
      title: "Narzędzia do listy zakupów: kalkulatory i alejki - Kangur",
      description:
        "Kalkulator zakupów na Wigilię i na tydzień oraz podział listy na alejki. Za darmo, bez konta. Gotową listę wczytasz do aplikacji Kangur.",
    },
  },
  christmasTool: {
    pl: {
      title: "Lista zakupów na Wigilię i święta 2026 + kalkulator",
      description:
        "Produkty na 12 potraw z ilościami na liczbę gości, co kupić wcześniej i kto co przynosi. Boże Narodzenie 2026: duże sklepy zamknięte od 24 do 27 grudnia.",
    },
  },
  weekTool: {
    pl: {
      title: "Lista zakupów na tydzień dla 1, 2 i 4 osób z ilościami",
      description:
        "Gotowa lista zakupów na tydzień: ile czego dla jednej osoby, dwóch i rodziny, także bez mięsa. Duże zakupy, mała dokupka i pięć obiadów z tej listy.",
    },
  },
  films: {
    pl: {
      title: "Filmy krok po kroku: jak używać listy zakupów Kangur",
      description:
        "Krótkie filmy z prawdziwą aplikacją: lista ze zrzutu czatu i z przepisu, wspólna lista, zakupy alejka po alejce. Każdy krótszy niż pół minuty.",
    },
  },
  contact: {
    pl: {
      title: "Kontakt - Kangur, lista zakupów z AI",
      description:
        "Masz pytanie, pomysł albo kłopot z listą zakupów? Napisz do nas, zwykle odpowiadamy w ciągu dwóch dni.",
    },
    en: {
      title: "Contact - Kangur, grocery list with AI",
      description:
        "A question, an idea or a problem with your grocery list? Write to us, we usually reply within two days.",
    },
    de: {
      title: "Kontakt - Kangur, Einkaufsliste mit KI",
      description:
        "Eine Frage, eine Idee oder ein Problem mit der Einkaufsliste? Schreib uns, meist antworten wir innerhalb von zwei Tagen.",
    },
    fr: {
      title: "Contact - Kangur, liste de courses avec l’IA",
      description:
        "Une question, une idée ou un souci avec votre liste de courses ? Écrivez-nous, nous répondons en général sous deux jours.",
    },
    es: {
      title: "Contacto - Kangur, lista de la compra con IA",
      description:
        "¿Una pregunta, una idea o un problema con tu lista de la compra? Escríbenos, solemos responder en dos días.",
    },
    it: {
      title: "Contatti - Kangur, lista della spesa con AI",
      description:
        "Una domanda, un’idea o un problema con la lista della spesa? Scrivici, di solito rispondiamo entro due giorni.",
    },
    cs: {
      title: "Kontakt - Kangur, nákupní seznam s AI",
      description:
        "Máš otázku, nápad nebo problém s nákupním seznamem? Napiš nám, obvykle odpovídáme do dvou dnů.",
    },
    ru: {
      title: "Контакты - Kangur, список покупок с AI",
      description:
        "Вопрос, идея или проблема со списком покупок? Напишите нам, обычно мы отвечаем в течение двух дней.",
    },
    uk: {
      title: "Контакти - Kangur, список покупок з AI",
      description:
        "Питання, ідея або проблема зі списком покупок? Напишіть нам, зазвичай ми відповідаємо протягом двох днів.",
    },
    be: {
      title: "Кантакты - Kangur, спіс пакупак з AI",
      description:
        "Пытанне, ідэя або праблема са спісам пакупак? Напішыце нам, звычайна мы адказваем на працягу двух дзён.",
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
        "Usuń konto w Kangurze, krok po kroku w aplikacji. Co znika razem z kontem, a co może zostać, i dlaczego Premium anuluje się osobno.",
    },
    en: {
      title: "How to delete your Kangur account",
      description:
        "Delete your Kangur account in the app, step by step. What goes with the account, what may stay, and why Premium is canceled separately.",
    },
    de: {
      title: "Kangur-Konto löschen, so geht es in der App",
      description:
        "Lösche dein Kangur-Konto Schritt für Schritt in der App. Was verschwindet, was bleiben kann und warum du Premium extra kündigst.",
    },
    fr: {
      title: "Comment supprimer votre compte Kangur",
      description:
        "Supprimez votre compte Kangur dans l’appli, étape par étape. Ce qui disparaît, ce qui peut rester, et pourquoi Premium se résilie à part.",
    },
    es: {
      title: "Cómo eliminar tu cuenta de Kangur",
      description:
        "Elimina tu cuenta de Kangur en la app, paso a paso. Qué desaparece, qué puede quedar y por qué Premium se cancela aparte.",
    },
    it: {
      title: "Come eliminare l’account di Kangur",
      description:
        "Elimina l’account di Kangur nell’app, passo dopo passo. Cosa sparisce, cosa può restare e perché Premium si disdice a parte.",
    },
    cs: {
      title: "Jak smazat účet v aplikaci Kangur",
      description:
        "Smaž si účet v Kangurovi krok za krokem v aplikaci. Co zmizí, co může zůstat a proč se Premium ruší zvlášť.",
    },
    ru: {
      title: "Как удалить аккаунт в приложении Kangur",
      description:
        "Удалите аккаунт Kangur в приложении, шаг за шагом. Что исчезнет, что может остаться и почему Premium отменяется отдельно.",
    },
    uk: {
      title: "Як видалити обліковий запис Kangur",
      description:
        "Видаліть обліковий запис Kangur у застосунку, крок за кроком. Що зникне, що може залишитися і чому Premium скасовується окремо.",
    },
    be: {
      title: "Як выдаліць уліковы запіс Kangur",
      description:
        "Выдаліце ўліковы запіс Kangur у праграме, крок за крокам. Што знікне, што можа застацца і чаму Premium скасоўваецца асобна.",
    },
  },
  /** What a link preview shows when someone passes the invitation on. Never in search. */
  invite: {
    pl: {
      title: "Zaproszenie do wspólnej listy zakupów w Kangurze",
      description:
        "Ktoś zaprasza Cię do wspólnej listy zakupów w Kangurze. Zainstaluj aplikację, zaloguj się adresem z zaproszenia i dołącz w ciągu 7 dni.",
    },
    en: {
      title: "Invitation to a shared grocery list in Kangur",
      description:
        "Someone invites you to a shared grocery list in Kangur. Install the app, sign in with the invited email and join within 7 days.",
    },
    de: {
      title: "Einladung zur gemeinsamen Einkaufsliste in Kangur",
      description:
        "Jemand lädt dich zur gemeinsamen Einkaufsliste in Kangur ein. Installiere die App, melde dich mit der eingeladenen E-Mail an und tritt in 7 Tagen bei.",
    },
    fr: {
      title: "Invitation à une liste de courses partagée dans Kangur",
      description:
        "Quelqu’un vous invite à une liste de courses partagée dans Kangur. Installez l’appli, connectez-vous avec l’e-mail invité et rejoignez-la sous 7 jours.",
    },
    es: {
      title: "Invitación a una lista de la compra compartida en Kangur",
      description:
        "Alguien te invita a una lista de la compra compartida en Kangur. Instala la app, inicia sesión con el correo invitado y únete en un plazo de 7 días.",
    },
    it: {
      title: "Invito a una lista della spesa condivisa in Kangur",
      description:
        "Qualcuno ti invita a una lista della spesa condivisa in Kangur. Installa l’app, accedi con l’email invitata e unisciti entro 7 giorni.",
    },
    cs: {
      title: "Pozvánka do sdíleného nákupního seznamu v Kangurovi",
      description:
        "Někdo tě zve do sdíleného nákupního seznamu v Kangurovi. Nainstaluj si aplikaci, přihlas se pozvaným e-mailem a připoj se do 7 dní.",
    },
    ru: {
      title: "Приглашение в общий список покупок в Kangur",
      description:
        "Вас приглашают в общий список покупок в Kangur. Установите приложение, войдите с приглашённой почтой и присоединитесь в течение 7 дней.",
    },
    uk: {
      title: "Запрошення до спільного списку покупок у Kangur",
      description:
        "Вас запрошують до спільного списку покупок у Kangur. Установіть застосунок, увійдіть із запрошеною поштою та приєднайтеся протягом 7 днів.",
    },
    be: {
      title: "Запрашэнне ў агульны спіс пакупак у Kangur",
      description:
        "Вас запрашаюць у агульны спіс пакупак у Kangur. Усталюйце праграму, увайдзіце з запрошанай поштай і далучыцеся на працягу 7 дзён.",
    },
  },
};

/** Languages without their own text describe the page they canonicalise to. */
export function pageMeta(id: MarketingRouteId, locale: AppLocale): PageMeta {
  const meta = PAGE_META[id][locale] ?? PAGE_META[id][canonicalLocale(id, locale)];
  if (!meta) throw new Error(`No title and description for "${id}" in "${locale}"`);
  return meta;
}
