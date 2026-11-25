import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Podział listy na kategorie",
  eyebrow: "Lista zakupów z podziałem na kategorie",
  lines: ["Wklej bałagan.", "Wyjmij alejki."],
  lead: [
    "Wklej listę z wiadomości albo notatki, a narzędzie podzieli ją na alejki: od owoców po sprzątanie. Kolejność ustawisz jak w swoim sklepie.",
    "Działa w przeglądarce, bez konta i bez AI. Lista nie opuszcza Twojego urządzenia.",
  ],
  sections: [
    {
      kind: "steps",
      tone: "mint",
      title: "Jak z tego korzystać",
      items: [
        {
          title: "Wklej, jak leci",
          body: "Po przecinku, w linijkach, z myślnikami. Ilości zostaną przy produktach.",
        },
        {
          title: "Popraw, co poszło obok",
          body: "Przy produkcie wybierasz inną alejkę. Na tym urządzeniu narzędzie to zapamięta.",
        },
        {
          title: "Ustaw swoją kolejność",
          body: "Strzałkami przy alejkach. Nabiał na końcu, jeśli w Twoim sklepie stoi na końcu.",
        },
        {
          title: "Weź listę ze sobą",
          body: "Skopiuj, wyślij albo wydrukuj. Możesz też odhaczać tutaj, w telefonie.",
        },
      ],
    },
    {
      kind: "custom",
      slot: "aisles",
      title: "24 alejki i co w nich jest",
      intro:
        "Ten sam podział ma aplikacja Kangur. Kategorie pochodzą z naszego katalogu, w którym jest 273 produktów.",
    },
    {
      kind: "text",
      tone: "cream",
      title: "Czego to narzędzie nie umie",
      slot: "phone",
      body: [
        "Zna słowa, a nie sens. „Krem” wyśle do kosmetyków, nawet jeśli miał być do ciasta. Zrzutu ekranu nie przeczyta, a druga osoba nie zobaczy Twojej listy.",
        "To wszystko robi aplikacja: [[photoList|czyta zrzut czatu i zdjęcie kartki]], [[sharedList|dzieli listę z domownikami]], a w sklepie prowadzi alejka po alejce i pozwala odhaczać kciukiem.",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o narzędzie",
      items: [
        {
          q: "Czy moja lista jest gdzieś wysyłana?",
          a: "Nie. Narzędzie działa w przeglądarce, a lista zapisuje się tylko na tym urządzeniu. „Wyczyść” usuwa ją także stamtąd.",
        },
        {
          q: "Skąd wiadomo, co do której alejki?",
          a: "Ze słownika: 273 produktów z katalogu Kangura i kilkuset potocznych nazw. Czego w nim nie ma, trafia do „Inne”, a Ty wybierasz alejkę.",
        },
        {
          q: "Czy mogę przenieść tę listę do Kangura?",
          a: "Tak. Skopiuj ją i w aplikacji wybierz „Tekst ze schowka”. To jedno użycie AI.",
        },
        {
          q: "Czy da się ją wydrukować?",
          a: "Tak, przyciskiem „Drukuj”. Na papierze zostają same alejki i kratki. Puste kartki są w poradniku [[guidePrint|Lista zakupów do druku]].",
        },
      ],
    },
  ],
  related: {
    title: "Z czym to połączyć",
    items: [
      { id: "guidePrint", label: "Lista zakupów do druku", body: "Puste kartki A4 z alejkami, na lodówkę." },
      { id: "guideChristmas", label: "Lista zakupów na Wigilię i święta", body: "Policzy produkty na liczbę gości i podzieli je na alejki." },
      { id: "sharedList", label: "Wspólna lista zakupów", body: "Ta sama lista u wszystkich domowników." },
    ],
  },
  closing: {
    lines: ["Alejka po alejce.", "Kciuk wystarczy."],
    body: "W Kangurze ta lista jest wspólna. Na Android i iOS.",
  },
};

export const AISLE_TOOL = typesetCopy(copy);

/** The same conversation as on the home page, in one go. */
export const AISLE_SAMPLE =
  "mleko, jajka 10 szt, pomidory, papier toaletowy, ser żółty, chleb, masło, kurczak 1kg, płyn do naczyń, banany, makaron, cebula, passata 2x, jogurt naturalny, ziemniaki, czosnek, szynka, kawa, ogórki, karma dla pieska, 2 paczki chipsów, aaa i proszek do prania";
