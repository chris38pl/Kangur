import type { Lines } from "@/lib/marketing/content/home-types";
import type { MarketingRouteId } from "@/lib/marketing/routes";
import { typesetCopy } from "@/lib/marketing/typography";

type Entry = {
  id: MarketingRouteId;
  label: string;
  body: string;
  /** What is inside besides the text. */
  tag: string;
  tone: "peach" | "mint" | "cream" | "sky";
};

const copy: {
  crumb: string;
  eyebrow: string;
  lines: Lines;
  lead: readonly string[];
  entries: readonly Entry[];
  topicsTitle: string;
  topics: readonly { id: MarketingRouteId; label: string; body: string }[];
} = {
  crumb: "Poradniki",
  eyebrow: "Poradniki o listach zakupów",
  lines: ["Krótkie,", "bo sklep zaraz zamykają."],
  lead: [
    "W każdym jest coś do użycia: kalkulator, narzędzie albo kartka do druku. Wszystko działa bez konta i bez aplikacji.",
  ],
  entries: [
    {
      id: "guideChristmas",
      label: "Lista zakupów na Wigilię i święta 2026",
      body: "Dwanaście dań przeliczonych na gości, terminy zakupów i wiadomość do rodziny, kto co przynosi.",
      tag: "Kalkulator",
      tone: "peach",
    },
    {
      id: "guideWeek",
      label: "Lista zakupów na tydzień",
      body: "Dla jednej osoby, dwóch i rodziny. Duże zakupy i mała dokupka, żeby nic nie zwiędło.",
      tag: "Kalkulator",
      tone: "mint",
    },
    {
      id: "aisleTool",
      label: "Lista z podziałem na kategorie",
      body: "Wklejasz listę, wyjmujesz alejki. Kolejność ustawiasz jak w swoim sklepie.",
      tag: "Narzędzie",
      tone: "sky",
    },
    {
      id: "guidePrint",
      label: "Lista zakupów do druku",
      body: "Cztery wzory w PDF: pusty, gotowy, na tydzień i na Wigilię.",
      tag: "4 kartki PDF",
      tone: "cream",
    },
  ],
  topicsTitle: "Jak to robi Kangur",
  topics: [
    { id: "sharedList", label: "Wspólna lista zakupów", body: "Jedna lista, wszyscy domownicy." },
    { id: "photoList", label: "Lista ze zdjęcia i zrzutu", body: "Siedem wiadomości, jedna lista." },
    { id: "recipeList", label: "Lista z przepisu", body: "Dwa dania, jedna sól." },
    { id: "aiList", label: "Lista zakupów z AI", body: "Co AI umie, a czego nie." },
  ],
};

export const GUIDES = typesetCopy(copy);
