import type { AisleWord } from "@/lib/marketing/aisles/dictionary";
import { AISLE_LABELS } from "@/lib/marketing/aisles/labels";
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
  if (words.some((word) => /^mroż(?:on|ąc)/u.test(word))) return "frozen";
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
const QUANTITY_ONLY = new RegExp(`^(?:x\\s*)?(?:${NUMBER})\\s*(?:${UNIT})?$`, "iu");
const QUANTITY_FIRST = new RegExp(`^(?:x\\s*)?(${NUMBER})\\s*(${UNIT})?(?=\\s|$)\\s*(.+)$`, "iu");
const QUANTITY_LAST = new RegExp(`^(.+?)[\\s:,-]+(?:x\\s*)?((?:${NUMBER})\\s*(?:${UNIT})?|x\\s*\\d+)$`, "iu");
const UNIT_FIRST = new RegExp(
  `^((?:pacz|pusz|butel|kost|torebk|zgrzewk|rolk|główk)(?:a|kę|ka|ę|ki)?|słoik|karton|bochenek|pęczek|kubek|woreczek)\\s+(.+)$`,
  "iu",
);

/** "Chleb 1,5 kg (krojony)": the amount is not at the very end. */
const NOTE = /^(.*\S)\s+(\([^()]+\))$/u;

function parseQuantity(raw: string): { name: string; quantity: string | null } {
  const noted = NOTE.exec(raw);
  if (noted) {
    const { name, quantity } = parseQuantity(noted[1]);
    if (quantity) return { name, quantity: `${quantity} ${noted[2]}` };
  }
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

/** Emoji with everything that travels with them: skin tones, joiners, keycaps. */
const EMOJI = /[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}\uFE0E\uFE0F\u200B-\u200D\u2060]/gu;
/** Nobody writes a product longer than this, and a pasted page must not freeze a phone. */
const LONGEST = 160;

function clean(part: string): string {
  return part
    .slice(0, LONGEST)
    .replace(EMOJI, "")
    .replace(/^[\s\-*•·–—>→+.✓✔☐☑□▪▢◦○●❑❏]+/u, "")
    .replace(/^\[[ xX]?\]\s*/, "")
    .replace(/^\d+[.)]\s*(?=\p{L})/u, "")
    .replace(/[!?.;:\s–—-]{1,40}$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The dot of "szt." goes away with the other punctuation at the end of a line. */
const tidyQuantity = (quantity: string) => quantity.replace(/(szt|opak|op)(?=$| \()/u, "$1.");

function capitalise(name: string): string {
  return name ? name[0].toLocaleUpperCase("pl") + name.slice(1) : name;
}

const BULLET = /^\s*(?:(?:[-*•·–—→+]|\[[ xX]?\])\s+|[✓✔☐☑□▪▢◦○●❑❏]\uFE0F?\s*)\S/u;
const AISLE_NAMES: ReadonlySet<string> = new Set(Object.values(AISLE_LABELS).map(lower));
/** First line of a list copied from our own tools. */
const OWN_TITLE = /^lista zakupów(?: na (?:tydzień|wigilię|cztery dni)[^\n]*)?$/iu;

/**
 * Drops what is not a product in a list that was copied as a list: a title right above a
 * bullet (in capitals, with a colon, or the name of an aisle), and the name of the whole list.
 */
function withoutHeadings(lines: readonly string[]): string[] {
  const filled = lines.filter((line) => line.trim());
  const heading = filled.map((line, i) => {
    const bare = line.trim();
    if (BULLET.test(line) || !/\p{L}/u.test(bare)) return false;
    if (OWN_TITLE.test(bare)) return true;
    if (!BULLET.test(filled[i + 1] ?? "")) return false;
    return bare === bare.toLocaleUpperCase("pl") || bare.endsWith(":") || AISLE_NAMES.has(lower(bare));
  });
  if (heading[1] && !BULLET.test(filled[0] ?? "")) heading[0] = true;
  return filled.filter((_, i) => !heading[i]);
}

/** A comma between digits, kept out of the way while the list is split. */
const DECIMAL = "\u0001";

/**
 * Lines, commas and semicolons; "1,5 l" stays in one piece. A line with a bullet is one
 * product, whatever commas are in it. `whole` tells the caller not to split it further.
 */
export function splitList(text: string): { text: string; whole: boolean }[] {
  const lines = withoutHeadings(text.replace(/[\u00a0\u202f]/g, " ").split(/\r?\n/));
  const bullets = lines.filter((line) => BULLET.test(line)).length;
  const result: { text: string; whole: boolean }[] = [];
  for (const line of lines) {
    if (bullets >= 2 && BULLET.test(line)) {
      result.push({ text: clean(line), whole: true });
      continue;
    }
    const parts = line
      .replace(/(\d),(?=\d)/g, `$1${DECIMAL}`)
      // Not inside brackets: "bakalie (rodzynki, orzechy)" is one product.
      .split(/;|•|·|\t|,(?![^()]*\))|\s\+\s/u);
    for (const raw of parts) {
      const part = clean(raw.split(DECIMAL).join(","));
      if (!part) continue;
      // "mleko, 2 l": the amount belongs to what stands before it.
      if (result.length > 0 && QUANTITY_ONLY.test(part)) {
        result[result.length - 1].text += ` ${part}`;
      } else {
        result.push({ text: part, whole: false });
      }
    }
  }
  return result.filter((part) => /\p{L}/u.test(part.text));
}

export function sortByAisles(text: string, index: AisleIndex): SortedItem[] {
  const items: SortedItem[] = [];
  const push = (raw: string) => {
    const trimmed = clean(raw.replace(LEADING_FILLER, ""));
    // "Kostki rosołowe" are a product, not some cubes of "rosołowe".
    const { name, quantity } = index.exact.has(lower(trimmed))
      ? { name: trimmed, quantity: null }
      : parseQuantity(trimmed);
    const bare = clean(name.replace(LEADING_FILLER, ""));
    if (!bare) return;
    const aisle = findAisle(index, bare);
    items.push({
      id: `${items.length}`,
      name: capitalise(bare),
      quantity: quantity === null ? null : tidyQuantity(quantity),
      aisle: aisle ?? "other",
      recognised: aisle !== null,
    });
  };

  for (const { text: part, whole } of splitList(text)) {
    // "chleb i masło" is two products, "kapusta z grochem i grzybami" is one dish.
    const halves = whole || /\sze?\s/iu.test(part)
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
