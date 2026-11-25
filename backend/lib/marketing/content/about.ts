import type { Lines } from "@/lib/marketing/content/home-types";
import { typesetCopy } from "@/lib/marketing/typography";

type Card = { title: string; body: string };

export type AboutCopy = {
  crumb: string;
  eyebrow: string;
  lines: Lines;
  lead: readonly string[];
  why: { title: string; body: readonly string[] };
  timeline: { title: string; items: readonly { when: string; what: string }[] };
  beliefs: { title: string; intro: string; items: readonly Card[] };
  who: {
    title: string;
    body: readonly string[];
    rows: readonly { term: string; value: string }[];
  };
  animal: { title: string; body: readonly string[] };
  notUs: { title: string; intro: string; rows: readonly { term: string; value: string }[]; outro: string };
  closing: { lines: Lines; body: string };
};

/** Dates come from the repository history and the stores, principles from the product spec. */
const COPY: Record<"pl" | "en", AboutCopy> = {
  pl: {
    crumb: "O Kangurze",
    eyebrow: "O aplikacji Kangur",
    lines: ["Lista zakupów,", "która mieszkała w czacie."],
    lead: [
      "Kangur powstał z bardzo zwykłego problemu: lista przychodzi w wiadomościach, a w sklepie trzeba ją przewijać.",
      "Robi go w Poznaniu jednoosobowa firma Krzysztof Krawiec Software.",
    ],
    why: {
      title: "Skąd się wziął",
      body: [
        "Ktoś pisze listę w wiadomości. Ktoś inny stoi między półkami i skacze z czatu do notatnika. Po drodze dochodzi masło, potem proszek, a na końcu i tak brakuje jednej rzeczy. I pytanie, kto miał ją kupić.",
        "Do notatnika trzeba wszystko wpisać od nowa. Kangur o to nie prosi. Pisz, jak piszesz. On zrobi z tego listę.",
      ],
    },
    timeline: {
      title: "Kalendarz",
      items: [
        { when: "16 lipca 2026", what: "Pierwszy opis pomysłu: lista ze zrzutu czatu i tryb zakupów pod kciuk." },
        { when: "17 lipca 2026", what: "Pierwsza działająca wersja." },
        { when: "19 lipca 2026", what: "Kangur mówi w 10 językach." },
        { when: "22 lipca 2026", what: "Składniki z nazwy dania i własna kolejność alejek." },
        { when: "Wrzesień 2026", what: "Kangur jest w Google Play." },
        { when: "Listopad 2026", what: "Kangur jest w App Store." },
        { when: "Teraz", what: "Uczymy się na uwagach z „Zgłoś problem” i „Mam pomysł” w aplikacji." },
      ],
    },
    beliefs: {
      title: "Czego się trzymamy",
      intro: "Krótka lista, jak na zakupy.",
      items: [
        { title: "Jedna ręka", body: "W drugiej jest koszyk, dziecko albo wózek. W trybie zakupów wystarczy kciuk." },
        { title: "Nikt niczego nie przepisuje", body: "Skoro lista już gdzieś jest, wystarczy ją pokazać. Przepisywanie zostawiamy szkole." },
        { title: "AI podaje, Ty decydujesz", body: "AI wypisuje produkty i czasem się myli, jak każdy. Każdą pozycję możesz zmienić albo wyrzucić." },
        { title: "Lista jest wspólna", body: "Zaproszenia są darmowe, a Premium jednej osoby działa dla całego domu." },
        { title: "Bez reklam i kuponów", body: "Kangur zarabia na Premium i tyle." },
        { title: "Bez udawania", body: "Nie kupujemy ocen i nie piszemy opinii za klientów. Lepiej mało, ale prawdziwych." },
      ],
    },
    who: {
      title: "Kto go robi",
      body: [
        "Krzysztof Krawiec, w pojedynkę. Programuje, odpisuje na maile i czyta każde zgłoszenie.",
        "App Store pokazuje imię i nazwisko, a konto w Google Play nazywa się Krzysztof Krawiec Labs. To wciąż ta sama osoba:",
      ],
      rows: [
        { term: "Firma", value: "Krzysztof Krawiec Software, NIP 9721382309, REGON 545425000" },
        { term: "App Store", value: "Krzysztof Krawiec" },
        { term: "Google Play", value: "Krzysztof Krawiec Labs" },
        { term: "Adres", value: "ul. Sielawy 23e/19, 61-619 Poznań" },
        { term: "Kontakt", value: "[[mailto:contact@getkangur.com|contact@getkangur.com]]" },
      ],
    },
    animal: {
      title: "Dlaczego kangur?",
      body: ["Ma torbę na stałe i dwie wolne ręce. Do zakupów trudno o lepsze wyposażenie."],
    },
    notUs: {
      title: "Z czym nas nie mylić",
      intro: "Kangur to popularne imię. Te Kangury to nie my:",
      rows: [
        { term: "Kangur Matematyczny", value: "międzynarodowy konkurs dla uczniów. Nasz Kangur dodaje najwyżej masło." },
        { term: "„Kangur” z 2025", value: "program na komputer z ostrzeżenia policji. Nasz powstał rok później, jest na telefon i robi tylko listy. [[safety|Jak nas rozpoznać]]." },
        { term: "Kangur z zoo", value: "nie ma aplikacji, za to lepiej skacze." },
      ],
      outro: "Szukasz nas w internecie? Wpisz „Kangur lista zakupów”.",
    },
    closing: { lines: ["Zrobione w Poznaniu.", "Działa w każdej alejce."], body: "Kangur - lista zakupów z AI. Dostępny na Android i iOS." },
  },
  en: {
    crumb: "About",
    eyebrow: "About the Kangur app",
    lines: ["The grocery list", "that lived in a chat."],
    lead: [
      "Kangur comes from a very ordinary problem: the list arrives in messages, and in the store you have to scroll through it.",
      "It is made in Poznań, Poland, by a one-person company, Krzysztof Krawiec Software.",
    ],
    why: {
      title: "Where it came from",
      body: [
        "Somebody writes the list in a message. Somebody else stands between the shelves, jumping from the chat to a notes app. Butter gets added on the way, then detergent, and in the end one thing is missing anyway. And there is the question of who was supposed to buy it.",
        "In a notes app you have to type everything again. Kangur does not ask for that. Write the way you always do. Kangur will turn it into a list.",
      ],
    },
    timeline: {
      title: "Timeline",
      items: [
        { when: "16 July 2026", what: "First description of the idea: a list from a chat screenshot and a shopping mode for one thumb." },
        { when: "17 July 2026", what: "First working version." },
        { when: "19 July 2026", what: "Kangur speaks 10 languages." },
        { when: "22 July 2026", what: "Ingredients from the name of a dish and your own order of aisles." },
        { when: "September 2026", what: "Kangur is on Google Play." },
        { when: "November 2026", what: "Kangur is in the App Store." },
        { when: "Now", what: "We learn from “Report a problem” and “I have an idea” in the app." },
      ],
    },
    beliefs: {
      title: "House rules",
      intro: "A short list, like any good one.",
      items: [
        { title: "One hand", body: "The other one holds a basket, a child or a cart. In shopping mode a thumb is enough." },
        { title: "Nobody retypes anything", body: "If the list already exists somewhere, just show it. Copying things out is for school." },
        { title: "AI serves, you decide", body: "AI writes out the items and sometimes makes mistakes, like everybody. You can change or remove each one." },
        { title: "The list is shared", body: "Invitations are free, and one person’s Premium works for the whole home." },
        { title: "No ads, no coupons", body: "It lives off Premium, that is all." },
        { title: "No pretending", body: "We do not buy ratings or write reviews for customers. Better a few, but real." },
      ],
    },
    who: {
      title: "Who makes it",
      body: [
        "Krzysztof Krawiec, single-handed. Writes the code, answers emails and reads every report.",
        "The App Store shows a personal name, and the Google Play account is called Krzysztof Krawiec Labs. It is still the same person:",
      ],
      rows: [
        { term: "Company", value: "Krzysztof Krawiec Software, NIP 9721382309" },
        { term: "App Store", value: "Krzysztof Krawiec" },
        { term: "Google Play", value: "Krzysztof Krawiec Labs" },
        { term: "Address", value: "ul. Sielawy 23e/19, 61-619 Poznań, Poland" },
        { term: "Contact", value: "[[mailto:contact@getkangur.com|contact@getkangur.com]]" },
      ],
    },
    animal: {
      title: "Why a kangaroo?",
      body: ["Kangur is Polish for kangaroo. It has a built-in bag and two free hands. Hard to be better equipped for shopping."],
    },
    notUs: {
      title: "What we are not",
      intro: "Kangur is a popular name in Poland. These are not us:",
      rows: [
        { term: "Kangur Matematyczny", value: "the Polish edition of the Math Kangaroo contest for students." },
        { term: "“Kangur” from 2025", value: "a computer program from a police warning. Ours came a year later, is made for phones and only makes lists. [[safety|How to recognize us]]." },
        { term: "The kangaroo in the zoo", value: "has no app, but jumps better." },
      ],
      outro: "Looking for us online? Type “Kangur grocery list”.",
    },
    closing: { lines: ["Made in Poznań.", "Works in every aisle."], body: "Kangur - grocery list with AI. For Android and iPhone." },
  },
};

export const ABOUT = { pl: typesetCopy(COPY.pl), en: COPY.en };
