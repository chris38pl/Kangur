import { prisma } from "@/lib/prisma";

export type AiOutputLanguage = "pl" | "en";

/** Heuristic: Polish diacritics or common grocery/shopping words. */
export function looksPolish(text: string): boolean {
  if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text)) return true;
  return /\b(mleko|chleb|masło|maslo|jajka|jajko|ser|woda|kup|kupić|kupic|proszę|prosze|lista|zakupy|ziemniaki|jabłka|jablka|pomidory|ogórki|ogorki|kurczak|wołowina|wolowina|ryż|ryz|makaron|kawa|herbata|jogurt|śmietana|smietana|kiełbasa|kielbasa|bez\s+laktozy)\b/i.test(
    text,
  );
}

export async function resolveListOutputLanguage(
  listId: string,
  inputText?: string | null,
): Promise<AiOutputLanguage> {
  if (inputText && looksPolish(inputText)) {
    return "pl";
  }

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
    select: {
      workspace: {
        select: {
          settings: { select: { language: true } },
          members: {
            where: { role: "owner" },
            take: 1,
            select: { user: { select: { locale: true } } },
          },
        },
      },
      items: {
        where: { status: { not: "removed" } },
        take: 12,
        select: { name: true },
      },
    },
  });

  const settingsLang = list?.workspace.settings?.language;
  if (settingsLang === "pl" || settingsLang === "en") {
    return settingsLang;
  }

  const sample = (list?.items ?? []).map((item) => item.name).join(" ");
  if (sample && looksPolish(sample)) {
    return "pl";
  }

  const ownerLocale = list?.workspace.members[0]?.user.locale;
  return ownerLocale === "pl" ? "pl" : "en";
}
