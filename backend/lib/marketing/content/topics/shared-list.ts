import type { Chat } from "@/components/site/ChatCard";
import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Wspólna lista zakupów",
  eyebrow: "Wspólna lista zakupów na iPhone’a i Androida",
  lines: ["Dwie osoby w sklepie.", "Jedno masło w koszyku."],
  lead: [
    "Wspólna lista w Kangurze jest jedna dla całego domu. Każdy dopisuje i odhacza ze swojego telefonu, a reszta widzi to po chwili.",
    "Zapraszasz e-mailem tyle osób, ile chcesz. Zaproszenia nic nie kosztują, a reklam nie ma.",
  ],
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
          body: "„Zaproś do listy”, wpisujesz e-mail i gotowe. Zaproszenie działa 7 dni i tylko dla tego adresu.",
        },
        {
          title: "Dopisujcie po swojemu",
          body: "Ręcznie, ze [[photoList|zrzutu czatu albo kartki]], z [[recipeList|nazwy dania]]. Wszystko ląduje na jednej liście.",
        },
        {
          title: "Idźcie na zakupy",
          body: "Samodzielnie albo we dwoje, każde ze swoim telefonem. Drugie mleko do koszyka już nie trafi.",
        },
      ],
    },
    {
      kind: "table",
      title: "Co widzi druga osoba",
      caption: "Co robisz Ty i co widzi druga osoba na wspólnej liście",
      head: ["Ty", "Druga osoba"],
      rows: [
        ["dopisujesz masło", "ma je po chwili na otwartej liście, z informacją, kto dodał"],
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
          body: "Osobna przestrzeń na ich dom. Oni dopisują u siebie, Ty kupujesz po drodze.",
        },
      ],
    },
    {
      kind: "table",
      title: "Kartka, czat, wspólna lista",
      caption: "Porównanie listy na kartce, w czacie i w Kangurze",
      head: ["", "Kartka", "Czat", "Kangur"],
      highlight: true,
      rows: [
        ["Dopisek w ostatniej chwili", "kartka została na lodówce", "nowa wiadomość, między memami", "pojawia się na liście"],
        ["Co już w koszyku", "zależy od długopisu", "zależy od pamięci", "widać u każdego"],
        ["Kolejność", "tak, jak się przypomniało", "tak samo, tylko w siedmiu wiadomościach", "alejka po alejce"],
        ["Po zakupach", "do kosza", "do przewinięcia", "podsumowanie i historia"],
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
      title: "Pytania o wspólną listę",
      items: [
        {
          q: "Czy wspólna lista działa między iPhone’em a Androidem?",
          a: "Tak. Wszyscy widzą tę samą listę, nieważne, kto ma jaki telefon.",
        },
        {
          q: "Ile osób może korzystać z jednej listy?",
          a: "Ile chcesz, także bez Premium.",
        },
        {
          q: "Czy druga osoba musi płacić albo mieć Premium?",
          a: "Nie. Wspólne listy są darmowe, a Premium działa dla całej przestrzeni, więc wystarczy jedno na dom. [[pricing|Zobacz cennik]].",
        },
        {
          q: "Czy mogę mieć listę, której domownicy nie widzą?",
          a: "Tak. Listy widać tylko w tej przestrzeni, w której powstały. Załóż drugą przestrzeń bez domowników, na przykład na prezenty.",
        },
        {
          q: "Czy da się używać wspólnej listy online, na komputerze?",
          a: "Nie, Kangur to aplikacja na telefon. W przeglądarce mamy za to darmowe [[aisleTool|narzędzie, które układa listę według alejek]].",
        },
        {
          q: "Co, gdy w sklepie nie ma zasięgu?",
          a: "W trybie zakupów odhaczysz i dopiszesz produkty na liście, którą masz już otwartą. Zmiany wyślą się później, a nowe dopiski z domu zobaczysz, gdy wróci zasięg.",
        },
      ],
    },
  ],
  related: {
    title: "Skoro już robicie listę razem",
    items: [
      { id: "photoList", label: "Lista zakupów ze zdjęcia", body: "Gdy lista przyszła w wiadomości albo wisi na lodówce." },
      { id: "guideWeek", label: "Lista zakupów na tydzień", body: "Ile kupić dla jednej osoby, dla dwóch i dla rodziny." },
      { id: "guideChristmas", label: "Lista zakupów na Wigilię i święta", body: "Kto co robi, kto co przynosi i kiedy to kupić." },
    ],
  },
  closing: {
    lines: ["Masło?", "Jest na liście."],
    body: "Kangur - lista zakupów z AI. Dostępny na Android i iOS.",
  },
};

export const SHARED_LIST = typesetCopy(copy);

/** The call from the aisle that a shared list saves. */
export const AISLE_CALL: Chat = typesetCopy<Chat>({
  contact: "Dom 🏠",
  status: "była aktywność 40 minut temu",
  messages: [
    ["me", "jestem w sklepie, mamy masło?"],
    ["me", "halo"],
    ["me", "biorę na wszelki wypadek"],
    ["them", "są trzy kostki"],
    ["me", "teraz są cztery"],
  ],
});
