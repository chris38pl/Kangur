/**
 * The one place that decides what other people see as a person's name.
 *
 * Order: the name typed in Kangur or copied once from Clerk (both in User.displayName), then
 * the start of the e-mail when it looks like a first name, then nothing, and the caller shows
 * the fallback word ("Domownik"). An Apple relay address never becomes a name and never
 * appears in text for people. Pure: no Prisma, no Clerk, so tests run on plain Node.
 */

export const PRIVATE_RELAY_DOMAIN = "privaterelay.appleid.com";

/** Same limit as the name field in the app. */
export const DISPLAY_NAME_MAX = 30;

export function isPrivateRelayEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  return email.slice(at + 1).trim().toLowerCase() === PRIVATE_RELAY_DOMAIN;
}

/** Text that reads as an e-mail address, typed by mistake into a name field. */
export function looksLikeEmail(value: string): boolean {
  return /[^\s@]+@[^\s@]+/.test(value);
}

/** Control and invisible characters, which make two names look alike. Joiners stay: emoji need them. */
const INVISIBLE = /[\u0000-\u001f\u007f\u200b\u200e\u200f\u2028-\u202e\u2060-\u2064\ufeff]/g;

/** Trim, one space between words, no control or zero-width characters. */
export function normalizeNameInput(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type NameCheck =
  | { ok: true; name: string }
  | { ok: false; reason: "empty" | "too_long" | "email" };

/** A name a person types in Kangur: 1 to 30 characters and not an address. */
export function checkDisplayName(raw: string | null | undefined): NameCheck {
  const name = normalizeNameInput(raw);
  if (!name) return { ok: false, reason: "empty" };
  if (looksLikeEmail(name)) return { ok: false, reason: "email" };
  if ([...name].length > DISPLAY_NAME_MAX) return { ok: false, reason: "too_long" };
  return { ok: true, name };
}

/** A stored or provider name, cut to the limit instead of refused. */
function usableName(raw: string | null | undefined): string | null {
  const name = normalizeNameInput(raw);
  if (!name || looksLikeEmail(name)) return null;
  const chars = [...name];
  if (chars.length <= DISPLAY_NAME_MAX) return name;
  return chars.slice(0, DISPLAY_NAME_MAX).join("").trim();
}

function firstLetter(raw: string | null | undefined): string | null {
  const first = [...normalizeNameInput(raw)][0];
  if (!first || !/\p{L}/u.test(first)) return null;
  return first.toLocaleUpperCase();
}

/**
 * The name Clerk holds (sign-up form, Apple at the first sign-in, Google). The first name is
 * what people see; the last name only gives its initial, for two people of one name.
 */
export function nameFromProvider(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): { displayName: string | null; lastNameInitial: string | null } {
  const first = usableName(firstName);
  if (first) {
    return { displayName: first, lastNameInitial: firstLetter(lastName) };
  }
  return { displayName: usableName(lastName), lastNameInitial: null };
}

const NAME_TOKEN = /^\p{L}{2,20}$/u;
const VOWEL = /[aeiouyąęóàáâãäåæèéêëìíîïòôõöøùúûüýÿœůěаеёиоуыэюяіїєў]/iu;
/** Start of an address that is a role, not a person. */
const NOT_A_NAME = new Set([
  "admin",
  "biuro",
  "contact",
  "email",
  "hello",
  "info",
  "kangur",
  "kontakt",
  "mail",
  "noreply",
  "office",
  "pomoc",
  "sales",
  "shop",
  "sklep",
  "support",
  "team",
  "test",
  "user",
]);

/**
 * `kasia.nowak@gmail.com` gives "Kasia". Letters only, with a vowel, so that random strings
 * and addresses with digits give nothing. Never from an Apple relay address.
 */
export function nameFromEmail(email: string | null | undefined): string | null {
  if (!email || isPrivateRelayEmail(email)) return null;
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._+-]/)[0] ?? "";
  if (!NAME_TOKEN.test(first) || !VOWEL.test(first)) return null;
  if (NOT_A_NAME.has(first.toLowerCase())) return null;
  const [head = "", ...rest] = [...first];
  return head.toLocaleUpperCase() + rest.join("").toLocaleLowerCase();
}

/** What other people see, or null when they should see the fallback word. */
export function resolveDisplayName(user: {
  displayName?: string | null;
  email?: string | null;
}): string | null {
  return usableName(user.displayName) ?? nameFromEmail(user.email);
}

export type NamedPerson = {
  userId: string;
  /** From resolveDisplayName; null shows the fallback word. */
  name: string | null;
  lastNameInitial?: string | null;
  joinedAt: Date;
};

export type NameWords = {
  /** "Domownik" in the viewer's language. */
  fallback: string;
  /** "od 12 listopada" in the viewer's language. */
  since: (joinedAt: Date) => string;
};

const sameName = (name: string) => name.toLocaleLowerCase();

/**
 * Labels for everyone in one workspace. Two people of one name get the initial of the last
 * name ("Kasia N.") or, without it, the day they joined ("Kasia · od 12 listopada").
 * Never an e-mail address.
 */
export function labelPeople(
  people: readonly NamedPerson[],
  words: NameWords,
): Map<string, string> {
  const base = new Map(people.map((p) => [p.userId, p.name ?? words.fallback]));
  const groups = new Map<string, NamedPerson[]>();
  for (const person of people) {
    const key = sameName(base.get(person.userId) ?? "");
    groups.set(key, [...(groups.get(key) ?? []), person]);
  }

  const labels = new Map<string, string>();
  for (const group of groups.values()) {
    for (const person of group) {
      const name = base.get(person.userId) ?? words.fallback;
      if (group.length === 1) {
        labels.set(person.userId, name);
        continue;
      }
      const initial = firstLetter(person.lastNameInitial);
      const initialIsUnique =
        initial !== null &&
        group.filter((other) => firstLetter(other.lastNameInitial) === initial).length === 1;
      labels.set(
        person.userId,
        initialIsUnique ? `${name} ${initial}.` : `${name} · ${words.since(person.joinedAt)}`,
      );
    }
  }
  return labels;
}
