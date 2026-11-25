import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista do druku",
  eyebrow: "Lista zakupów do druku w PDF, format A4",
  lines: ["Kartka na lodówkę.", "Magnes masz swój."],
  lead: [
    "Siedem szablonów listy zakupów do wydruku. Dwa mają kategorie w kolejności sklepu, żeby nie wracać trzy razy po masło.",
    "Za darmo i bez maila. Długopis we własnym zakresie.",
  ],
  sections: [
    {
      kind: "steps",
      tone: "mint",
      title: "Jak drukować, żeby starczyło na dłużej",
      intro: "Szablon otworzy się w nowej karcie. Ikona drukarki jest tam na górze.",
      items: [
        { title: "Skala 100%, A4", body: "Szablony mają własny margines. „Dopasuj do strony” tylko je zmniejszy." },
        { title: "Kartka o połowę mniejsza", body: "Pusta lista zmieści się też na A5. W oknie drukowania ustaw skalę 70% albo weź „Dwie na jednej kartce”." },
        { title: "W koszulce wielokrotnie", body: "Gotową listę włóż w foliową koszulkę i zaznaczaj mazakiem do tablic. Ściera się ręką." },
        { title: "Jeden długopis przy kartce", body: "Na sznurku. Wszystkie inne wyjdą z kuchni." },
      ],
    },
    {
      kind: "cards",
      title: "Co wpisać na listę na stałe",
      intro: "Na kartce z lodówki najlepiej działają rzeczy, które kończą się po cichu.",
      columns: 4,
      items: [
        { title: "Kończy się samo", body: "Papier toaletowy, worki, płyn do naczyń, proszek do prania." },
        { title: "Kończy się w weekend", body: "Kawa, mleko do kawy, jajka, coś do chleba." },
        { title: "Nikt nie zauważa", body: "Sól, bułka tarta, folia, gąbki do naczyń." },
        { title: "Zauważają wszyscy", body: "Chipsy. Ale tego pilnuje już cała rodzina." },
      ],
    },
    {
      kind: "fact",
      tone: "tinted",
      text: "W 43% domów na zakupy zawsze albo prawie zawsze chodzi się z listą. Siedem lat wcześniej było to 31%.",
      source: "CBOS, sierpień 2023",
      href: "https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF",
    },
    {
      kind: "text",
      title: "Kartka ma jedną wadę",
      slot: "phone",
      body: [
        "Zostaje na lodówce. Dopisek zrobiony po Twoim wyjściu jest już tylko literaturą.",
        "Gdy to się zdarzy trzeci raz, zrób kartce zdjęcie. Kangur [[photoList|przepisze ją na listę w telefonie]], a ta jest [[sharedList|wspólna dla całego domu]].",
      ],
    },
    {
      kind: "faq",
      tone: "cream",
      title: "Pytania o listy zakupów do druku",
      items: [
        {
          q: "Czy szablony są naprawdę darmowe?",
          a: "Tak, do domu, szkoły i pracy. Nie trzeba podawać maila ani zakładać konta. Prosimy tylko nie sprzedawać ich dalej.",
        },
        {
          q: "Dokąd prowadzi kod na dole kartki?",
          a: "Do Kangura w Google Play albo App Store, przez getkangur.com/pobierz. Kartka działa bez niego, można go odciąć.",
        },
        {
          q: "Czy mogę zmienić produkty na gotowej liście?",
          a: "W PDF zostawiliśmy puste linie. Własną listę ułożysz i wydrukujesz w [[aisleTool|narzędziu do alejek]].",
        },
        {
          q: "Czy jest wersja do edycji, w Wordzie albo Excelu?",
          a: "Nie. Swoją listę wpiszesz w [[aisleTool|narzędziu do alejek]] i wydrukujesz jako kartkę.",
        },
        {
          q: "Jak wydrukować z telefonu?",
          a: "Otwórz PDF i wybierz drukowanie w menu udostępniania. Bez drukarki wyślij plik do siebie i wydrukuj w punkcie ksero.",
        },
        {
          q: "Jaki to format?",
          a: "PDF, A4. Ciemny tekst bez tła, małe ikonki kategorii i jeden Kangur. Drukarka to przeżyje. Duże litery zajmują dwie kartki, reszta jedną.",
        },
        {
          q: "Czy jest lista zakupów na święta do druku?",
          a: "Tak, na Wigilię i święta dla 8 osób. Dla innej liczby gości wydrukuj listę z [[guideChristmas|kalkulatora świątecznego]].",
        },
      ],
    },
  ],
  related: {
    title: "Policz, zanim wydrukujesz",
    items: [
      { id: "guideChristmas", label: "Lista zakupów na Wigilię i święta", body: "Od 1 do 30 gości, z podziałem na terminy." },
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
    short: "Pusta",
    title: "Pusta lista zakupów z kategoriami",
    body: "Czternaście alejek i po cztery linijki w każdej. Jest też miejsce na podpis osoby, która dopisała chipsy.",
    button: "Drukuj pustą listę",
    alt: "Pusta lista zakupów do druku z podziałem na kategorie, A4",
  },
  {
    id: "gotowa",
    short: "Gotowa",
    title: "Gotowa lista zakupów z produktami",
    body: "Ponad sto produktów z katalogu Kangura w kolejności sklepu. Zaznaczasz tylko to, czego brakuje.",
    button: "Drukuj gotową listę",
    alt: "Gotowa lista zakupów do druku z produktami w kategoriach, A4",
  },
  {
    id: "duze",
    short: "Duże litery",
    title: "Gotowa, duże litery",
    body: "Te same produkty na dwóch kartkach. Okulary mogą zostać w kieszeni.",
    button: "Drukuj duże litery",
    alt: "Gotowa lista zakupów do druku dużymi literami, dwie kartki A4",
  },
  {
    id: "dwie",
    short: "Dwie na kartce",
    title: "Dwie na jednej kartce",
    body: "Przetnij na pół. Jedna idzie do sklepu, druga czeka na lodówce.",
    button: "Drukuj dwie listy",
    alt: "Dwie puste listy zakupów do druku na jednej kartce A4, do przecięcia",
  },
  {
    id: "ceny",
    short: "Z ceną",
    title: "Lista zakupów z ceną i sumą",
    body: "Kolumna na ceny i miejsce na wynik. Długopis liczy, kalkulator sprawdza.",
    button: "Drukuj listę z ceną",
    alt: "Lista zakupów do druku z miejscem na ilość, cenę i sumę, A4",
  },
  {
    id: "tydzien",
    short: "Na tydzień",
    title: "Lista zakupów na tydzień, z obiadami",
    body: "Siedem obiadów, duże zakupy, dokupka i rzeczy, które warto sprawdzić w szafce.",
    button: "Drukuj listę na tydzień",
    alt: "Lista zakupów na tydzień do druku z planem siedmiu obiadów, A4",
  },
  {
    id: "wigilia",
    short: "Na Wigilię",
    title: "Lista zakupów na Wigilię, dla 8 osób",
    body: "Dwanaście dań, śniadania do 27 i obiady do 26 grudnia, w trzech terminach zakupów. Z miejscem na to, kto co przynosi.",
    button: "Drukuj listę wigilijną",
    alt: "Lista zakupów na Wigilię i święta do druku, dla 8 osób, A4",
  },
] as const);
