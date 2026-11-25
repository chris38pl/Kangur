import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

const copy: TopicCopy = {
  crumb: "Lista ze zdjęcia",
  eyebrow: "Lista zakupów ze zdjęcia i zrzutu ekranu",
  lines: ["Ktoś już to napisał.", "Nie pisz drugi raz."],
  lead: [
    "Zrzut rozmowy albo zdjęcie kartki wystarczy. Kangur wypisze produkty z ilościami i ułoży je według alejek.",
    "Jeden obrazek to jedno użycie AI, także gdy wiadomości jest siedem. Na start masz 10 użyć za darmo.",
  ],
  sections: [
    {
      kind: "custom",
      slot: "readings",
      title: "Co Kangur robi z siedmiu wiadomości",
      intro:
        "Przykład z naszych testów. Zrzut tej rozmowy za każdym razem dawał 22 pozycje.",
    },
    {
      kind: "steps",
      tone: "mint",
      title: "Jak zrobić listę ze zrzutu ekranu",
      slot: "ways",
      items: [
        {
          title: "Zrób zrzut albo zdjęcie",
          body: "Cała lista na jednym obrazku. Jeśli wolisz, przytnij górę z imieniem.",
        },
        {
          title: "Wybierz „Zrzut ekranu” albo „Obraz”",
          body: "Pierwszy przycisk jest na ekranie głównym Kangura, drugi w oknie nowej listy. Jeden obrazek naraz, do 8 MB.",
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
      title: "Jaki obrazek się nada",
      columns: 4,
      items: [
        {
          title: "Zrzut czatu",
          body: "Z dowolnego komunikatora. Kangur widzi tylko obrazek, z niczym się nie łączy.",
        },
        {
          title: "Kartka z lodówki",
          body: "Cała, płasko i w dobrym świetle. Magnes może zostać, byle nie na jajkach.",
        },
        {
          title: "Zrzut notatki",
          body: "Lista w notatniku to też obrazek. Nie trzeba jej przepisywać.",
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
        "**Niewyraźne pismo.** Im trudniej je odczytać Tobie, tym częściej AI coś pominie albo dopisze po swojemu.",
        "**„Coś na obiad” i „to, co zawsze”.** Kangur nie zgaduje, co masz na myśli. Od tego drugiego są Poprzednie listy.",
        "**Ilości, których nikt nie podał.** Jest „jajka 10 szt.”, będzie 10 szt. Nie ma, to nie ma.",
      ],
      outro: "Gdy AI w ogóle nie odpowie, użycie wraca na konto.",
    },
    {
      kind: "text",
      title: "Co dzieje się z obrazkiem",
      body: [
        "Trafia do dostawcy AI (OpenAI), żeby odczytać produkty. Razem z nim idą nazwy z listy, do której go dodajesz, żeby nic się nie zdublowało. Kangur nie dołącza Twojego imienia ani e-maila i obrazka nie zapisuje.",
        "Z galerii widzi tylko ten jeden obrazek, który wybierzesz. [[safety|Więcej o bezpieczeństwie]].",
      ],
    },
    {
      kind: "faq",
      title: "Pytania o listę ze zdjęcia",
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
          q: "Ile to kosztuje?",
          a: "Jedno użycie AI za obrazek. Na start masz 10 użyć za darmo, a Premium znosi limit. [[pricing|Zobacz cennik]].",
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
  { messages: [3], verdict: "rozmowa", note: "Zostawia w spokoju. Buziak też." },
  { messages: [4, 5], verdict: "1 pozycja", note: "Z dwóch wiadomości robi jedne chipsy, „2 paczki”." },
  { messages: [6], verdict: "1 pozycja", note: "Proszek do prania, alejka Sprzątanie. Że się skończył, wiadomo." },
] as const);
