import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista z przepisu",
  eyebrow: "Lista zakupów z przepisu",
  lines: ["Dwa dania,", "jedna sól."],
  lead: [
    "Wpisujesz nazwy dań, do pięciu naraz, a Kangur proponuje składniki na jednej liście. Co się powtarza, jest raz. Odznaczasz to, co masz w domu.",
    "Masz gotowy przepis? Skopiuj składniki i na ekranie Start stuknij „Schowek”.",
  ],
  stores: "Na start 10 darmowych użyć AI, wspólnych dla całego domu. Bez reklam.",
  sections: [
    {
      kind: "steps",
      title: "Jak zrobić listę zakupów z przepisu",
      film: "L06",
      items: [
        {
          title: "Wpisz dania",
          body: "Po nazwie, tak jak mówisz przy stole. Carbonara, bruschetta, pomidorowa.",
        },
        {
          title: "Przejrzyj składniki",
          body: "Danie po daniu. Przy soli zobaczysz dopisek „na Carbonara i Bruschetta”, bo do obu wystarczy jedna.",
        },
        {
          title: "Odznacz, co masz",
          body: "Pieprz stoi w szafce? Odznacz. Zmiana planów? Jest „Odrzuć całe danie”.",
        },
        {
          title: "Dodaj do listy",
          body: "Składniki trafiają do swoich alejek, obok mleka i papieru.",
        },
      ],
    },
    {
      kind: "custom",
      tone: "cream",
      slot: "example",
      title: "Carbonara i bruschetta, przykład z testu",
      intro: "Trzynaście składników z dwóch dań, na liście jedenaście. Sól i pieprz są raz.",
      outro:
        "W samej carbonarze śmietany nie było ani razu. Sprawdzaliśmy siedem razy, bo wiemy, że ktoś zapyta.",
    },
    {
      kind: "cards",
      title: "Czego „Z przepisu” nie robi",
      columns: 4,
      items: [
        {
          title: "Nie otwiera linków",
          body: "Adresu strony z przepisem nie przeczyta. Wpisz nazwę dania albo wklej składniki.",
        },
        {
          title: "Nie liczy porcji",
          body: "Ilość podaje tylko czasem. Nie wie, ilu Was jest i kto bierze dokładkę.",
        },
        {
          title: "Nie układa diety",
          body: "Nie liczy kalorii i nie ocenia. Składniki to propozycja, nie przepis.",
        },
        {
          title: "Nie każe kupować wody",
          body: "Do makaronu wystarczy kran. Gazowana trafia na listę tylko wtedy, gdy jest częścią dania.",
        },
      ],
    },
    {
      kind: "text",
      tone: "mint",
      title: "Masz gotowy przepis? Składniki ze schowka na listę",
      body: [
        "Skopiuj listę składników ze strony albo z notatki i na ekranie Start stuknij „Schowek”. Kangur wypisze produkty razem z ilościami, które tam są, i rozłoży je po alejkach.",
        "To dobry sposób na przepis babci, w którym mąki jest „ile zabierze”.",
      ],
      slot: "grandma",
    },
    {
      kind: "faq",
      title: "Pytania o listę zakupów z przepisu",
      items: [
        {
          q: "Ile dań mogę wpisać naraz?",
          a: "Od jednego do pięciu. Wszystkie razem to jedno użycie AI.",
        },
        {
          q: "Skąd są składniki?",
          a: "Proponuje je AI na podstawie nazwy dania. Przejrzyj je przed dodaniem, od tego jest ekran z odznaczaniem.",
        },
        {
          q: "Czy składniki trafiają na listę same?",
          a: "Nie. Tutaj zawsze najpierw wybierasz, co dodać. Inaczej niż przy zrzucie czy zdjęciu, gdzie produkty lądują na liście same.",
        },
        {
          q: "Co, jeśli Kangur nie zna dania?",
          a: "Przy nazwie, która nic mu nie mówi, może pominąć danie. Wpisz je wtedy prościej albo wklej składniki.",
        },
        {
          q: "Nie mam pomysłu na obiad. Co wtedy?",
          a: "Dania wymyślasz Ty. Na brak pomysłu mamy pięć obiadów z gotową listą w kalkulatorze [[weekTool|na tydzień]].",
        },
        {
          q: "Ile kosztuje lista z przepisu?",
          a: "Jedno użycie AI. Na start jest 10 darmowych na całą przestrzeń, czyli na wspólne listy domu, a Premium znosi limit. [[pricing|Zobacz cennik]].",
        },
      ],
    },
  ],
  related: {
    title: "Na większe gotowanie",
    items: [
      { id: "christmasTool", label: "Lista zakupów na Wigilię i święta", body: "Dwanaście dań przeliczonych na liczbę gości." },
      { id: "weekTool", label: "Lista zakupów na tydzień", body: "Pięć obiadów, duże zakupy i mała dokupka." },
      { id: "sharedList", label: "Wspólna lista zakupów", body: "Jedno gotuje, drugie kupuje, lista jest jedna." },
    ],
  },
  closing: {
    lines: ["Co dziś na obiad?", "To już wymyśl Ty."],
    body: "Składniki bierze na siebie Kangur. Na Android i iOS.",
  },
};

export const RECIPE_LIST = typesetCopy(copy);

/** The result recorded on 2026-11-05 (fixtures/ai/f03v2-carbonara-bruschetta.json). */
export const RECIPE_EXAMPLE = typesetCopy([
  {
    dish: "Carbonara",
    icon: "🍝",
    items: ["Makaron spaghetti", "Jajka", "Boczek wędzony", "Parmezan"],
  },
  {
    dish: "Bruschetta",
    icon: "🍅",
    items: ["Bagietka", "Pomidory", "Czosnek", "Oliwa z oliwek", "Bazylia świeża"],
  },
  { dish: "Do obu", icon: "🧂", items: ["Sól", "Pieprz czarny mielony"] },
] as const);
