import { typesetCopy } from "@/lib/marketing/typography";

/**
 * Where every tool ends: three steps that take the list into the app. The first line of the
 * heading says what came out of the tool, the second is always the same jump.
 */
export const HANDOFF = typesetCopy({
  jump: "Hop do Kangura",
  hop: "Hop do Kangura.",
  arrived: "To lista z komputera.",
  back: "Wróć do poprzedniej",

  copy: {
    title: "Skopiuj listę",
    titleComputer: "Weź listę do telefonu",
    home: "Co masz w domu, odhacz wyżej na liście. Zostanie w szafce.",
    ticked: "Odhaczone zostają w szafce.",
    trips: {
      2: "Dwa wyjścia do sklepu, dwie listy w Kangurze.",
      3: "Trzy wyjścia do sklepu, trzy listy w Kangurze.",
    } as Readonly<Record<number, string>>,
    parts: "Ta lista jest długa, więc skopiuj ją w częściach.",
    one: "Kopiuj listę do Kangura",
    part: "Kopiuj",
    done: "Skopiowane",
    whole: "Wolisz jedną listę? Kopiuj wszystko",
    share: "Wyślij w wiadomości",
    here: "Albo skopiuj ją tutaj.",
    next: "Teraz w Kangurze stuknij „Schowek”.",
    more: "Teraz w Kangurze stuknij „Schowek”, a potem wróć tu po następną.",
    computer: "Skopiowane. Możesz wkleić ją do maila albo notatki.",
    refused:
      "Ta przeglądarka nie pozwala kopiować przyciskiem. Przytrzymaj tekst poniżej i wybierz „Kopiuj”.",
    manual: "Lista do skopiowania",
    shareFailed: "Wysyłanie się nie otworzyło, więc tekst jest skopiowany.",
  },

  open: {
    title: "W Kangurze stuknij „Schowek”",
    body: "Jest na ekranie Start, w „Szybkich akcjach”. Kangur wczyta listę i ułoży ją według alejek. Na iPhonie pozwól mu wkleić.",
    alt: "Ekran Start w Kangurze, Szybkie akcje: Zrzut ekranu, Schowek, Tekst i Z przepisu",
    stores: "Nie masz jeszcze Kangura? Pobierz i załóż konto. Lista poczeka na tej stronie.",
  },

  invite: {
    title: "Zaproś domowników",
    titleFamily: "Zaproś rodzinę",
    body: "Od tej chwili lista jest wspólna. Każdy dopisuje i odhacza u siebie, a w sklepie przesuwa produkt w prawo.",
    alt: "Ekran Start w Kangurze, Aktywna przestrzeń: Dom i troje domowników",
    link: "Jak działa wspólna lista",
  },

  note: "Każde wczytanie to jedno z dziesięciu darmowych użyć AI. Potem rzuć okiem, czy wszystko dojechało.",

  qr: {
    body: "Zeskanuj kod telefonem. Otworzy się ta sama lista i tam ją skopiujesz.",
    label: "Kod QR, który otwiera tę listę w telefonie",
    long: "Ta lista jest za długa na kod. Skopiuj ją tutaj i wyślij sobie, na przykład mailem.",
  },
});
