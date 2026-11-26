import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

/** Every rule below is in the prompts (backend/features/ai) or in the test log. */
const copy: TopicCopy = {
  crumb: "Lista zakupów z AI",
  eyebrow: "Lista zakupów z AI, w aplikacji na telefon",
  lines: ["AI czyta bałagan.", "Ty czytasz listę."],
  lead: [
    "W Kangurze AI ma jedno zadanie: z wiadomości, kartki albo nazwy dania zrobić listę produktów w alejkach. Nie gada i nie doradza.",
    "Wspólne listy, odhaczanie i tryb zakupów działają bez AI.",
  ],
  stores: "Na start 10 darmowych użyć AI, wspólnych dla całego domu. Bez reklam.",
  sections: [
    {
      kind: "table",
      title: "Jak AI robi listę zakupów: co dajesz, co dostajesz",
      caption: "Co AI w Kangurze przyjmuje i co z tego robi",
      head: ["Dajesz", "Dostajesz"],
      rows: [
        ["[[photoList|zrzut czatu albo zdjęcie kartki]]", "produkty z ilościami, jeśli ktoś je podał"],
        ["wklejony, wpisany albo podyktowany tekst", "to samo"],
        ["[[recipeList|nazwy dań]], do pięciu", "składniki, z których odznaczasz to, co masz"],
        ["tekst z listą w innym języku", "produkty w języku Twojej aplikacji"],
      ],
      outro:
        "Za każdym razem produkty są już rozłożone na alejki, a alejek jest 24. „Poprzednie listy” Kangur liczy sam, bez modelu AI, choć też zużywają jedno użycie.",
    },
    {
      kind: "cards",
      tone: "mint",
      title: "Zasady, których AI u nas pilnuje",
      columns: 3,
      items: [
        {
          title: "Ilości bierze z tekstu",
          body: "Jest „jajka 10 szt.”, będzie 10 szt. Nikt nie napisał, ile? To nie będzie. Wyjątek to nazwy dań, tam ilość bywa podpowiedzią.",
        },
        {
          title: "„Na grilla” to nie produkt",
          body: "Taki dopisek staje się nazwą listy, a nie pięcioma produktami do zgadnięcia.",
        },
        {
          title: "Pomija gadanie",
          body: "„Tylko nic nie zapomnij” nie trafia na listę. Ani buziak.",
        },
        {
          title: "Łączy dopiski",
          body: "„Jakieś chipsy” i „2 paczki cebulowych” z dwóch wiadomości w testach zawsze były jedną pozycją.",
        },
        {
          title: "Szczegóły daje do notatki",
          body: "Na liście jest ser, a „w plastrach” stoi pod spodem, małym drukiem.",
        },
        {
          title: "Nazywa listę",
          body: "„Na grilla”, „Zakupy spożywcze i domowe” albo po prostu data. Nazwę zawsze zmienisz.",
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
        "**Niewyraźne pismo.** Może coś pominąć, pomylić albo dopisać.",
        "**Słowa, które znaczą dwie rzeczy.** „Krem” bywa do rąk i do ciasta. Bez dopisku AI wybierze za Ciebie.",
        "**Skróty tylko Waszego domu.** „Ten, co zawsze” zna u Was każdy. AI nie.",
      ],
      outro:
        "Każdą pozycję zmienisz, przeniesiesz do innej alejki albo usuniesz. Gdy AI nie odpowie albo zgłosi błąd, użycie wraca. Za pomyłkę nie.",
    },
    {
      kind: "cards",
      tone: "cream",
      title: "Czego AI u nas nie robi",
      columns: 3,
      items: [
        { title: "Nie wybiera sklepu", body: "I nie porównuje cen. Lista jest ta sama, gdziekolwiek idziesz." },
        { title: "Nie kupuje za Ciebie", body: "Koszyk jest prawdziwy, na kółkach albo w ręku." },
        { title: "Nie wchodzi do rozmów", body: "Dostaje jeden obrazek albo tekst, który mu dasz. Reszta czatu jest poza kadrem." },
      ],
    },
    {
      kind: "text",
      title: "A zwykły czat z AI?",
      body: [
        "Też napisze listę zakupów. Potem trzeba ją skopiować, wysłać domownikom i przewijać w sklepie między mrożonkami a kasą.",
        "W Kangurze tę listę mają też domownicy, których zaprosisz: ułożoną w alejki i do przesuwania kciukiem. AI kończy pracę, zanim wejdziesz do sklepu.",
      ],
    },
    {
      kind: "text",
      tone: "tinted",
      title: "Co trafia do AI",
      body: [
        "Obrazek z nazwą pliku, tekst albo nazwy dań, które podasz, i to, co już jest na tej liście: produkty, ilości i notatki, żeby nic się nie zdublowało. Odczytuje to dostawca AI (OpenAI) i przechowuje według swoich zasad.",
        "Kangur nie dołącza Twojego imienia ani e-maila. Zapisuje to, co AI odczytało, a obrazka nie. [[safety|Więcej o bezpieczeństwie]].",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o listę zakupów z AI",
      items: [
        {
          q: "Czy Kangur z AI jest darmowy?",
          a: "Na start jest 10 użyć AI na całą przestrzeń, czyli na wspólne listy domu, i nie odnawiają się. Ręczne listy, domownicy i tryb zakupów limitu nie mają. AI bez limitu daje Premium. [[pricing|Zobacz cennik]].",
        },
        {
          q: "Co to jest jedno użycie AI?",
          a: "Jedna lista albo jedno dopisanie produktów: jeden obrazek, jeden tekst albo do pięciu dań naraz. Nieważne, czy wyjdą 3 produkty, czy 30.",
        },
        {
          q: "Czy AI ułoży jadłospis na tydzień?",
          a: "Nie. Dania wymyślasz Ty, do pięciu naraz, a AI wypisuje składniki. Gdy brak pomysłu, pięć obiadów z gotową listą jest w kalkulatorze [[weekTool|na tydzień]].",
        },
        {
          q: "Czy da się używać Kangura bez AI?",
          a: "Tak. Zaczynasz pisać, po dwóch literach Kangur podpowiada produkt, stukasz i alejka jest ustawiona. Czego nie ma w katalogu, temu wybierasz alejkę.",
        },
        {
          q: "W jakich językach działa AI?",
          a: "W tych samych dziesięciu co aplikacja, od polskiego po białoruski.",
        },
        {
          q: "Czy AI może się pomylić?",
          a: "Może, najczęściej przy niewyraźnym piśmie i słowach takich jak „krem”. Rzuć okiem na listę, zanim wyjdziesz.",
        },
      ],
    },
  ],
  related: {
    title: "Zobacz to na przykładach",
    items: [
      { id: "photoList", label: "Lista zakupów ze zdjęcia", body: "Siedem wiadomości, jedna lista, krok po kroku." },
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Dwa dania, jedna sól i żadnej śmietany w carbonarze." },
      { id: "aisleTool", label: "Podział listy na alejki", body: "Te same alejki bez AI, w przeglądarce i za darmo." },
    ],
  },
  closing: {
    lines: ["AI pisze listę.", "Koszyk pchasz Ty."],
    body: "Reszta jest bez AI: wspólna lista, alejki i kciuk. Na Android i iOS.",
  },
};

export const AI_LIST = typesetCopy(copy);

/** Position in the home page chat: the message that never becomes a product. */
export const AI_HERO_MESSAGE = 3;
