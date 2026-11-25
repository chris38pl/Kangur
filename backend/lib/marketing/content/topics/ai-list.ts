import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

/** Every rule below is in the prompts (backend/features/ai), not a promise about the model. */
const copy: TopicCopy = {
  crumb: "Lista zakupów z AI",
  eyebrow: "Lista zakupów z AI",
  lines: ["AI czyta bałagan.", "Ty czytasz listę."],
  lead: [
    "W Kangurze AI ma jedno zadanie: z wiadomości, kartki albo nazwy dania zrobić listę produktów w alejkach. Nie gada i nie doradza.",
    "Wspólne listy, odhaczanie i tryb zakupów działają bez AI.",
  ],
  sections: [
    {
      kind: "table",
      title: "Co dajesz, co dostajesz",
      caption: "Co AI w Kangurze przyjmuje i co z tego robi",
      head: ["Dajesz", "Dostajesz"],
      rows: [
        ["[[photoList|zrzut czatu albo zdjęcie kartki]]", "produkty z ilościami, jeśli ktoś je podał"],
        ["wklejony, wpisany albo podyktowany tekst", "to samo"],
        ["[[recipeList|nazwy dań]], do pięciu", "składniki, z których odznaczasz to, co masz"],
        ["tekst z listą w innym języku", "produkty w języku Twojej aplikacji"],
      ],
      outro:
        "Za każdym razem produkty są już rozłożone na 24 alejki. Poprzednie listy Kangur liczy sam, bez modelu AI, choć też zużywają jedno użycie.",
    },
    {
      kind: "cards",
      tone: "mint",
      title: "Zasady, których AI u nas pilnuje",
      columns: 3,
      items: [
        {
          title: "Nie wymyśla ilości",
          body: "Jest „jajka 10 szt.”, będzie 10 szt. Nikt nie napisał ile, to nie będzie.",
        },
        {
          title: "Nie dopisuje od siebie",
          body: "„Na grilla” to dla niego nazwa listy, a nie pięć produktów do zgadnięcia.",
        },
        {
          title: "Pomija gadanie",
          body: "„Tylko nic nie zapomnij” nie trafia na listę. Ani buziak.",
        },
        {
          title: "Łączy dopiski",
          body: "„Jakieś chipsy” i „2 paczki cebulowych” z dwóch wiadomości to jedna pozycja.",
        },
        {
          title: "Szczegóły daje do notatki",
          body: "Na liście jest ser, a „w plastrach” stoi obok, małym drukiem.",
        },
        {
          title: "Nazywa listę",
          body: "Z zakupów na sobotę zrobi „Zakupy na weekend”. Nazwę zawsze zmienisz.",
        },
      ],
    },
    {
      kind: "text",
      title: "Gdzie AI się myli",
      slot: "kangur",
      body: [
        "Jak każdy, komu ktoś podyktował listę przez zamknięte drzwi.",
      ],
      list: [
        "**Niewyraźne pismo.** Może coś pominąć albo odczytać po swojemu.",
        "**Słowa, które znaczą dwie rzeczy.** „Krem” bywa do rąk i do ciasta. Bez dopisku AI wybierze za Ciebie.",
        "**Skróty tylko Waszego domu.** „Ten co zawsze” zna u Was każdy. AI nie.",
      ],
      outro:
        "Każdą pozycję zmienisz, przeniesiesz do innej alejki albo usuniesz. Gdy AI w ogóle nie odpowie, użycie wraca.",
    },
    {
      kind: "cards",
      tone: "cream",
      title: "Czego AI u nas nie robi",
      columns: 3,
      items: [
        { title: "Nie wybiera sklepu", body: "I nie porównuje cen. Lista jest ta sama, gdziekolwiek idziesz." },
        { title: "Nie kupuje za Ciebie", body: "Koszyk jest prawdziwy, na kółkach albo w ręku." },
        { title: "Nie czyta rozmów", body: "Widzi jeden obrazek albo tekst, który mu dasz. Reszta czatu jest poza kadrem." },
      ],
    },
    {
      kind: "text",
      title: "A zwykły czat z AI?",
      body: [
        "Też napisze listę zakupów. Potem trzeba ją skopiować, wysłać domownikom i przewijać w sklepie między mrożonkami a kasą.",
        "W Kangurze ta lista jest już wspólna, ułożona w alejki i do przesuwania kciukiem. AI kończy pracę, zanim wejdziesz do sklepu.",
      ],
    },
    {
      kind: "text",
      tone: "tinted",
      title: "Co trafia do AI",
      body: [
        "Obrazek albo tekst, który wybierzesz, i nazwy produktów z listy, do której go dodajesz, żeby nic się nie zdublowało. Odczytuje to dostawca AI (OpenAI).",
        "Kangur nie dołącza Twojego imienia ani e-maila, a obrazka nie zapisuje. [[safety|Więcej o bezpieczeństwie]].",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o listę zakupów z AI",
      items: [
        {
          q: "Czy Kangur z AI jest darmowy?",
          a: "Na start masz 10 użyć AI, nie odnawiają się. Ręczne listy, domownicy i tryb zakupów limitu nie mają. AI bez limitu daje Premium. [[pricing|Zobacz cennik]].",
        },
        {
          q: "Co to jest jedno użycie AI?",
          a: "Jedno zrobienie listy: jeden obrazek, jeden tekst albo do pięciu dań naraz. Nieważne, czy wyjdą 3 produkty, czy 30.",
        },
        {
          q: "Czy da się używać Kangura bez AI?",
          a: "Tak. Produkty wpisujesz ręcznie, Kangur podpowiada po dwóch literach, a alejki dobiera z własnego słownika.",
        },
        {
          q: "W jakich językach działa AI?",
          a: "W tych samych dziesięciu, co aplikacja: po polsku, angielsku, niemiecku, francusku, hiszpańsku, włosku, czesku, rosyjsku, ukraińsku i białorusku.",
        },
        {
          q: "Czy AI może się pomylić?",
          a: "Może. Dlatego na listę warto rzucić okiem, a każdą pozycję da się poprawić.",
        },
      ],
    },
  ],
  related: {
    title: "Zobacz to na przykładach",
    items: [
      { id: "photoList", label: "Lista zakupów ze zdjęcia", body: "Siedem wiadomości, jedna lista, krok po kroku." },
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Dwa dania, jedna sól i żadnej śmietany w carbonarze." },
      { id: "aisleTool", label: "Podział listy na alejki", body: "To samo bez AI, w przeglądarce i za darmo." },
    ],
  },
  closing: {
    lines: ["AI pisze listę.", "Koszyk pchasz Ty."],
    body: "Kangur - lista zakupów z AI. Dostępny na Android i iOS.",
  },
};

export const AI_LIST = typesetCopy(copy);
