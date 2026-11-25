import { typesetCopy } from "@/lib/marketing/typography";

/** Where every tool ends: three steps that take the list into the app. */
export const HANDOFF = typesetCopy({
  copy: "Kopiuj listę do Kangura",
  again: "Kopiuj jeszcze raz",
  onComputer: "Weź listę do telefonu",
  plainCopy: "Kopiuj listę",
  share: "Wyślij",
  steps: {
    copy: "Skopiuj listę",
    home: "Co masz w domu, odhacz na liście. Zostanie w szafce.",
    ticked: "Odhaczone zostają w szafce.",
    open: "W Kangurze stuknij „Schowek”",
    openBody:
      "Jest na ekranie Start, w „Szybkich akcjach”. Kangur wczyta listę i ułoży ją według alejek. Na iPhonie pozwól mu wkleić.",
    stores: "Nie masz jeszcze Kangura? Pobierz i załóż konto. Lista poczeka na tej stronie.",
    invite: "Zaproś domowników",
    inviteBody:
      "Od tej chwili lista jest wspólna. Każdy dopisuje i odhacza u siebie, a w sklepie produkty przesuwa się w prawo.",
    inviteLink: "Jak działa wspólna lista",
  },
  note: "Wczytanie to jedno z dziesięciu darmowych użyć AI. Przy długiej liście rzuć okiem, czy wszystko dojechało.",
  next: "Teraz w Kangurze stuknij „Schowek”.",
  nextLink: "Pokaż, gdzie to jest",
  screenAlt: "Ekran Start w Kangurze, Szybkie akcje: Zrzut ekranu, Schowek, Tekst i Z przepisu",
  qr: {
    title: "Lista jest na komputerze?",
    body: "Zeskanuj kod telefonem. Otworzy się ta sama lista i tam ją skopiujesz.",
    label: "Kod QR, który otwiera tę listę w telefonie",
    long: "Ta lista jest za długa na kod. Wyślij ją sobie, na przykład mailem, i skopiuj w telefonie.",
  },
  arrived: "To lista z komputera.",
  refused: "Ta przeglądarka nie pozwala kopiować przyciskiem. Przytrzymaj tekst poniżej i wybierz „Kopiuj”.",
  manual: "Lista do skopiowania",
  shareFailed: "Wysyłanie się nie otworzyło, więc tekst jest skopiowany.",
});

/** First line is what came out of the tool, the second is always the same jump. */
export const HOP = "Hop do Kangura.";
