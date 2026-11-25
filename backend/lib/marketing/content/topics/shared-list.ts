import type { Chat } from "@/components/site/ChatCard";
import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Wspólna lista zakupów",
  eyebrow: "Aplikacja do wspólnej listy zakupów, na iPhone’a i Androida",
  lines: ["Dwie osoby w sklepie.", "Jedno masło w koszyku."],
  lead: [
    "Jedna lista, tyle telefonów, ilu domowników. Ktoś dopisuje masło z tramwaju, ktoś odhacza je przy lodówkach, a reszta widzi to po chwili.",
    "Zapraszasz e-mailem tyle osób, ile chcesz. Zaproszenia nic nie kosztują.",
  ],
  stores: "Bez reklam. Wspólne listy są darmowe, także bez Premium.",
  sections: [
    {
      kind: "text",
      title: "Telefon z alejki. Znamy to",
      body: [
        "Ktoś stoi przy lodówkach i pisze. Ktoś inny jest akurat pod prysznicem. Masło jedzie do domu na wszelki wypadek.",
        "Na wspólnej liście masło albo jest, albo go nie ma. Nikt nie musi odbierać telefonu między nabiałem a kasą.",
      ],
      slot: "chat",
    },
    {
      kind: "steps",
      tone: "mint",
      title: "Jak zrobić wspólną listę zakupów",
      intro: "Raz na początku. Potem już tylko dopisujecie.",
      items: [
        {
          title: "Załóż konto",
          body: "E-mailem, przez Google albo Apple. Po to, żeby lista wiedziała, czyja jest.",
        },
        {
          title: "Zaproś domowników",
          body: "W zakładce „Przestrzeń”, pod „Zaproś do listy”, wpisz e-mail i stuknij „Wyślij zaproszenie”. Robi to właściciel przestrzeni albo admin. Druga osoba najpierw instaluje Kangura i zakłada konto na ten sam e-mail, bo zaproszenie otwiera się w aplikacji. Jest ważne 7 dni i tylko dla tego adresu.",
        },
        {
          title: "Dopisujcie po swojemu",
          body: "Ręcznie, ze [[photoList|zrzutu czatu albo zdjęcia kartki]], z [[recipeList|nazwy dania]]. Wszystko ląduje na jednej liście.",
        },
        {
          title: "Idźcie na zakupy",
          body: "Samodzielnie albo we dwójkę, każde ze swoim telefonem. Co jedno włoży do koszyka, drugie po chwili widzi.",
        },
      ],
    },
    {
      kind: "table",
      title: "Co widzi druga osoba",
      caption: "Co robisz Ty i co widzi druga osoba na wspólnej liście",
      head: ["Ty", "Druga osoba"],
      rows: [
        ["dopisujesz masło", "ma je po chwili na otwartej liście, a u góry na moment widać, kto coś dodał"],
        ["zaczynasz zakupy", "dostaje powiadomienie"],
        ["przesuwasz mleko w prawo", "widzi, że jest w koszyku"],
        ["przesuwasz awokado w lewo", "widzi, że go nie było"],
        ["kończysz zakupy", "dostaje powiadomienie, a lista przechodzi do zakończonych"],
      ],
      outro:
        "Powiadomienia o zaproszeniu, początku i końcu zakupów są na start włączone. Każdy rodzaj wyłączysz w ustawieniach.",
    },
    {
      kind: "cards",
      tone: "cream",
      title: "Dla kogo jest wspólna lista",
      columns: 4,
      items: [
        {
          title: "Para",
          body: "Kto pierwszy wychodzi z pracy, ten idzie. Lista czeka u obojga.",
        },
        {
          title: "Rodzina",
          body: "Każdy dopisuje swoje. Chipsy pojawią się na pewno.",
        },
        {
          title: "Współlokatorzy",
          body: "Papier toaletowy przestaje być czyjąś sprawą. Jest pozycją na liście.",
        },
        {
          title: "Rodzice na odległość",
          body: "Osobna przestrzeń, czyli osobne wspólne listy, na ich dom. Oni dopisują u siebie, Ty kupujesz po drodze.",
        },
      ],
    },
    {
      kind: "table",
      title: "Wspólna lista zakupów, kartka czy czat",
      caption: "Porównanie listy na kartce, w czacie i w Kangurze",
      head: ["Sytuacja", "Kartka", "Czat", "Kangur"],
      highlight: true,
      stack: true,
      rows: [
        ["Dopisek w ostatniej chwili", "kartka została na lodówce", "między memami", "jest na liście"],
        ["Co już w koszyku", "wie długopis", "wie pamięć", "widzą wszyscy"],
        ["Kolejność", "jak się przypomniało", "tak samo, tylko w siedmiu wiadomościach", "alejka po alejce"],
        ["Po zakupach", "do kosza", "do przewinięcia", "zostaje w historii"],
      ],
    },
    {
      kind: "fact",
      text: "W 57% domów z co najmniej dwojgiem dorosłych codzienne zakupy robi się wspólnie albo raz robi je jedno, raz drugie.",
      source: "CBOS, lipiec 2026",
      href: "https://www.cbos.pl/PL/publikacje/news_tekst.php?nr=25/2026",
    },
    {
      kind: "faq",
      title: "Pytania o wspólną listę zakupów",
      items: [
        {
          q: "Czy wspólna lista działa między iPhone’em a Androidem?",
          a: "Tak. Masło dopisane na iPhonie czeka na Androidzie. I na odwrót.",
        },
        {
          q: "Czy druga osoba musi zakładać konto?",
          a: "Tak, na adres, na który przyszło zaproszenie, i potrzebuje aplikacji. Dzięki temu lista nie trafi do kogoś przypadkiem. Gdy ktoś idzie za Ciebie tylko raz, wyślij mu listę zwykłą wiadomością, z naszego [[aisleTool|narzędzia do alejek]].",
        },
        {
          q: "Ile osób można zaprosić?",
          a: "Ile chcesz, także bez Premium.",
        },
        {
          q: "Czy druga osoba musi płacić albo mieć Premium?",
          a: "Nie. Wspólne listy są darmowe, a Premium działa dla całej przestrzeni, więc wystarczy jedno na dom. [[pricing|Zobacz cennik]].",
        },
        {
          q: "Czy dostanę powiadomienie o każdym dopisku?",
          a: "Nie. Telefon daje znać o zaproszeniu oraz o początku i końcu zakupów. Dopisek po prostu pojawia się na liście.",
        },
        {
          q: "Czy mogę mieć listę, której domownicy nie widzą?",
          a: "Tak. Listy widać tylko w tej przestrzeni, w której powstały. Załóż drugą przestrzeń bez domowników, na przykład na prezenty.",
        },
        {
          q: "Jak usunąć kogoś ze wspólnej listy?",
          a: "W zakładce „Przestrzeń” właściciel stuka trzy kropki przy osobie i wybiera „Usuń”. Kto woli wyjść po cichu, opuszcza przestrzeń bez pytania. Właściciel może ją tylko usunąć.",
        },
        {
          q: "Czy Kangur podzieli rachunek?",
          a: "Nie, pieniędzy nie liczy. A kto dopisał czwartą czekoladę, ustalicie między sobą.",
        },
        {
          q: "Czy da się używać wspólnej listy online, na komputerze?",
          a: "Nie, Kangur to aplikacja na telefon. W przeglądarce mamy za to darmowe [[aisleTool|narzędzie, które układa listę według alejek]].",
        },
        {
          q: "Co, gdy w sklepie nie ma zasięgu?",
          a: "W trybie zakupów odhaczysz produkty na liście, którą masz już otwartą. Zmiany wyślą się później. Nowe dopiski z domu zobaczysz, gdy wróci zasięg, i wtedy zakończ zakupy.",
        },
      ],
    },
  ],
  related: {
    title: "Skoro już robicie listę razem",
    items: [
      { id: "photoList", label: "Lista zakupów ze zdjęcia", body: "Gdy lista przyszła w wiadomości albo wisi na lodówce." },
      { id: "weekTool", label: "Lista zakupów na tydzień", body: "Ile kupić dla jednej osoby, dla dwóch i dla rodziny." },
      { id: "christmasTool", label: "Lista zakupów na Wigilię i święta", body: "Kto co robi, kto co przynosi i kiedy to kupić." },
    ],
  },
  closing: {
    lines: ["Masło?", "Jest na liście."],
    body: "Zaproś resztę domu. Zaproszenia nic nie kosztują. Na Android i iOS.",
  },
};

export const SHARED_LIST = typesetCopy(copy);

/** Two phones, one list. */
export const SHARED_SCREEN_ALT = typesetCopy(
  "Wspólna lista w Kangurze na dwóch telefonach: te same 10 produktów, od bananów po kawę",
);

/** Where the butter on both phones came from. */
export const SHARED_NOTE = typesetCopy("z tramwaju: masło");

/** The call from the aisle that a shared list saves. */
export const AISLE_CALL: Chat = typesetCopy<Chat>({
  contact: "Dom 🏠",
  status: "aktywność 40 minut temu",
  messages: [
    ["me", "jestem w sklepie, mamy masło?"],
    ["me", "halo"],
    ["me", "biorę na wszelki wypadek"],
    ["them", "są trzy kostki"],
    ["me", "teraz są cztery"],
  ],
});
