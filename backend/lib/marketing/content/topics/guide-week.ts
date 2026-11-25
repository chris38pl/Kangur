import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista na tydzień",
  eyebrow: "Lista zakupów na tydzień dla jednej osoby, dwóch i rodziny",
  lines: ["Zakupy na tydzień.", "Sałata dożywa środy."],
  lead: [
    "Ustaw, ile Was jest i ile obiadów jecie w domu. Dostaniesz listę z ilościami: duże zakupy na weekend i małą dokupkę w środku tygodnia.",
    "Do skopiowania, odhaczania albo druku. Bez konta i bez maila.",
  ],
  sections: [
    {
      kind: "custom",
      slot: "table",
      title: "Ile czego na tydzień",
      intro:
        "Dla jednej osoby, dwóch i rodziny 2+2, przy pięciu obiadach w domu. Ilości są do kupienia, więc zaokrąglone do całych opakowań.",
    },
    {
      kind: "fact",
      tone: "tinted",
      text: "W co czwartym domu czasami albo zawsze jest tak: zakupy robi się z góry, na przykład na tydzień, i część produktów psuje się, zanim zdąży się je zjeść.",
      source: "CBOS, sierpień 2023",
      href: "https://www.cbos.pl/SPISKOM.POL/2023/K_126_23.PDF",
    },
    {
      kind: "cards",
      title: "Cztery zasady listy na tydzień",
      columns: 4,
      items: [
        { title: "Najpierw szafka", body: "Otwórz ją, zanim zaczniesz pisać. Trzeci pieprz już tam stoi." },
        { title: "Obiady, potem produkty", body: "Pięć dań na kartce i od razu wiadomo, po co ta kapusta." },
        { title: "Banany w dwóch kolorach", body: "Żółte na jutro, zielonkawe na czwartek." },
        { title: "Zamrażarka pracuje", body: "Chleb w kromkach, mięso w porcjach. Nie wszystko naraz na blacie." },
      ],
    },
    {
      kind: "text",
      tone: "mint",
      title: "Dlaczego dwa razy",
      body: [
        "Bo są rzeczy na tydzień i rzeczy na trzy dni. Kasza poczeka, rukola nie.",
        "Dlatego lista dzieli się na dwie części. W weekend kupujesz ciężkie i trwałe. W środę albo w czwartek wpadasz po chleb, mleko i zielone, w pięć alejek, a nie w dwadzieścia.",
      ],
      slot: "kangur",
    },
    {
      kind: "text",
      title: "Drugi tydzień jest łatwiejszy",
      body: [
        "Po kilku listach w Kangurze nie zaczynasz od pustej kartki. „Poprzednie listy” zbierają produkty z pięciu ostatnich zakupów i pokazują, które wracają najczęściej. Zostawiasz te, których trzeba.",
        "Rukoli, która nie dożyła środy, nikt nie każe kupować drugi raz.",
      ],
      slot: "history",
      flip: true,
    },
    {
      kind: "faq",
      title: "Pytania o listę na tydzień",
      items: [
        {
          q: "Co kupić na tydzień dla jednej osoby?",
          a: "Mniej opakowań, za to częściej. Dla jednej osoby najwięcej zmienia zamrażarka: pół chleba w kromkach i mięso w małych porcjach. Dokładne ilości są w tabeli.",
        },
        {
          q: "Jak zrobić listę na tydzień dla dwóch osób?",
          a: "Ustaw w kalkulatorze dwie osoby i tyle obiadów, ile naprawdę jecie w domu. Potem skopiuj listę i zróbcie z niej [[sharedList|wspólną]], żeby nikt nie kupił drugiego masła.",
        },
        {
          q: "Czy jest wersja bez mięsa?",
          a: "Tak. Odznacz „Jemy mięso”, a w jego miejsce wejdą tofu, strączki, ser sałatkowy i hummus.",
        },
        {
          q: "Skąd są ilości?",
          a: "Z domowej praktyki, nie z tabel żywieniowych. To punkt startu: po pierwszym tygodniu będziesz wiedzieć, czego zostało, a czego brakło.",
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
      { id: "guidePrint", label: "Lista zakupów do druku", body: "Kartka z planem obiadów i miejscem na produkty." },
      { id: "aisleTool", label: "Podział listy na alejki", body: "Masz już swoją listę? Wklej ją tutaj." },
    ],
  },
  closing: {
    lines: ["Kupione w sobotę.", "Zjedzone do piątku."],
    body: "Kangur - lista zakupów z AI. Dostępny na Android i iOS.",
  },
};

export const GUIDE_WEEK = typesetCopy(copy);
