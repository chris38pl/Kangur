import type { Lines } from "@/lib/marketing/content/home-types";
import type { MarketingRouteId } from "@/lib/marketing/routes";
import { typesetCopy } from "@/lib/marketing/typography";

type Entry = {
  id: MarketingRouteId;
  label: string;
  body: string;
  /** What it is, in a word. */
  tag: string;
  tone: "peach" | "mint" | "sky";
};

const copy: {
  crumb: string;
  eyebrow: string;
  lines: Lines;
  lead: readonly string[];
  entries: readonly Entry[];
  /** The fourth card: where every one of them ends. */
  after: { tag: string; title: string; body: string; link: string };
  topicsTitle: string;
  topics: readonly { id: MarketingRouteId; label: string; body: string }[];
} = {
  crumb: "Narzędzia",
  eyebrow: "Darmowe narzędzia do listy zakupów, bez konta",
  lines: ["Tu policzysz.", "W Kangurze odhaczysz."],
  lead: [
    "Trzy narzędzia w przeglądarce. Każde kończy się gotową listą, którą wczytujesz do aplikacji Kangur i dzielisz z domownikami.",
  ],
  entries: [
    {
      id: "christmasTool",
      label: "Lista zakupów na Wigilię i święta 2026",
      body: "Dwanaście dań przeliczonych na gości, terminy zakupów i wiadomość do rodziny, kto co przynosi.",
      tag: "Kalkulator",
      tone: "peach",
    },
    {
      id: "weekTool",
      label: "Lista zakupów na tydzień",
      body: "Dla jednej osoby, dwóch i rodziny. Duże zakupy, mała dokupka i pięć obiadów.",
      tag: "Kalkulator",
      tone: "mint",
    },
    {
      id: "aisleTool",
      label: "Lista zakupów z podziałem na kategorie",
      body: "Wklejasz listę, wyjmujesz alejki. Kolejność ustawiasz jak w swoim sklepie.",
      tag: "Alejki",
      tone: "sky",
    },
  ],
  after: {
    tag: "A potem",
    title: "Wczytaj do Kangura",
    body: "Kopiujesz listę, w aplikacji stukasz „Schowek” i zapraszasz domowników. Dalej lista jest wspólna, w telefonach.",
    link: "Jak działa wspólna lista",
  },
  topicsTitle: "Jak to robi Kangur",
  topics: [
    { id: "sharedList", label: "Wspólna lista zakupów", body: "Masło dopisane z kanapy, kupione przy lodówkach." },
    { id: "photoList", label: "Lista ze zdjęcia i zrzutu", body: "Siedem wiadomości, jedna lista." },
    { id: "recipeList", label: "Lista z przepisu", body: "Dwa dania, jedna sól." },
    { id: "aiList", label: "Lista zakupów z AI", body: "Co AI umie, a czego nie." },
  ],
};

export const TOOLS = typesetCopy(copy);
