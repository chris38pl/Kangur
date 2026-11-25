import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista ze zdjęcia",
  eyebrow: "Lista zakupów ze zdjęcia i zrzutu ekranu",
  lines: ["Ktoś już to napisał.", "Nie pisz drugi raz."],
  lead: [
    "Zrzut rozmowy albo zdjęcie kartki wystarczy. Kangur wypisze produkty, z ilościami, jeśli są, i ułoży je według alejek.",
    "W naszym teście siedem wiadomości zamieniło się w 22 pozycje. Buziak na listę nie trafił.",
  ],
  stores: "Na start 10 darmowych użyć AI, wspólnych dla całego domu. Bez reklam.",
  sections: [
    {
      kind: "custom",
      slot: "readings",
      title: "Ze zrzutu czatu na listę zakupów: siedem wiadomości, 22 pozycje",
      intro:
        "Przykład z naszych testów. Zrzut tej rozmowy za każdym razem dawał 22 pozycje.",
    },
    {
      kind: "steps",
      tone: "mint",
      title: "Jak zrobić listę zakupów ze zdjęcia albo zrzutu",
      slot: "start",
      items: [
        {
          title: "Zrób zrzut albo zdjęcie",
          body: "Cała lista na jednym obrazku. Jeśli wolisz, przytnij górę z imieniem.",
        },
        {
          title: "Wybierz „Zrzut ekranu” albo „Obraz”",
          body: "Pierwszy przycisk jest na ekranie głównym Kangura, drugi w oknie nowej listy. Potem „Wybierz z galerii” albo „Zrób zdjęcie”. Jeden obrazek naraz.",
        },
        {
          title: "Rzuć okiem na listę",
          body: "Produkty trafiają na nią bez pytania o każdy z osobna. Zbędny usuniesz, brakujący dopiszesz.",
        },
        {
          title: "Dołóż następny zrzut",
          body: "Do tej samej listy. Co już na niej jest, Kangur zwykle łączy, zamiast dopisywać drugi raz.",
        },
      ],
    },
    {
      kind: "cards",
      title: "Z jakiego zdjęcia da się zrobić listę zakupów",
      columns: 4,
      items: [
        {
          title: "Zrzut czatu",
          body: "Z dowolnego komunikatora. Kangur dostaje tylko obrazek, z rozmową się nie łączy.",
        },
        {
          title: "Kartka z lodówki",
          body: "Cała, płasko i w dobrym świetle. Magnes może zostać, byle nie na jajkach.",
        },
        {
          title: "Zrzut notatki",
          body: "Lista z notatnika też się nada. Nie trzeba jej przepisywać.",
        },
        {
          title: "Lista w innym języku",
          body: "Nazwy produktów zapisze w języku Twojej aplikacji.",
        },
      ],
    },
    {
      kind: "text",
      tone: "cream",
      title: "Kiedy zdjęcie nie wystarczy",
      slot: "kangur",
      body: ["Wolimy napisać to tutaj, niż żeby wyszło przy kasie."],
      list: [
        "**Niewyraźne pismo.** Im trudniej je odczytać Tobie, tym częściej AI coś pominie, pomyli albo dopisze.",
        "**„Coś na obiad” i „to, co zawsze”.** Kangur nie zgaduje, co masz na myśli. Od tego drugiego są „Poprzednie listy”.",
        "**Ilości, których nikt nie podał.** Jest „jajka 10 szt.”, będzie 10 szt. Nie ma, to nie ma.",
      ],
      outro: "Gdy AI nie odpowie albo zgłosi błąd, użycie wraca. Za pomyłkę nie.",
    },
    {
      kind: "text",
      title: "Co dzieje się z obrazkiem",
      body: [
        "Trafia do dostawcy AI (OpenAI), który odczytuje z niego produkty i przechowuje go według swoich zasad. Razem z nim idzie nazwa pliku i to, co już jest na tej liście: produkty, ilości i notatki, żeby nic się nie zdublowało. Kangur nie dołącza Twojego imienia ani e-maila. Zapisuje to, co AI odczytało, a obrazka nie.",
        "Z galerii wysyła tylko ten jeden obrazek, który wybierzesz. [[safety|Więcej o bezpieczeństwie]].",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o listę zakupów ze zdjęcia",
      items: [
        {
          q: "Czy działa ze zrzutem z każdego komunikatora?",
          a: "Tak. Kangur nie łączy się z żadnym komunikatorem, czyta tylko obrazek, który mu dasz.",
        },
        {
          q: "Czy muszę zatwierdzać każdy produkt?",
          a: "Nie. Produkty ze zrzutu, zdjęcia i tekstu trafiają na listę same. Każdy możesz potem zmienić, przenieść do innej alejki albo usunąć.",
        },
        {
          q: "Czy mogę dodać zdjęcie do listy, która już istnieje?",
          a: "Tak, w każdej chwili. Nowe produkty dołączą do tego, co już na niej jest.",
        },
        {
          q: "Czy da się bez zrzutu?",
          a: "Tak. Skopiuj wiadomość i wybierz „Tekst ze schowka”, zmieści się do 8000 znaków.",
        },
        {
          q: "Ile kosztuje lista ze zdjęcia?",
          a: "Jedno użycie AI za obrazek, także gdy wiadomości jest siedem. Na start jest 10 darmowych użyć na całą przestrzeń, czyli na wspólne listy domu, a Premium znosi limit. [[pricing|Zobacz cennik]].",
        },
      ],
    },
  ],
  related: {
    title: "Nie tylko zdjęcie",
    items: [
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Wpisujesz danie, odznaczasz to, co masz w domu." },
      { id: "aiList", label: "Lista zakupów z AI", body: "Co AI u nas robi, a czego nie robi wcale." },
      { id: "aisleTool", label: "Podział listy na alejki", body: "Darmowe narzędzie w przeglądarce, bez konta." },
    ],
  },
};

export const PHOTO_LIST = typesetCopy(copy);

/**
 * What became of each message, from the tests in the fact bank (7 bubbles, 22 items, every
 * time). Numbers are positions in the home page chat.
 */
export const READINGS = typesetCopy([
  { messages: [0, 1], verdict: "rozmowa", note: "Pomija. To nie są produkty." },
  { messages: [2], verdict: "20 pozycji", note: "Każda w swojej alejce. Przy jajkach zostaje „10 szt.”, przy kurczaku „1 kg”." },
  { messages: [3], verdict: "rozmowa", note: "Zostawia w spokoju. Buziaka też." },
  { messages: [4, 5], verdict: "1 pozycja", note: "Z dwóch wiadomości robi jedne chipsy, „2 paczki”." },
  { messages: [6], verdict: "1 pozycja", note: "Proszek do prania, alejka Sprzątanie. Że się skończył, wiadomo." },
] as const);

/** The last three messages next to the part of the list they became. */
export const HERO_MESSAGES = [4, 5, 6] as const;
