import type { AisleWord } from "@/lib/marketing/aisles/dictionary";
import { SHOPPING_CATEGORIES, type ShoppingCategory } from "@shared/shopping-categories";

/**
 * Splits a pasted shopping list into products and finds the aisle of each one. Runs in the
 * browser, with no AI and no request: a dictionary plus a light Polish stemmer.
 */

export type SortedItem = {
  id: string;
  name: string;
  quantity: string | null;
  aisle: ShoppingCategory;
  /** False when no word was recognised and the product went to "Inne". */
  recognised: boolean;
};

export type AisleGroup = { aisle: ShoppingCategory; items: SortedItem[] };

const DIACRITICS: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

const lower = (text: string) => text.toLocaleLowerCase("pl");
const plain = (text: string) => text.replace(/[ąćęłńóśźż]/g, (c) => DIACRITICS[c]);

/** Words that say nothing about the product. */
const STOP_WORDS = new Set([
  "z", "ze", "do", "w", "we", "na", "i", "oraz", "dla", "bez", "od", "po", "o", "lub", "albo",
  "jakieś", "jakiś", "jakąś", "jakies", "jakis", "kilka", "parę", "pare", "trochę", "troche",
  "może", "moze", "jeszcze", "też", "tez", "weź", "wez", "kup", "kupić", "kupic", "proszę", "prosze",
  "najlepiej", "duże", "duży", "duża", "małe", "mały", "mała", "świeży", "świeża", "świeże", "dobry", "dobra", "dobre",
]);

/** Longest first, so "pomidorami" loses "ami" and not only "i". */
const ENDINGS = [
  "owymi", "owych", "owego", "owej", "ami", "ach", "ego", "emu", "ych", "ich", "ymi", "imi",
  "ów", "ow", "om", "em", "ią", "ię", "ie", "ia", "iu", "ii", "io", "ej", "ą", "ę",
  "a", "e", "i", "o", "u", "y",
];

/** Rough stem, enough to see that "pomidorów", "pomidory" and "pomidor" are one product. */
export function stem(word: string): string {
  let s = word;
  if (s.length > 3) {
    for (const ending of ENDINGS) {
      if (s.endsWith(ending) && s.length - ending.length >= 3) {
        s = s.slice(0, -ending.length);
        break;
      }
    }
  }
  // jajek → jajk, bułek → bułk, ogórek → ogórk: the "e" that disappears in other forms.
  if (s.length > 4) s = s.replace(/([^aeiouyąęó])e([kcń])$/, "$1$2");
  return s;
}

function tokens(phrase: string): string[] {
  return lower(phrase)
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .split(" ")
    .filter((t) => t && !STOP_WORDS.has(t));
}

type Entry = {
  exact: string;
  stems: string[];
  plainStems: string[];
  aisle: ShoppingCategory;
};

export type AisleIndex = {
  exact: Map<string, ShoppingCategory>;
  plainExact: Map<string, ShoppingCategory>;
  entries: Entry[];
};

export function buildAisleIndex(words: readonly AisleWord[]): AisleIndex {
  const exact = new Map<string, ShoppingCategory>();
  const plainExact = new Map<string, ShoppingCategory>();
  const entries: Entry[] = [];
  for (const [phrase, aisle] of words) {
    const key = lower(phrase);
    if (!exact.has(key)) exact.set(key, aisle);
    const bare = plain(key);
    if (!plainExact.has(bare)) plainExact.set(bare, aisle);
    const stems = tokens(phrase).map(stem);
    if (stems.length > 0) {
      entries.push({ exact: key, stems, plainStems: stems.map(plain), aisle });
    }
  }
  return { exact, plainExact, entries };
}

/**
 * "cebulowe chipsy" are chips. A word that looks like an adjective decides only when no
 * noun in the phrase is known.
 */
const ADJECTIVE =
  /(?:ow(?:y|a|e|ych|ymi|ego|emu|ej|ą)|(?:n|cz|sk|ck)(?:ych|ymi|ego|emu)|ian(?:y|e|ych|ego|ej)|n(?:y|e|ej))$/u;

