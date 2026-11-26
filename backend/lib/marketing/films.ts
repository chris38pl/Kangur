import { FILM_FILES, type FilmFile } from "@/lib/marketing/films.generated";
import type { MarketingRouteId } from "@/lib/marketing/routes";

/**
 * The narrated series "Kangur krok po kroku": one feature of the real app per film, in
 * Polish. Files and texts come from films.generated.ts, the rest is decided here.
 */
export type FilmId = keyof typeof FILM_FILES;
export type Film = FilmFile & { id: FilmId };

export function film(id: FilmId): Film {
  return { ...FILM_FILES[id], id };
}

/** In the order of the series. */
export const FILMS: readonly Film[] = (Object.keys(FILM_FILES) as FilmId[]).map(film);

/** Parts of the series as the films page shows them, with names for visitors. */
export const FILM_GROUPS = [
  {
    part: "A",
    id: "lista-powstaje-sama",
    label: "Lista powstaje sama",
    intro: "Ze zrzutu czatu, zdjęcia kartki, nazwy dania albo wpisanego tekstu.",
  },
  {
    part: "B",
    id: "lista-po-twojemu",
    label: "Lista po Twojemu",
    intro: "Ilości, notatki i zmiany na liście.",
  },
  {
    part: "C",
    id: "w-sklepie",
    label: "W sklepie",
    intro: "Alejka po alejce, odhaczanie i podsumowanie zakupów.",
  },
  {
    part: "D",
    id: "razem",
    label: "Razem",
    intro: "Jedna lista dla domu, rodziców i znajomych.",
  },
  {
    part: "E",
    id: "historia-i-konto",
    label: "Historia i konto",
    intro: "Powtórka zakupów, darmowe użycia AI i Premium.",
  },
] as const satisfies readonly { part: FilmFile["part"]; id: string; label: string; intro: string }[];

export type FilmGroup = (typeof FILM_GROUPS)[number];

export function filmGroup(item: Film): FilmGroup {
  const group = FILM_GROUPS.find((g) => g.part === item.part);
  if (!group) throw new Error(`No group for part ${item.part}`);
  return group;
}

/** The page that tells more about what the film shows, with its name in the footer. */
const TOPICS: Partial<Record<FilmId, { id: MarketingRouteId; label: string }>> = {};
const topic = (id: MarketingRouteId, label: string, films: readonly string[]) => {
  for (const key of films) if (key in FILM_FILES) TOPICS[key as FilmId] = { id, label };
};
topic("photoList", "Lista ze zdjęcia", ["L01", "L02", "L05"]);
topic("aiList", "Lista z AI", ["L03", "L04"]);
topic("recipeList", "Lista z przepisu", ["L06", "L07", "L08"]);
topic("aisleTool", "Podział listy na alejki", ["L17"]);
topic("sharedList", "Wspólna lista", ["L25", "L26", "L27", "L28", "L29"]);
topic("pricing", "Cennik", ["L35", "L36"]);

export function filmTopic(id: FilmId): { id: MarketingRouteId; label: string } | null {
  return TOPICS[id] ?? null;
}
