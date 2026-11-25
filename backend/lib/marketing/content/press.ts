import type { Lines } from "@/lib/marketing/content/home-types";
import { CHRISTMAS } from "@/lib/marketing/lists/christmas";
import { typesetCopy } from "@/lib/marketing/typography";

type Idea = {
  title: string;
  body: string;
  source: string;
  /** Last day it makes sense. */
  until?: string;
};

const COPY = {
  crumb: "Dla mediów",
  eyebrow: "Dla mediów i twórców",
  lines: ["Wszystko o Kangurze", "na jednej półce."] as Lines,
  lead: [
    "Opisy, fakty i grafiki do tekstów o Kangurze. Po resztę napisz na [[mailto:contact@getkangur.com|contact@getkangur.com]], odpowiada twórca aplikacji.",
  ],
  short: {
    title: "Kangur w jednym zdaniu",
    text: "Kangur to polska aplikacja na iPhone’a i Androida, która zamienia zrzut czatu, zdjęcie kartki albo nazwę dania w listę zakupów ułożoną według alejek.",
  },
  long: {
    title: "Kangur w czterech zdaniach",
    text: "Kangur to polska aplikacja na iPhone’a i Androida, która zamienia zrzut czatu, zdjęcie kartki albo nazwę dania w listę zakupów ułożoną według alejek. Lista jest wspólna dla domowników, a w sklepie produkty przesuwa się palcem: w prawo kupione, w lewo nie było. Listy są darmowe i bez reklam, na start jest 10 użyć AI, a Premium z AI bez limitu kosztuje 9,99 zł miesięcznie za całą przestrzeń. Aplikację robi w Poznaniu jednoosobowa firma Krzysztof Krawiec Software.",
  },
  factsTitle: "Fakty",
  facts: [
    { term: "Nazwa", value: "Kangur. Z dopiskiem: Kangur, lista zakupów z AI" },
    { term: "Odmiana", value: "Kangura, w Kangurze, z Kangurem" },
    { term: "Platformy", value: "iPhone i telefony z Androidem" },
    { term: "Języki", value: "10: polski, angielski, niemiecki, rosyjski, ukraiński, francuski, hiszpański, włoski, czeski, białoruski" },
    { term: "W sklepach", value: "[[https://play.google.com/store/apps/details?id=app.kangur|Google Play]] od września 2026, [[https://apps.apple.com/pl/app/kangur/id6832296080|App Store]] od listopada 2026" },
    { term: "Cena", value: "za darmo z 10 użyciami AI, Premium 9,99 zł miesięcznie za całą przestrzeń, dla nowych subskrybentów pierwszy miesiąc 0 zł. [[pricing|Cennik]]" },
    { term: "Reklamy", value: "nie ma" },
    { term: "Twórca", value: "Krzysztof Krawiec, jednoosobowa firma Krzysztof Krawiec Software, Poznań" },
    { term: "Początek prac", value: "16 lipca 2026. [[about|Kalendarz]]" },
  ],
  nameTitle: "Uwaga na imię",
  name: [
    "Kangurów jest kilka: konkurs matematyczny, siłownia i program na komputer z ostrzeżenia policji z 2025 roku. Nie mamy z nimi związku. Nasz Kangur to aplikacja na telefon, powstał w 2026 roku i robi tylko listy zakupów. [[safety|Jak nas rozpoznać]].",
  ],
  ideasTitle: "Pomysły na tekst",
  ideas: [
    {
      title: "Cztery dni bez sklepów",
      body: "Od 24 do 27 grudnia 2026 duże sklepy będą zamknięte cztery dni z rzędu, pierwszy raz, odkąd Wigilia jest wolna. [[guideChristmas|Darmowy kalkulator]] liczy zakupy na tyle osób, ile siada do stołu, dzieli je na trzy terminy i układa wiadomość, kto co przynosi. Liczby można cytować, z linkiem.",
      source: "[[https://zielonalinia.gov.pl/niedziele-handlowe-w-2026-r/|Zielona Linia]], [[https://www.money.pl/gospodarka/cztery-dni-bez-zakupow-w-duzych-sklepach-grudzien-z-handlowa-przerwa-7347071442889152a.html|Money.pl]]",
      until: CHRISTMAS.strip,
    },
    {
      title: "Coraz więcej domów chodzi z listą",
      body: "W 2023 roku w 43% domów na zakupy zawsze albo prawie zawsze chodziło się z listą, siedem lat wcześniej w 31%. W 57% domów z co najmniej dwojgiem dorosłych codzienne zakupy robi się wspólnie albo raz robi je jedno, raz drugie (2026).",
      source: "[[https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF|CBOS 126/2023]], [[https://www.cbos.pl/PL/publikacje/news_tekst.php?nr=25/2026|CBOS News 25/2026]]",
    },
    {
      title: "Kupujemy na zapas i wyrzucamy",
      body: "W co czwartym domu część zakupów zrobionych z góry, na przykład na tydzień, czasami albo zawsze psuje się, zanim ktoś ją zje. Po świętach część przygotowanych dań zawsze albo czasami wyrzuca 22% domów. Listy robimy częściej niż w 2016 roku, a wyrzucamy więcej.",
      source: "[[https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF|CBOS 126/2023]]",
    },
    {
      title: "Jedna osoba, dziesięć języków, cztery miesiące",
      body: "Od pierwszego opisu pomysłu do obu sklepów. Chętnie opowiemy, co poszło gładko, co trzy razy od nowa i gdzie AI wciąż myli się przy kartce z lodówki.",
      source: "",
    },
  ] as Idea[],
  filesTitle: "Grafiki do pobrania",
  filesIntro:
    "Można ich użyć w tekstach i filmach o Kangurze. Prosimy nie przerysowywać kangura i nie dopisywać niczego na ekranach aplikacji.",
  contactTitle: "Kontakt",
  contact: "[[mailto:contact@getkangur.com|contact@getkangur.com]], odpowiedź zwykle w ciągu dwóch dni. Wywiad, konto testowe albo zrzut ekranu na zamówienie: da się zrobić.",
  closing: {
    lines: ["Lista przyszła na czacie?", "Screen i po krzyku."] as Lines,
    body: "Kangura najłatwiej zrozumieć na własnej liście.",
  },
};

export const PRESS = typesetCopy(COPY);

export const PRESS_FILES = [
  { file: "/press/kangur-ikona-1024.png", label: "Ikona", info: "PNG, 1024 × 1024" },
  { file: "/press/kangur-postac.png", label: "Kangur, przezroczyste tło", info: "PNG, 900 × 1540" },
  { file: "/press/kangur-grafika.jpg", label: "Grafika szeroka", info: "JPG, 1920 × 823" },
  { file: "/press/kangur-ekran-lista.png", label: "Ekran: lista ze zrzutu czatu", info: "PNG, 1206 × 2622" },
  { file: "/press/kangur-ekran-tryb-zakupow.png", label: "Ekran: tryb zakupów", info: "PNG, 1206 × 2622" },
  { file: "/press/kangur-ekran-z-przepisu.png", label: "Ekran: składniki z dania", info: "PNG, 1206 × 2622" },
  { file: "/press/kangur-ekran-podsumowanie.png", label: "Ekran: podsumowanie zakupów", info: "PNG, 1206 × 2622" },
  { file: "/press/kangur-kalkulator-wigilia.png", label: "Strona: kalkulator na Wigilię", info: "PNG, 2400 × 1800" },
] as const;
