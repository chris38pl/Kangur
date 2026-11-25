import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista z przepisu",
  eyebrow: "Lista zakupów z przepisu",
  lines: ["Dwa dania,", "jedna sól."],
  lead: [
    "Wpisujesz nazwy dań, do pięciu naraz, a Kangur proponuje składniki na jednej liście. Co się powtarza, jest raz.",
    "Odznaczasz to, co masz w domu, i dodajesz resztę.",
  ],
  sections: [
    {
      kind: "steps",
      title: "Od pomysłu na obiad do listy",
      slot: "meal",
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
      intro: "Trzynaście składników z dwóch przepisów, na liście jedenaście. Sól i pieprz są raz.",
      outro:
        "W samej carbonarze śmietany nie było ani razu. Sprawdzaliśmy siedem razy, bo wiemy, że ktoś zapyta.",
    },
    {
      kind: "cards",
      title: "Czego Z przepisu nie robi",
      columns: 4,
      items: [
        {
          title: "Nie otwiera linków",
          body: "Adresu strony z przepisem nie przeczyta. Wpisz nazwę dania albo wklej składniki.",
        },
        {
          title: "Nie liczy porcji",
          body: "Ilość podaje tylko tam, gdzie ma sens. Wiesz lepiej, kto bierze dokładkę.",
        },
        {
          title: "Nie układa diety",
          body: "Nie liczy kalorii i nie ocenia. Składniki to propozycja, nie przepis.",
        },
        {
          title: "Nie każe kupować wody",
          body: "Do makaronu wystarczy kran. O gazowaną do drinków już poprosi.",
        },
      ],
    },
    {
      kind: "text",
      tone: "mint",
      title: "Masz swój przepis?",
      body: [
        "Skopiuj listę składników ze strony albo z notatki i wybierz „Tekst ze schowka”. Kangur wypisze produkty razem z ilościami, które tam są, i rozłoży je po alejkach.",
        "To dobry sposób na przepis babci, w którym mąki jest „ile zabierze”.",
      ],
      slot: "kangur",
    },
    {
      kind: "faq",
      title: "Pytania o listę z przepisu",
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
          q: "Ile kosztuje lista z przepisu?",
          a: "Jedno użycie AI. Na start jest 10 darmowych na całą przestrzeń, a Premium znosi limit. [[pricing|Zobacz cennik]].",
        },
      ],
    },
  ],
  related: {
    title: "Na większe gotowanie",
    items: [
      { id: "guideChristmas", label: "Lista zakupów na Wigilię i święta", body: "Dwanaście dań przeliczonych na liczbę gości." },
      { id: "guideWeek", label: "Lista zakupów na tydzień", body: "Duże zakupy i mała dokupka, żeby nic nie zwiędło." },
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
