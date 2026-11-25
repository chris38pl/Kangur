import type { Lines } from "@/lib/marketing/content/home-types";
import { typesetCopy } from "@/lib/marketing/typography";

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
    text: "Kangur to polska aplikacja na iPhone’a i Androida, która zamienia zrzut czatu, zdjęcie kartki albo nazwę dania w listę zakupów ułożoną według alejek. Lista jest wspólna dla domowników, a w sklepie produkty przesuwa się palcem: w prawo kupione, w lewo nie było. Aplikacja jest darmowa i nie ma reklam, a Premium z AI bez limitu kosztuje 9,99 zł miesięcznie za cały dom. Robi ją w Poznaniu jednoosobowa firma Krzysztof Krawiec Software.",
  },
  factsTitle: "Fakty",
  facts: [
    { term: "Nazwa", value: "Kangur. Z dopiskiem: Kangur, lista zakupów z AI" },
    { term: "Odmiana", value: "Kangura, w Kangurze, z Kangurem" },
    { term: "Platformy", value: "iPhone i telefony z Androidem. Wersji na komputer nie ma" },
    { term: "Języki", value: "10: polski, angielski, niemiecki, rosyjski, ukraiński, francuski, hiszpański, włoski, czeski, białoruski" },
    { term: "W sklepach", value: "od listopada 2026: [[https://play.google.com/store/apps/details?id=app.kangur|Google Play]] i [[https://apps.apple.com/pl/app/kangur/id6832296080|App Store]]" },
    { term: "Cena", value: "za darmo, Premium 9,99 zł miesięcznie za całą przestrzeń, pierwszy miesiąc 0 zł. [[pricing|Cennik]]" },
    { term: "Reklamy", value: "nie ma" },
    { term: "Twórca", value: "Krzysztof Krawiec, jednoosobowa firma Krzysztof Krawiec Software, Poznań" },
    { term: "Początek prac", value: "16 lipca 2026. [[about|Kalendarz]]" },
  ],
  nameTitle: "Uwaga na imię",
  name: [
    "W czerwcu 2025 media i policja pisały o oszustwie, w którym użyto programu na komputer nazwanego „Kangur”. To nie ta aplikacja: nasz Kangur powstał rok później, działa tylko na telefonach i robi tylko listy zakupów.",
    "Jeśli piszesz o tamtej sprawie, prosimy o jedno zdanie: „Program nie ma związku z aplikacją Kangur do list zakupów”. [[safety|Jak nas rozpoznać]].",
  ],
  ideasTitle: "Pomysły na tekst",
  ideas: [
    {
      title: "Lista przeniosła się do czatu",
      body: "Z listą na zakupy zawsze chodzi 43% domów, siedem lat wcześniej było 31%. A w 57% domów z co najmniej dwojgiem dorosłych codzienne zakupy robi się razem albo raz jedno, raz drugie. Stąd lista w wiadomościach i skakanie między czatem a półką.",
      source: "[[https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF|CBOS 126/2023]], [[https://www.cbos.pl/PL/publikacje/news_tekst.php?nr=25/2026|CBOS News 25/2026]]",
    },
    {
      title: "Kupujemy na zapas i wyrzucamy",
      body: "W co czwartym domu zdarza się, że zakupy na tydzień z góry psują się, zanim ktoś je zje. Po świętach jedzenie zawsze albo czasami wyrzuca 22% domów. Dobra lista jest krótsza niż ta z głowy.",
      source: "[[https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF|CBOS 126/2023]]",
    },
    {
      title: "Jedna osoba, dziesięć języków, cztery miesiące",
      body: "Od pierwszego opisu pomysłu do obu sklepów. Chętnie opowiemy, co poszło gładko, a co trzy razy od nowa, także o tym, gdzie AI wciąż myli się przy kartce z lodówki.",
      source: "",
    },
  ],
  filesTitle: "Grafiki do pobrania",
  filesIntro:
    "Można ich użyć w tekstach i filmach o Kangurze. Prosimy nie przerysowywać kangura i nie dopisywać niczego na ekranach aplikacji.",
  contactTitle: "Kontakt",
  contact: "[[mailto:contact@getkangur.com|contact@getkangur.com]], zwykle w ciągu 24-48 godzin. Wywiad, konto testowe albo własny zrzut ekranu to nie problem.",
  closing: {
    lines: ["Lista przyszła na czacie?", "Screen i po krzyku."] as Lines,
    body: "Najszybciej zrozumieć Kangura na własnej liście.",
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
] as const;
