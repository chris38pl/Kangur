import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista do druku",
  eyebrow: "Lista zakupów do druku w PDF, format A4",
  lines: ["Kartka na lodówkę.", "Magnes masz swój."],
  lead: [
    "Cztery wzory listy zakupów do druku. Z alejkami w kolejności sklepu, żeby nie wracać trzy razy po masło.",
    "Za darmo, bez maila i bez rejestracji. Klikasz i drukujesz.",
  ],
  sections: [
    {
      kind: "steps",
      tone: "mint",
      title: "Jak drukować, żeby starczyło na dłużej",
      items: [
        { title: "Skala 100%, A4", body: "Wzory mają własny margines. „Dopasuj do strony” tylko je zmniejszy." },
        { title: "Dwie strony na kartce", body: "Pusta lista mieści się też na A5. W oknie drukowania wybierz „2 strony na arkuszu”." },
        { title: "W koszulce wielokrotnie", body: "Gotową listę włóż w foliową koszulkę i zaznaczaj mazakiem do tablic. Ściera się ręką." },
        { title: "Jeden długopis przy kartce", body: "Na sznurku. Wszystkie inne wyjdą z kuchni." },
      ],
    },
    {
      kind: "cards",
      title: "Co wpisać na stałe",
      intro: "Na kartce z lodówki najlepiej działają rzeczy, które kończą się po cichu.",
      columns: 4,
      items: [
        { title: "Kończy się samo", body: "Papier toaletowy, worki, płyn do naczyń, proszek do prania." },
        { title: "Kończy się w weekend", body: "Kawa, mleko do kawy, jajka, coś do chleba." },
        { title: "Nikt nie zauważa", body: "Sól, bułka tarta, folia, tabletki do zmywarki." },
        { title: "Zauważają wszyscy", body: "Chipsy. Ale tego pilnuje już cała rodzina." },
      ],
    },
    {
      kind: "fact",
      tone: "tinted",
      text: "Z listą na zakupy zawsze chodzi 43% badanych, a siedem lat wcześniej było to 31%.",
      source: "CBOS, komunikat 126/2023",
      href: "https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF",
    },
    {
      kind: "text",
      title: "Kartka ma jedną wadę",
      slot: "phone",
      body: [
        "Zostaje na lodówce. Dopisek zrobiony po Twoim wyjściu jest już tylko literaturą.",
        "Gdy to się zdarzy trzeci raz, zrób kartce zdjęcie. Kangur [[photoList|przepisze ją na listę w telefonie]], a ta jest [[sharedList|wspólna dla całego domu]]. Kod na dole każdego wzoru prowadzi do sklepu z aplikacjami w Twoim telefonie.",
      ],
    },
    {
      kind: "faq",
      tone: "cream",
      title: "Pytania o listy do druku",
      items: [
        {
          q: "Czy wzory są naprawdę darmowe?",
          a: "Tak, do domu, szkoły i pracy. Nie trzeba podawać maila ani zakładać konta. Prosimy tylko nie sprzedawać ich dalej.",
        },
        {
          q: "Czy mogę zmienić produkty na gotowej liście?",
          a: "W PDF zostawiliśmy puste linie w każdej alejce. Własną listę ułożysz i wydrukujesz w [[aisleTool|narzędziu do alejek]].",
        },
        {
          q: "Jaki to format?",
          a: "PDF, A4, pionowo, jedna strona. Czarny tekst, bez tła, żeby nie zjadać tuszu.",
        },
        {
          q: "Czy jest lista na Wigilię?",
          a: "Tak, na 8 osób. Dla innej liczby gości wydrukuj listę z [[guideChristmas|kalkulatora świątecznego]].",
        },
      ],
    },
  ],
  related: {
    title: "Policz, zanim wydrukujesz",
    items: [
      { id: "guideChristmas", label: "Lista zakupów na Wigilię i święta", body: "Na dowolną liczbę gości, z podziałem na terminy." },
      { id: "guideWeek", label: "Lista zakupów na tydzień", body: "Dla jednej osoby, dwóch i rodziny." },
      { id: "aisleTool", label: "Podział listy na alejki", body: "Wklejasz swoją listę, drukujesz alejki." },
    ],
  },
  closing: {
    lines: ["Kartka jest dobra.", "Dopóki nie zostanie w domu."],
    body: "Lista w telefonie wychodzi z Tobą. Kangur na Android i iOS.",
  },
};

export const GUIDE_PRINT = typesetCopy(copy);

/** Files: .marketing/06-seo/druk/build-pdf.mts. */
export const PRINT_SHEETS = typesetCopy([
  {
    id: "alejki",
    title: "Pusta, z alejkami",
    body: "Czternaście alejek i po cztery linijki w każdej. Jest też miejsce na podpis osoby, która dopisała chipsy.",
    button: "Drukuj pustą listę",
  },
  {
    id: "gotowa",
    title: "Gotowa, z produktami",
    body: "Ponad sto produktów z katalogu Kangura w kolejności sklepu. Zaznaczasz tylko to, czego brakuje.",
    button: "Drukuj gotową listę",
  },
  {
    id: "tydzien",
    title: "Na tydzień, z obiadami",
    body: "Siedem obiadów, duże zakupy, dokupka i rzeczy, które warto sprawdzić w szafce.",
    button: "Drukuj listę na tydzień",
  },
  {
    id: "wigilia",
    title: "Na Wigilię, dla 8 osób",
    body: "Dwanaście dań i trzy następne dni, w trzech terminach zakupów. Z miejscem na to, kto co przynosi.",
    button: "Drukuj listę wigilijną",
  },
] as const);
