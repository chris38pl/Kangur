import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homePl: HomeCopy = {
  hero: {
    eyebrow: "Kangur - aplikacja do wspólnej listy zakupów",
    lines: ["Lista przyszła na czacie?", "Screen i po krzyku."],
    lead: "Zrób zrzut rozmowy. Kangur wypisze produkty, ułoży je według alejek i pokaże domownikom. W sklepie tylko przesuwasz palcem.",
    storesNote:
      "Na iPhone’a i Androida. Bez reklam. Na start 10 darmowych użyć AI.",
    playSmall: "POBIERZ Z",
    iosSmall: "POBIERZ W",
    chatLabel: "Przykładowa rozmowa, z której powstaje lista",
    screenAlt:
      "Ta sama lista w Kangurze: 22 pozycje, najpierw owoce i warzywa, potem nabiał",
  },
  chat: {
    contact: "Misiaczek ❤️",
    status: "aktywna teraz",
    messages: [
      ["me", "wychodzę z pracy, coś kupić?"],
      ["them", "tak! czekaj"],
      [
        "them",
        "mleko, jajka 10 szt, pomidory, papier toaletowy, ser żółty, chleb, masło, kurczak 1kg, płyn do naczyń, banany, makaron, cebula, passata 2x, jogurt naturalny, ziemniaki, czosnek, szynka, kawa, ogórki, karma dla pieska",
      ],
      ["them", "tylko nic nie zapomnij 😘"],
      ["them", "a jeszcze może jakieś chipsy"],
      ["them", "najlepiej weź 2 paczki cebulowych"],
      ["them", "aaa i proszek do prania bo się skończył"],
    ],
  },
  steps: {
    lines: ["Przepisywać?", "Szkoda życia."],
    items: [
      {
        pill: "Krok 1",
        title: "Zrób screena czatu",
        body: "Lista bywa w jednym dymku po przecinku, bywa w siedmiu z dopiskiem „aaa i proszek”. Jedno i drugie się nada.",
      },
      {
        pill: "Krok 2",
        title: "Kangur robi listę",
        body: "Wyłapuje produkty i ilości, a „tylko nic nie zapomnij 😘” zostawia w spokoju. Z tej rozmowy wyszły 22 pozycje.",
      },
      {
        pill: "Krok 3",
        title: "W sklepie przesuwasz",
        body: "W prawo: kupione. W lewo: nie było. Jedna ręka, jedna alejka, następna alejka.",
      },
    ],
    screenAlt:
      "Nagranie trybu zakupów w Kangurze: warzywa, a potem nabiał są przesuwane w prawo jako kupione, po każdej alejce pojawia się Kangur i napis Świetnie!",
  },
  ways: {
    lines: ["Nie ma czatu?", "Są inne sposoby."],
    intro:
      "Lista nie zawsze przychodzi w wiadomości. Czasem wisi na lodówce, a czasem siedzi komuś w głowie.",
    photo: {
      title: "Kartka z lodówki",
      body: "Zrób jej zdjęcie, Kangur przepisze. Przy bardzo niewyraźnym piśmie może się pomylić, więc rzuć okiem na wynik.",
      note: [
        "mleko, jajka 10",
        "papier toal.",
        "kurczak 1 kg ??",
        "masło (chyba jest?)",
        "coś na obiad",
      ],
    },
    dish: {
      title: "Danie na dziś",
      body: "Wpisz „carbonara” i „bruschetta”, dostaniesz składniki na jednej liście. Sól i pieprz raz, a nie dwa. To, co masz w domu, odznaczasz.",
      screenAlt:
        "Składniki carbonary w Kangurze, sól odznaczona, przycisk Dodaj 5 produktów",
    },
    usual: {
      title: "To, co zawsze",
      body: "Kangur zbiera produkty z pięciu ostatnich list i pokazuje, które wracają najczęściej. Zostawiasz te, których trzeba.",
      screenAlt:
        "Propozycja z historii w Kangurze: banany, pomidory, mleko, jajka i chleb, każde z dopiskiem Kupowane 5 razy",
    },
    typed: {
      title: "Z głowy",
      body: "Wpisz po przecinku, podyktuj albo wklej tekst ze schowka. Możesz też dodawać po jednym: Kangur podpowiada po dwóch literach.",
      chips: ["mleko", "chleb", "coś słodkiego"],
    },
  },
  together: {
    lines: ["Dwa telefony,", "jedna lista."],
    body: "Ktoś dopisuje masło z kanapy, ktoś kawę w drodze do sklepu. Po chwili jedno i drugie jest na liście u obojga.",
    points: [
      "Zapraszasz e-mailem, ile osób chcesz",
      "Zaproszenia nic nie kosztują",
      "iPhone i Android na jednej liście",
      "Telefon da znać, gdy ktoś zacznie zakupy",
    ],
    fact: {
      text: "W 57% domów z co najmniej dwojgiem dorosłych codzienne zakupy robi się wspólnie albo raz robi je jedno, raz drugie. Lista nie może mieszkać w jednej głowie.",
      source: "CBOS, lipiec 2026",
      href: "https://www.cbos.pl/PL/publikacje/news_tekst.php?nr=25/2026",
    },
    screenAlt:
      "Wspólna lista Zakupy na weekend na dwóch telefonach, na obu to samo 7 produktów",
    added: ["masło dodała Ola", "kawę dodał Tomek"],
  },
  summary: {
    lines: ["Awokado?", "Nie było."],
    body: "Po zakupach widać, co kupione, czego zabrakło i ile to trwało. Zanim ktoś zapyta.",
    screenAlt:
      "Podsumowanie zakupów w Kangurze: awokado i bułki na czerwonej liście Czego nie było",
  },
  price: {
    lines: ["Ile to kosztuje?", "Proszę, paragon."],
    body: "Listy, domownicy i tryb zakupów są za darmo. Płaci się tylko za AI bez limitu i dłuższą historię, i to raz za całą przestrzeń, a nie od osoby.",
    receiptLabel: "Cennik Kangura w formie paragonu",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Wspólne listy", price: "0,00" },
      { kind: "item", text: "Domownicy", note: "ilu chcesz", price: "0,00" },
      { kind: "item", text: "10 użyć AI na start", price: "0,00" },
      { kind: "item", text: "Reklamy", note: "nie prowadzimy", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium, pierwszy miesiąc", price: "0,00" },
      {
        kind: "item",
        text: "Premium, każdy kolejny",
        note: "AI bez limitu, 200 list w historii",
        price: "9,99",
      },
      { kind: "rule" },
      { kind: "total", text: "Na start", price: "0,00 zł" },
      { kind: "foot", text: "Reszty nie trzeba." },
    ],
    link: "Cały cennik",
  },
  maker: {
    lines: ["Kto za tym stoi?", "Jedna osoba z Poznania."],
    body: "Kangura robi jednoosobowa firma Krzysztof Krawiec Software. Bez działu reklam i bez sprzedawania danych.",
    points: [
      {
        title: "Nie czyta rozmów",
        body: "Widzi tylko ten zrzut, który wybierzesz.",
      },
      {
        title: "Nie zna kontaktów ani lokalizacji",
        body: "Nie prosi o nie, bo do listy zakupów nie są potrzebne.",
      },
      {
        title: "Nie ma reklam",
        body: "Utrzymuje się z Premium, a nie z Twojej uwagi.",
      },
    ],
    safetyLink: "Jakich zgód używa Kangur",
    aboutLink: "Skąd się wziął",
  },
  faq: {
    lines: ["Zanim pobierzesz,", "krótko."],
    items: [
      {
        q: "Co to jest Kangur?",
        a: "Kangur to aplikacja na iPhone’a i Androida do wspólnych list zakupów. Robi listę ze zrzutu czatu, zdjęcia kartki, nazwy dania, poprzednich list albo z tego, co wpiszesz, i układa produkty według alejek. Pomarańczowy kangur w turkusowej bluzie na ikonie to właśnie on.",
      },
      {
        q: "Czy Kangur jest za darmo?",
        a: "Tak, z jednym limitem: na start dostajesz 10 użyć AI i ten limit się nie odnawia. Ręczne listy, domownicy i tryb zakupów limitu nie mają. AI bez limitu daje Premium. [[pricing|Zobacz cennik]].",
      },
      {
        q: "Czy druga osoba musi za coś płacić?",
        a: "Nie. Zaproszenie jest darmowe, a Premium działa dla całej przestrzeni, czyli dla wszystkich domowników naraz.",
      },
      {
        q: "Czy Kangur czyta moje wiadomości?",
        a: "Nie. Nie ma dostępu do żadnego komunikatora. Widzi tylko ten jeden obrazek, który wybierzesz z galerii. Obrazek trafia do dostawcy AI (OpenAI), żeby odczytać listę, a Kangur go nie zapisuje.",
      },
      {
        q: "Co działa, gdy w sklepie nie ma zasięgu?",
        a: "Odhaczanie produktów na otwartej liście: zmiany czekają w telefonie i wysyłają się później. Tworzenie list i AI potrzebują internetu.",
      },
      {
        q: "Czy to ten Kangur od matematyki albo od zdalnego pulpitu?",
        a: "Ani jeden, ani drugi. Kangurów jest sporo, nasz umie tylko listy zakupów. Nie steruje telefonem ani komputerem i nikt od nas nie dzwoni. [[safety|Więcej o bezpieczeństwie]].",
      },
    ],
  },
  closing: {
    lines: ["Screen", "i po krzyku."],
    body: "Kangur - lista zakupów z AI. Dostępny na Android i iOS.",
    qrLabel: "Kod QR, który otwiera Kangura w Google Play albo App Store",
    qrHint: "Przy komputerze? Zeskanuj telefonem.",
  },
};
