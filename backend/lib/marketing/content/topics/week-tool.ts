import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista na tydzień",
  eyebrow: "Lista zakupów na tydzień dla jednej osoby, dwóch i rodziny",
  lines: ["Zakupy na tydzień.", "Sałata dopiero w środę."],
  lead: [
    "Ustaw, ile Was jest i ile obiadów jecie w domu. Dostaniesz listę z ilościami: duże zakupy w wolny dzień i małą dokupkę kilka dni później.",
    "Liczysz tutaj, bez konta. Na końcu kopiujesz listę, w Kangurze stukasz „Schowek” i przy lodówkach odhaczasz kciukiem.",
  ],
  sections: [
    {
      kind: "custom",
      slot: "table",
      title: "Lista zakupów na tydzień dla 1, 2 i 4 osób",
      intro:
        "Ile czego, przy pięciu obiadach w domu. Ilości są do kupienia, więc zaokrąglone do całych opakowań.",
    },
    {
      kind: "steps",
      tone: "mint",
      title: "Pięć obiadów z tej listy",
      intro: "Dla dwóch osób, z ilości, które liczy kalkulator.",
      items: [
        { title: "Makaron z mięsem i passatą", body: "Mięso mielone długo nie poczeka, więc to obiad numer jeden." },
        { title: "Ryba z ziemniakami i marchewką", body: "Mrożona wytrzyma do dnia, w którym nic się nie chce." },
        { title: "Kurczak z ryżem i warzywami z mrożonki", body: "Druga połowa filetu śpi już w zamrażarce." },
        { title: "Kasza z ciecierzycą i kapustą albo brokułem", body: "Puszka, garnek i pół głowy kapusty. Ta druga połowa wróci." },
        { title: "Ziemniaki zapiekane z tym, co zostało", body: "Ser na górę. Nikt nie zapyta, co jest pod spodem." },
      ],
      outro:
        "Bez mięsa: w pierwszym ser sałatkowy, w drugim twaróg z dokupki, w trzecim tofu. Wolisz swoje dania? Wpisz je w Kangurze, do pięciu naraz, a [[recipeList|zaproponuje składniki]]. Sól doda raz.",
    },
    {
      kind: "fact",
      tone: "tinted",
      text: "To nie tylko Twoja sałata. W co czwartym domu czasami albo zawsze jest tak: zakupy robi się z góry, na przykład na tydzień, i część produktów psuje się, zanim zdąży się je zjeść.",
      source: "CBOS, sierpień 2023",
      href: "https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF",
    },
    {
      kind: "cards",
      title: "Cztery zasady listy na tydzień",
      columns: 4,
      items: [
        { title: "Najpierw szafka", body: "Otwórz ją, zanim zaczniesz pisać. Kasza zwykle już tam jest, za makaronem." },
        { title: "Obiady, potem produkty", body: "Pięć dań i już wiadomo, po co ta kapusta." },
        { title: "Banany w dwóch kolorach", body: "Żółte na jutro, zielonkawe na czwartek." },
        { title: "Zamrażarka pracuje", body: "Chleb w kromkach, mięso w porcjach. Nie wszystko naraz na blacie." },
      ],
    },
    {
      kind: "text",
      tone: "cream",
      title: "Dlaczego dwa razy",
      body: [
        "Bo są rzeczy na tydzień i rzeczy na trzy dni. Kasza poczeka, rukola nie.",
        "Dlatego lista dzieli się na dwie części. W wolny dzień kupujesz ciężkie i trwałe, a kilka dni później wpadasz po chleb, mleko i zielone. Kilka alejek zamiast całego sklepu.",
      ],
      slot: "kangur",
    },
    {
      kind: "text",
      title: "Drugi tydzień jest łatwiejszy",
      body: [
        "Po kilku listach w Kangurze nie zaczynasz od pustej kartki. „Poprzednie listy” zbierają produkty z pięciu ostatnich list i pokazują, które wracają najczęściej. Zostawiasz te, których trzeba. To jedno użycie AI, choć liczy sam Kangur.",
        "Rukoli, która nie dożyła soboty, nikt nie każe kupować drugi raz.",
      ],
      slot: "history",
      flip: true,
    },
    {
      kind: "faq",
      title: "Pytania o listę zakupów na tydzień",
      items: [
        {
          q: "Co kupić na tydzień dla jednej osoby?",
          a: "Świeżego mało, suchego raz na kilka tygodni. Makaron, ryż i kasza z pierwszych zakupów poczekają, więc druga lista jest krótsza. Pół chleba w kromkach idzie do zamrażarki. Dokładne ilości są w tabeli.",
        },
        {
          q: "Jak zrobić listę zakupów na tydzień dla dwóch osób?",
          a: "Ustaw w kalkulatorze dwie osoby i tyle obiadów, ile naprawdę jecie w domu. Potem skopiuj listę, w Kangurze stuknij „Schowek” i zróbcie z niej [[sharedList|wspólną]], żeby nikt nie kupił drugiego masła.",
        },
        {
          q: "Jak zrobić tańszą listę na tydzień?",
          a: "Zamieniaj, zamiast skreślać. Udka zamiast filetu, słonecznik zamiast orzechów, duży jogurt zamiast kilku kubków, jajka zamiast ryby. Kasza, strączki i kapusta zostają.",
        },
        {
          q: "A bez samochodu?",
          a: "Duże zakupy dla dwóch osób to kilkanaście kilo. Rozłóż je na dwa kursy: najpierw suche i puszki, potem reszta.",
        },
        {
          q: "Czy jest wersja bez mięsa?",
          a: "Tak. Odznacz „Jemy mięso”, a w jego miejsce wejdą tofu, strączki, ser sałatkowy i hummus. To wersja wegetariańska, jajka i nabiał zostają.",
        },
        {
          q: "Skąd są ilości?",
          a: "Z domowej praktyki, nie z tabel żywieniowych. To punkt startu: po pierwszym tygodniu będziesz wiedzieć, co zostało, a czego zabrakło. Dziecko liczymy jak dorosłego, przy dwojgu małych odejmij jedną osobę.",
        },
        {
          q: "Kiedy zrobić dokupkę?",
          a: "W połowie drogi między dużymi zakupami. Przy sobocie wypada środa, przy piątku wtorek.",
        },
      ],
    },
  ],
  related: {
    title: "Co dalej",
    items: [
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Pięć obiadów naraz, składniki na jednej liście." },
      { id: "christmasTool", label: "Lista zakupów na Wigilię i święta", body: "Dwanaście dań przeliczonych na liczbę gości." },
      { id: "aisleTool", label: "Podział listy na alejki", body: "Masz już swoją listę? Wklej ją, jak leci." },
    ],
  },
  closing: {
    lines: ["Kupione w sobotę.", "Zjedzone do piątku."],
    body: "Następną listę Kangur podpowie z pięciu poprzednich. Na Android i iOS.",
  },
  imprint:
    "Kalkulator robi Kangur, Krzysztof Krawiec Software. Stan na 25 listopada 2026. Liczby z tej strony można cytować, z linkiem do getkangur.com/tydzien.",
};

export const WEEK_TOOL = typesetCopy(copy);