function isHigher(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

/**
 * The entry that explains most of the phrase: more words win, then nouns, then the one
 * whose first word comes earliest ("ser żółty w plastrach" is cheese, not plasters).
 */
function bestByStems(
  index: AisleIndex,
  words: readonly string[],
  key: "stems" | "plainStems",
): ShoppingCategory | null {
  const stems = words.map((word) =>
    key === "stems" ? stem(word) : plain(stem(word)),
  );
  let best: { aisle: ShoppingCategory; score: readonly number[] } | null = null;
  for (const entry of index.entries) {
    const wanted = entry[key];
    if (wanted.length > stems.length) continue;
    const at = stems.indexOf(wanted[0]);
    if (at === -1 || !wanted.every((s) => stems.includes(s))) continue;
    const score = [
      wanted.length,
      wanted.length === 1 && ADJECTIVE.test(words[at]) ? 0 : 1,
      -at,
      -entry.exact.length,
    ];
    if (!best || isHigher(score, best.score)) best = { aisle: entry.aisle, score };
  }
  return best?.aisle ?? null;
}

export function findAisle(index: AisleIndex, name: string): ShoppingCategory | null {
  const key = lower(name).trim();
  const direct = index.exact.get(key) ?? index.plainExact.get(plain(key));
  if (direct) return direct;

  const words = tokens(name);
  if (words.length === 0) return null;
  return (
    bestByStems(index, words, "stems") ?? bestByStems(index, words, "plainStems")
  );
}

const UNIT =
  "x|szt\\.?|sztuk[ai]?|sztuki|kg|kilo(?:gram(?:y|ów)?)?|dag|deko|g|gram(?:y|ów)?|l|litr(?:y|ów|a)?|ml|" +
  "op\\.?|opak\\.?|opakowani[ae]|opakowań|pacz(?:ka|ki|kę|ek)|pusz(?:ka|ki|kę|ek)|butel(?:ka|ki|kę|ek)|" +
  "słoik(?:i|ów)?|kost(?:ka|ki|kę|ek)|główk(?:a|i|ę)|główek|pęcz(?:ek|ki|ków)|torebk(?:a|i|ę)|torebek|" +
  "zgrzewk(?:a|i|ę)|zgrzewek|karton(?:y|ów)?|bochen(?:ek|ki|ków)|rolk(?:a|i|ę)|rolek|ząb(?:ek|ki|ków)|" +
  "tackę|tack(?:a|i)|tacek|woreczek|woreczki|kubk(?:i|ów)|kubek|plast(?:er|ry|rów)";
const NUMBER = "\\d+(?:[.,]\\d+)?(?:\\s*-\\s*\\d+)?|pół|półtora";
const QUANTITY_FIRST = new RegExp(`^(?:x\\s*)?(${NUMBER})\\s*(${UNIT})?(?=\\s|$)\\s*(.+)$`, "iu");
const QUANTITY_LAST = new RegExp(`^(.+?)[\\s:,-]+(?:x\\s*)?((?:${NUMBER})\\s*(?:${UNIT})?|x\\s*\\d+)$`, "iu");
const UNIT_FIRST = new RegExp(
  `^((?:pacz|pusz|butel|kost|torebk|zgrzewk|rolk|główk)(?:a|kę|ka|ę|ki)?|słoik|karton|bochenek|pęczek|kubek|woreczek)\\s+(.+)$`,
  "iu",
);

function parseQuantity(raw: string): { name: string; quantity: string | null } {
  const first = QUANTITY_FIRST.exec(raw);
  if (first?.[3]) {
    const unit = first[2] && !/^x$/i.test(first[2]) ? ` ${first[2]}` : "";
    return { name: first[3], quantity: `${first[1]}${unit}` };
  }
  const last = QUANTITY_LAST.exec(raw);
  if (last) {
    const quantity = last[2].replace(/^x\s*/i, "").replace(/\s*x$/i, "").trim();
    return { name: last[1], quantity };
  }
  const unit = UNIT_FIRST.exec(raw);
  if (unit) return { name: unit[2], quantity: `1 ${lower(unit[1])}` };
  return { name: raw, quantity: null };
}

/** "aaa i jeszcze jakieś chipsy" → "chipsy". */
const LEADING_FILLER =
  /^(?:(?:a+|no|to|i|oraz|też|tez|jeszcze|może|moze|aha|ej|hej|o+|aaa+i?|weź|wez|kup|kupisz|proszę|prosze|najlepiej|plus|jakieś|jakies|jakiś|jakis|jakąś|trochę|troche)[\s,:-]+)+/iu;

function clean(part: string): string {
  return part
    .replace(/^[\s\-*•·–—>✓✔☐☑□▪◦]+/u, "")
    .replace(/^\[[ xX]?\]\s*/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[!?.;:]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalise(name: string): string {
  return name ? name[0].toLocaleUpperCase("pl") + name.slice(1) : name;
}

/** A comma between digits, kept out of the way while the list is split. */
const DECIMAL = "\u0001";

/** Lines, commas, semicolons and bullets; "1,5 l" stays in one piece. */
export function splitList(text: string): string[] {
  return text
    .replace(/(\d),(?=\d)/g, `$1${DECIMAL}`)
    .split(/\r?\n|;|•|·|\t|,|\s\+\s/u)
    .map((part) => clean(part.split(DECIMAL).join(",")))
    .filter((part) => /\p{L}/u.test(part));
}

export function sortByAisles(text: string, index: AisleIndex): SortedItem[] {
  const items: SortedItem[] = [];
  const push = (raw: string) => {
    const trimmed = clean(raw.replace(LEADING_FILLER, ""));
    const { name, quantity } = parseQuantity(trimmed);
    const bare = clean(name.replace(LEADING_FILLER, ""));
    if (!bare) return;
    const aisle = findAisle(index, bare);
    items.push({
      id: `${items.length}`,
      name: capitalise(bare),
      quantity,
      aisle: aisle ?? "other",
      recognised: aisle !== null,
    });
  };

  for (const part of splitList(text)) {
    // "chleb i masło" is two products, "kapusta z grochem i grzybami" is one dish.
    const halves = /\sze?\s/iu.test(part)
      ? [part]
      : part.split(/\s+(?:i|oraz)\s+/iu);
    if (
      halves.length > 1 &&
      !index.exact.has(lower(part)) &&
      halves.every((half) => findAisle(index, parseQuantity(clean(half.replace(LEADING_FILLER, ""))).name))
    ) {
      halves.forEach(push);
    } else {
      push(part);
    }
  }
  return items;
}

/** Groups in the order of the aisles, products in the order they were written. */
export function groupByAisle(
  items: readonly SortedItem[],
  order: readonly ShoppingCategory[] = SHOPPING_CATEGORIES,
): AisleGroup[] {
  return order
    .map((aisle) => ({ aisle, items: items.filter((item) => item.aisle === aisle) }))
    .filter((group) => group.items.length > 0);
}
