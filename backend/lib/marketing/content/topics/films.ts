import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { typesetCopy } from "@/lib/marketing/typography";

/** The page with every narrated film. The films and their parts come from lib/marketing/films.ts. */
const copy: TopicCopy = {
  crumb: "Filmy",
  eyebrow: "Kangur krok po kroku",
  lines: ["Jedna funkcja,", "jeden krótki film."],
  lead: [
    "Każdy film pokazuje prawdziwą aplikację na telefonie, od pierwszego stuknięcia do gotowej listy. Żaden nie trwa dłużej niż pół minuty.",
    "Wybierz temat albo przewiń wszystkie. Lektor to syntezator mowy.",
  ],
  stores: "Na start 10 darmowych użyć AI, wspólnych dla całego domu. Bez reklam.",
  sections: [],
  related: {
    title: "Więcej o tym, co pokazują filmy",
    items: [
      { id: "photoList", label: "Lista zakupów ze zdjęcia", body: "Zrzut czatu albo zdjęcie kartki zamienia się w listę." },
      { id: "sharedList", label: "Wspólna lista zakupów", body: "Jedna lista na kilka telefonów, każdy dopisuje u siebie." },
      { id: "recipeList", label: "Lista zakupów z przepisu", body: "Wpisujesz danie, odznaczasz to, co masz w domu." },
    ],
  },
};

export const FILMS_PAGE = typesetCopy(copy);
