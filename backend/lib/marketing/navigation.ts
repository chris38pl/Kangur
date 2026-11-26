import { withLocale, type AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import {
  ROUTES,
  bestHref,
  type MarketingRouteId,
} from "@/lib/marketing/routes";

export type NavLink = { href: string; label: string; hrefLang?: AppLocale };

function page(id: MarketingRouteId, label: string, locale: AppLocale): NavLink {
  const { href, hrefLang } = bestHref(id, locale);
  return { href, label, ...(hrefLang ? { hrefLang } : {}) };
}

/** Header: what a visitor wants to know before installing. */
export function headerLinks(locale: AppLocale): NavLink[] {
  const t = getMessages(locale).nav;
  const how = { href: `${withLocale(locale, "/")}#jak-dziala`, label: t.how };
  const faq = page("faq", t.faq, locale);

  // Languages without their own pricing and safety pages do not send people to English
  // from the top of the page; the footer has those links.
  if (!ROUTES.pricing.paths[locale]) {
    return [how, faq, page("contact", t.contact, locale)];
  }
  return [
    how,
    // Films and tools are Polish only: the narrator speaks Polish.
    ...(locale === "pl"
      ? [page("films", "Filmy", locale), page("tools", t.tools, locale)]
      : []),
    page("pricing", t.pricing, locale),
    page("safety", t.safety, locale),
    faq,
  ];
}

export type FooterGroup = { title: string; links: NavLink[] };

export function footerGroups(locale: AppLocale): FooterGroup[] {
  const t = getMessages(locale).nav;
  return [
    {
      title: "Kangur",
      links: [
        { href: `${withLocale(locale, "/")}#jak-dziala`, label: t.how },
        // The narrator speaks Polish.
        ...(locale === "pl" ? [page("films", "Filmy", locale)] : []),
        page("pricing", t.pricing, locale),
        page("safety", t.safety, locale),
        page("about", t.about, locale),
        ...(locale === "pl" ? [page("press", t.press, locale)] : []),
        page("faq", t.faq, locale),
        page("contact", t.contact, locale),
      ],
    },
    // Polish only, until the same pages exist in other languages.
    ...(locale === "pl"
      ? [
          {
            title: t.lists,
            links: [
              page("sharedList", "Wspólna lista", locale),
              page("photoList", "Ze zdjęcia i zrzutu", locale),
              page("recipeList", "Z przepisu", locale),
              page("aiList", "Z AI", locale),
              page("aisleTool", "Podział listy na alejki", locale),
              page("christmasTool", "Na Wigilię i święta", locale),
              page("weekTool", "Na tydzień", locale),
              page("tools", t.tools, locale),
            ],
          },
        ]
      : []),
    {
      title: t.legal,
      links: [
        page("privacy", t.privacy, locale),
        page("terms", t.terms, locale),
        page("deleteAccount", t.deleteAccount, locale),
      ],
    },
  ];
}
