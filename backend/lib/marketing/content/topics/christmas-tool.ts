import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Wigilia i święta",
  eyebrow: "Lista zakupów na Wigilię i Boże Narodzenie 2026",
  lines: ["Dwanaście dań.", "Cztery dni bez sklepu."],
  lead: [
    "Ustaw liczbę gości i dania, a kalkulator policzy zakupy na Wigilię, śniadania do 27 i obiady do 26 grudnia. Reszta to resztki. Od czwartku 24 do niedzieli 27 grudnia duże sklepy są zamknięte.",
    "Liczysz tutaj, bez konta. Na końcu kopiujesz listę, w Kangurze stukasz „Schowek” i odhaczacie razem.",
  ],
  sections: [
    {
      kind: "table",
      tone: "cream",
      title: "Kiedy robić zakupy na Boże Narodzenie 2026",
      intro:
        "Niedziele handlowe w grudniu 2026 to 6, 13 i 20. Potem zostają trzy zwykłe dni: 21, 22 i 23 grudnia.",
      caption: "Terminy zakupów przed świętami 2026",
      head: ["Kiedy", "Co", "Dlaczego wtedy"],
      stack: true,
      rows: [
        ["Do 13 grudnia", "mąka, mak, bakalie, susz, grzyby, przyprawy, opłatek, świece. Lepisz wcześniej? Także kapusta, cebula i jajka", "Poczeka w szafce, a pod koniec bywa wykupione"],
        ["19 i 20 grudnia", "warzywa, kapusta, śledzie, jajka, masło, śmietana, napoje, porcja rosołowa do zamrażarki", "Ostatni weekend z niedzielą handlową"],
        ["22 i 23 grudnia", "karp, biała ryba, mięso na pieczeń, wędlina, mleko, pieczywo, pomidory", "Świeże. Lodówka i tak już protestuje"],
        ["Od 24 do 27 grudnia", "nic", "Wigilia jest wolna od pracy, potem dwa dni świąt i niedziela niehandlowa"],
      ],
      outro:
        "Taki układ, cztery dni z rzędu bez dużych sklepów, powtórzy się dopiero w 2037 roku, jeśli przepisy się nie zmienią. Stan na 25 listopada 2026, źródła: [[https://zielonalinia.gov.pl/niedziele-handlowe-w-2026-r/|Zielona Linia]], [[https://www.money.pl/gospodarka/cztery-dni-bez-zakupow-w-duzych-sklepach-grudzien-z-handlowa-przerwa-7347071442889152a.html|Money.pl]].",
    },
    {
      kind: "custom",
      slot: "dishes",
      title: "Produkty na 12 potraw wigilijnych, dla 8 osób",
      intro:
        "Danie po daniu. Kalkulator wyżej je sumuje: cebula jest w sześciu daniach, a w koszyku raz.",
    },
    {
      kind: "text",
      tone: "cream",
      title: "Ile jedzenia na osobę w Wigilię",
      slot: "kangur",
      body: [
        "Dwanaście prób, nie dwanaście obiadów. Dwadzieścia deko karpia na osobę, bo obok stoi jedenaście innych dań i ktoś na pewno pilnuje, czy próbujesz każdego.",
        "Ilości są z domowej kuchni, nie z tabel żywieniowych. Na osobę to między innymi 20 dag karpia, 14 dag śledzi w dwóch daniach, 18 dag buraków na barszcz i 15 dag pierogów, gdy kupujesz gotowe. Wszystko sumujemy i zaokrąglamy raz, na końcu. Inaczej wyszłoby pięć napoczętych worków mąki.",
        "Jeśli u Was wszyscy biorą dokładkę pierogów, dodaj jedną osobę. Jeśli ciocia zawsze przywozi drugi makowiec, ustaw przy nim „Ktoś przynosi”.",
      ],
    },
    {
      kind: "cards",
      tone: "mint",
      title: "Kto co przynosi na Wigilię",
      intro: "Przy daniach z „Ktoś przynosi” kalkulator sam ułoży wiadomość do rodziny.",
      columns: 4,
      items: [
        { title: "Gospodarze: gorące", body: "Barszcz, karp i kapusta nie lubią podróży." },
        { title: "Goście: zimne", body: "Śledź, sałatka, makowiec. Zniosą bagażnik, pociąg i trzecie piętro." },
        { title: "Dzieci: pierniczki", body: "Pierniczki upieczone dwa tygodnie wcześniej zdążą zmięknąć, o ile dotrwają." },
        { title: "Jedna osoba: drobiazgi", body: "Opłatek, sianko, świece, zapałki. Tylko to, ale na pewno." },
      ],
    },
    {
      kind: "steps",
      title: "Co zrobić wcześniej",
      intro: "Żeby 24 grudnia smażyć karpia, a nie wszystko naraz.",
      items: [
        { title: "Początek grudnia: pierniczki", body: "Masło i jajka kup na nie osobno. Po upieczeniu są twarde, miękną w puszce, im dłużej, tym lepiej." },
        { title: "Około 13 grudnia: uszka i pierogi", body: "Kapustę, cebulę i jajka do ciasta kup więc na pierwszych zakupach. Ulepione zamroź na tacy, potem przesyp do woreczka. Nie skleją się." },
        { title: "Około 17 grudnia: zakwas na barszcz", body: "Domowy potrzebuje kilku dni, więc buraki i czosnek kup wcześniej. Kupny może poczekać na weekend." },
        { title: "21 i 22 grudnia: śledzie i makowiec", body: "Śledziom dwa dni z cebulą robią dobrze. Makowcowi nic się nie stanie, tylko szklankę mleka weź na niego wcześniej." },
        { title: "23 grudnia: ryba po grecku, sałatka, kapusta, kutia, kompot", body: "Następnego dnia smakują lepiej niż w dniu gotowania." },
        { title: "24 grudnia: karp, barszcz, nakrycie", body: "I to wszystko. Taki był plan." },
      ],
    },
    {
      kind: "text",
      tone: "mint",
      title: "Wigilia bez ryb",
      body: [
        "Też wychodzi dwanaście: barszcz, uszka, zupa grzybowa, pierogi, kapusta z grochem, gołąbki z kaszą, fasola ze śliwkami, sałatka jarzynowa, kluski z makiem, kutia, makowiec i kompot. W kalkulatorze to przycisk „Bez ryb”. Karp odetchnie.",
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
      title: "Jedna Wigilia, kilka telefonów",
      slot: "phones",
      body: [
        "Gdy lista jest już w Kangurze, zaproś rodzinę. Zaproszenia nic nie kosztują, a każdy widzi to samo.",
        "Jedna osoba bierze warzywa, druga stoi po rybę. Na liście widać, co już w koszyku, więc jest szansa, że karp wróci do domu jeden. [[sharedList|Jak działa wspólna lista]].",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o świąteczne zakupy",
      items: [
        {
          q: "Czy 24 grudnia 2026 sklepy są otwarte?",
          a: "Duże sklepy nie, i to przez cztery dni z rzędu. Od 2025 roku Wigilia jest dniem wolnym od pracy, a 27 grudnia to niedziela niehandlowa. Otwarte mogą być małe sklepy, w których za ladą stoi właściciel, piekarnie, apteki i stacje paliw. Każdy decyduje sam, więc lepiej nie liczyć na ten pod domem.",
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
          a: "Zależy od domu i regionu. Zaczynamy od barszczu z uszkami, karpia, dwóch śledzi, pierogów, kapusty z grochem, ryby po grecku, sałatki, kompotu z suszu, kutii i makowca. Siedem innych dodasz z listy, a własne dopiszesz.",
        },
        {
          q: "Czy musi być dokładnie dwanaście?",
          a: "Nie. W wielu domach liczy się też kompot, a w niektórych nikt nie liczy. W kalkulatorze jest też zestaw sześciu dań.",
        },
        {
          q: "Jak policzyć dzieci?",
          a: "Dwoje małych dzieci to mniej więcej jedna osoba. Starsze licz normalnie, zwłaszcza przy pierogach.",
        },
        {
          q: "Nie obchodzimy Wigilii. Przyda się?",
          a: "Tak. Wybierz „Tylko cztery dni bez sklepu”. Zostaną śniadania i obiady od 24 do 27 grudnia, bez opłatka i bez karpia. Bez mięsa też się da.",
        },
        {
          q: "Ile kosztują zakupy na Wigilię?",
          a: "Kwoty nie zgadujemy, ceny przed świętami zmieniają się co tydzień. Żeby zejść z rachunku, ustaw mniej dań albo „Ktoś przynosi” i najpierw zajrzyj do szafki.",
        },
        {
          q: "Jak przenieść tę listę do Kangura?",
          a: "Pod kalkulatorem czekają trzy listy, na trzy wyjścia do sklepu, albo jedna ze wszystkim. Skopiuj i na ekranie Start w Kangurze stuknij „Schowek”. Przy komputerze zeskanuj kod, ta sama lista otworzy się w telefonie. Każde wczytanie to jedno z dziesięciu darmowych użyć AI.",
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
      { id: "weekTool", label: "Lista zakupów na tydzień", body: "Na zwykły tydzień, bez karpia." },
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Danie spoza kalkulatora? Kangur zaproponuje składniki." },
      { id: "sharedList", label: "Wspólna lista zakupów", body: "Jedna lista u wszystkich, którzy coś przynoszą." },
    ],
  },
  closing: {
    lines: ["Karp jest jeden.", "Lista też."],
    body: "W Kangurze jest wspólna dla całej rodziny. Na Android i iOS.",
  },
  imprint:
    "Kalkulator robi Kangur, Krzysztof Krawiec Software. Stan na 25 listopada 2026. Liczby z tej strony można cytować, z linkiem do getkangur.com/wigilia.",
};

export const CHRISTMAS_TOOL = typesetCopy(copy);
