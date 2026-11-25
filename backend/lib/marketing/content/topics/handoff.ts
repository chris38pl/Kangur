import { typesetCopy } from "@/lib/marketing/typography";

/**
 * Where every tool ends: three steps that take the list into the app. The first line of the
 * heading says what came out of the tool, the second one where it goes.
 */
export const HANDOFF = typesetCopy({
  jump: "Wczytaj do Kangura",
  /** Second line of the heading, after "Oto Wasze dania." and "Oto Wasz tydzień.". */
  loadThem: "Wczytaj je do Kangura.",
  loadIt: "Wczytaj go do Kangura.",
  arrived: "To lista z komputera.",
  back: "Przywróć poprzednią listę",

  copy: {
    title: "Skopiuj listę",
    titleComputer: "Weź listę do telefonu",
    home: "Masz coś w domu? Zaznacz to wyżej na liście, a nie trafi do Kangura.",
    ticked: "Zaznaczonych produktów nie kopiujemy, bo masz je w domu.",
    all: "Zaznaczone jest wszystko, więc kopiujemy całą listę. Odznacz to, czego brakuje.",
    trips: {
      2: "Dwa wyjścia do sklepu, dwie listy w Kangurze, dwa użycia AI.",
      3: "Trzy wyjścia do sklepu, trzy listy w Kangurze, trzy użycia AI.",
    } as Readonly<Record<number, string>>,
    parts: "Ta lista jest długa, więc Kangur wczyta ją w częściach.",
    one: "Kopiuj listę",
    part: "Kopiuj",
    done: "Skopiowane",
    whole: "Wolisz jedną listę? Kopiuj wszystko",
    share: "Wyślij w wiadomości",
    here: "Nie zeskanujesz? Skopiuj listę i wyślij ją sobie.",
    next: "Teraz w Kangurze stuknij „Schowek”.",
    more: "Teraz w Kangurze stuknij „Schowek”, a potem wróć tu po następną listę.",
    computer: "Wyślij ją sobie, a w telefonie skopiuj i stuknij „Schowek”.",
    refused:
      "Ta przeglądarka nie pozwala kopiować przyciskiem. Przytrzymaj tekst poniżej i wybierz „Kopiuj”.",
    manual: "Lista do skopiowania",
    shareFailed: "Nie udało się otworzyć wysyłania. Tekst jest skopiowany, wklej go w wiadomości.",
  },

  open: {
    title: "W Kangurze stuknij „Schowek”",
    body: "To kafelek z wózkiem na ekranie Start, w „Szybkich akcjach”. Kangur wczyta listę i ułoży ją według alejek. Na iPhonie pozwól mu wkleić. Jeśli napisze, że schowek jest pusty, stuknij jeszcze raz.",
    alt: "Ekran Start w Kangurze, Szybkie akcje: Zrzut ekranu, Schowek, Tekst i Z przepisu",
    stores: "Nie masz jeszcze Kangura? To darmowa aplikacja do wspólnej listy zakupów. Pobierz ją, załóż konto i wróć tu po listę.",
  },

  invite: {
    title: "Zaproś domowników",
    body: "W Kangurze w zakładce „Przestrzeń” wpisz e-mail domownika i wyślij zaproszenie. Kto je przyjmie, ma tę listę u siebie: dopisuje do niej, a w sklepie przesuwa kupione w prawo.",
    alt: "Ekran Start w Kangurze, Aktywna przestrzeń: Dom i troje domowników",
    link: "Jak działa wspólna lista",
  },

  /** One person has nobody to invite, but still goes to the shop. */
  alone: {
    title: "Idź na zakupy",
    body: "Na liście w Kangurze stuknij „Zacznij zakupy” i przesuwaj kupione w prawo, alejka po alejce. Ktoś czasem robi zakupy za Ciebie? Zaproś tę osobę w zakładce „Przestrzeń”.",
  },

  family: {
    title: "Wiadomość do rodziny",
    body: "Zaproszona osoba widzi wszystkie listy domu, nie tylko świąteczne. Dalszej rodzinie wystarczy wiadomość, kto co przynosi.",
    empty: "Przy daniach, które ktoś przyniesie, ustaw „Ktoś przynosi”. Ułożymy wiadomość do rodziny.",
  },

  note: "Każde wczytanie to jedno z dziesięciu darmowych użyć AI. Potem sprawdź na liście, czy wszystko jest.",

  qr: {
    body: "Zeskanuj kod telefonem. Otworzy się ta sama lista i tam ją skopiujesz.",
    label: "Kod QR, który otwiera tę listę w telefonie",
    long: "Ta lista jest za długa na kod. Skopiuj ją tutaj i wyślij sobie, na przykład mailem.",
  },
});
