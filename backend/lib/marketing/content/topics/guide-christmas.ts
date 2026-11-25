import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Wigilia i święta",
  eyebrow: "Lista zakupów na Wigilię i święta 2026",
  lines: ["Dwanaście dań.", "Cztery dni bez sklepu."],
  lead: [
    "Ustaw liczbę gości i dania, a kalkulator policzy zakupy na Wigilię i trzy następne dni. Od czwartku 24 do niedzieli 27 grudnia duże sklepy są zamknięte.",
    "Listę skopiujesz, wydrukujesz albo podzielisz między rodzinę. Za darmo i bez podawania maila.",
  ],
  sections: [
    {
      kind: "table",
      tone: "cream",
      title: "Kiedy co kupić",
      intro:
        "Niedziele handlowe w grudniu 2026 to 6, 13 i 20. Potem zostaje środa 23 grudnia.",
      caption: "Terminy zakupów przed świętami 2026",
      head: ["Kiedy", "Co", "Dlaczego wtedy"],
      rows: [
        ["Do 13 grudnia", "mąka, mak, bakalie, susz, grzyby, przyprawy, opłatek, świece", "Poczeka w szafce, a pod koniec bywa wykupione"],
        ["19 i 20 grudnia", "warzywa, kapusta, śledzie, jajka, masło, napoje", "Ostatni weekend z niedzielą handlową"],
        ["22 i 23 grudnia", "karp, śmietana, wędlina, pieczywo, pomidory", "Świeże. Lodówka i tak już protestuje"],
        ["24-27 grudnia", "nic", "Wigilia jest wolna od pracy, potem dwa dni świąt i niedziela niehandlowa"],
      ],
      outro:
        "Stan na 25 listopada 2026. Źródła: [[https://zielonalinia.gov.pl/niedziele-handlowe-w-2026-r/|Zielona Linia]], [[https://www.money.pl/gospodarka/cztery-dni-bez-zakupow-w-duzych-sklepach-grudzien-z-handlowa-przerwa-7347071442889152a.html|Money.pl]].",
    },
    {
      kind: "text",
      title: "Dwanaście prób, nie dwanaście obiadów",
      slot: "kangur",
      body: [
        "Kalkulator liczy małe porcje. Dwadzieścia deko karpia na osobę, bo obok stoi jedenaście innych dań i ktoś na pewno pilnuje, czy próbujesz każdego.",
        "Jeśli u Was wszyscy biorą dokładkę pierogów, dodaj jedną osobę. Jeśli ciocia zawsze przywozi drugi makowiec, ustaw przy nim „Ktoś przynosi”.",
      ],
    },
    {
      kind: "cards",
      tone: "mint",
      title: "Kto co robi",
      intro: "Przy danich z „Ktoś przynosi” kalkulator sam ułoży wiadomość do rodziny.",
      columns: 4,
      items: [
        { title: "Gospodarze: gorące", body: "Barszcz, karp i kapusta nie lubią podróży." },
        { title: "Goście: zimne", body: "Śledź, sałatka, makowiec. Jadą w bagażniku i nic im nie jest." },
        { title: "Dzieci: pierniczki", body: "Dwa tygodnie wcześniej. Zdążą zmięknąć, o ile dotrwają." },
        { title: "Jedna osoba: drobiazgi", body: "Opłatek, sianko, świece, zapałki. Tylko to, ale na pewno." },
      ],
    },
    {
      kind: "steps",
      title: "Co zrobić wcześniej",
      intro: "Żeby 24 grudnia smażyć karpia, a nie wszystko naraz.",
      items: [
        { title: "Początek grudnia: pierniczki", body: "Po upieczeniu są twarde. Miękną w puszce, im dłużej, tym lepiej." },
        { title: "Około 13 grudnia: uszka i pierogi", body: "Zamroź na tacy, potem przesyp do woreczka. Nie skleją się." },
        { title: "Około 17 grudnia: zakwas na barszcz", body: "Domowy potrzebuje kilku dni. Kupny może poczekać na weekend." },
        { title: "21 i 22 grudnia: śledzie", body: "Dwa dni z cebulą robią im dobrze." },
        { title: "23 grudnia: sałatka, kapusta, kompot", body: "Następnego dnia smakują lepiej niż w dniu gotowania." },
        { title: "24 grudnia: karp, barszcz, nakrycie", body: "I to wszystko. Taki był plan." },
      ],
    },
    {
      kind: "fact",
      tone: "tinted",
      text: "Po świętach w 22% domów zawsze albo czasami wyrzuca się część przygotowanych i niezjedzonych dań, na przykład sałatki. W kolejnych 35% rzadko.",
      source: "CBOS, sierpień 2023",
      href: "https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF",
    },
    {
      kind: "cards",
      title: "Żeby nic nie wyrzucić",
      columns: 4,
      items: [
        { title: "Pojemniki przed kolacją", body: "Goście wychodzą z pierogami, a lodówka się domyka." },
        { title: "Chleb do zamrażarki", body: "Krojony. Rano wyjmujesz tyle kromek, ile osób wstało." },
        { title: "27 grudnia: resztki", body: "Barszcz w kubku, pierogi z patelni, sałatka na kanapce." },
        { title: "Najpierw szafka", body: "Trzeci majeranek już tam stoi. Odhacz go na liście i nie kupuj." },
      ],
    },
    {
      kind: "text",
      tone: "cream",
      title: "Ta lista na kilku telefonach",
      slot: "phones",
      body: [
        "Skopiuj listę i w Kangurze wybierz „Tekst ze schowka”. To jedno z dziesięciu darmowych użyć AI. Potem zaproś rodzinę, zaproszenia nic nie kosztują.",
        "Jedna osoba bierze warzywa, druga stoi po rybę. Na liście widać, co już w koszyku, więc karp wróci do domu jeden. [[sharedList|Jak działa wspólna lista]].",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o świąteczne zakupy",
      items: [
        {
          q: "Czy 24 grudnia 2026 sklepy są otwarte?",
          a: "Duże sklepy nie. Od 2025 roku Wigilia jest dniem wolnym od pracy. Zakaz handlu ma wyjątki, na przykład stacje paliw i apteki, ale karpia lepiej tam nie szukać.",
        },
        {
          q: "Które niedziele grudnia 2026 są handlowe?",
          a: "6, 13 i 20 grudnia. Niedziela 27 grudnia, zaraz po świętach, jest niehandlowa.",
        },
        {
          q: "Ile karpia na osobę?",
          a: "Kalkulator przyjmuje 20 dag, bo przy dwunastu daniach każdego zjada się po trochu. Gdy karp jest głównym daniem, policz 30 dag.",
        },
        {
          q: "Jakie są potrawy wigilijne?",
          a: "Zależy od domu i regionu. Zaczynamy od barszczu z uszkami, karpia, dwóch śledzi, pierogów, kapusty z grochem, ryby po grecku, sałatki, kompotu z suszu, kutii i makowca. Siedem innych dodasz z listy.",
        },
        {
          q: "Czy musi być dokładnie dwanaście?",
          a: "Nie. W wielu domach liczy się też kompot, w niektórych chleb, a w niektórych nikt nie liczy.",
        },
        {
          q: "Czy lista się zapisuje?",
          a: "Tak, tylko w tej przeglądarce. Nic nie wysyłamy. „Zacznij od nowa” kasuje wszystko.",
        },
      ],
    },
  ],
  related: {
    title: "Przyda się jeszcze",
    items: [
      { id: "guidePrint", label: "Lista zakupów do druku", body: "Gotowe kartki A4, jest też wigilijna." },
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Danie spoza kalkulatora? Kangur zaproponuje składniki." },
      { id: "sharedList", label: "Wspólna lista zakupów", body: "Jedna lista u wszystkich, którzy coś przynoszą." },
    ],
  },
  closing: {
    lines: ["Karp jest jeden.", "Lista też."],
    body: "W Kangurze jest wspólna dla całej rodziny. Na Android i iOS.",
  },
};

export const GUIDE_CHRISTMAS = typesetCopy(copy);
