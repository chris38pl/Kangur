import { LEGAL_ENTITY } from "@/lib/marketing/legal-entity";
import { APP_LOCALE_IDS, withLocale, type AppLocale } from "@/lib/marketing/locale";
import { pageMeta } from "@/lib/marketing/page-meta";
import { PROFILES } from "@/lib/marketing/profiles";
import { plainText } from "@/lib/marketing/rich-text";
import type { TopicCopy } from "@/lib/marketing/content/topics/types";
import { ROUTES, routeHref, type MarketingRouteId } from "@/lib/marketing/routes";
import { screensFor } from "@/lib/marketing/screens";
import { ogImage } from "@/lib/marketing/seo";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  SITE_URL,
  absoluteUrl,
} from "@/lib/marketing/site";

type Node = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;

/** Says out loud what search engines confuse us with. */
const DISAMBIGUATION: Record<"pl" | "en", string> = {
  pl: "Aplikacja na telefon do list zakupów. Nie jest konkursem matematycznym ani programem do zdalnego pulpitu.",
  en: "A phone app for grocery lists. Not a maths contest and not a remote desktop program.",
};

const graph = (...nodes: Node[]): Node => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

function organization(): Node {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Kangur",
    legalName: LEGAL_ENTITY.firmName,
    // The same person signs the stores under these names.
    alternateName: ["Krzysztof Krawiec Labs", "getkangur"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon-512.png"),
      width: 512,
      height: 512,
    },
    email: LEGAL_ENTITY.supportEmail,
    founder: { "@type": "Person", name: "Krzysztof Krawiec" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "ul. Sielawy 23e/19",
      postalCode: "61-619",
      addressLocality: "Poznań",
      addressCountry: "PL",
    },
    vatID: `PL${LEGAL_ENTITY.nip}`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: LEGAL_ENTITY.supportEmail,
      availableLanguage: ["pl", "en"],
    },
    sameAs: PROFILES.map((profile) => profile.url),
  };
}

function website(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    // Google takes the site name from here, in this order of preference.
    name: "Kangur",
    alternateName: ["Kangur - lista zakupów", "getkangur.com"],
    inLanguage: [...APP_LOCALE_IDS],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** The app itself. No ratings or user counts: the fact bank does not back any. */
function app(locale: AppLocale): Node {
  const { title, description } = pageMeta("home", locale);
  const screens = screensFor(locale);
  return {
    "@type": "MobileApplication",
    "@id": APP_ID,
    name: "Kangur",
    alternateName: [title, "Kangur - lista zakupów z AI"],
    description,
    disambiguatingDescription: DISAMBIGUATION[locale === "pl" ? "pl" : "en"],
    url: absoluteUrl(withLocale(locale, "/")),
    image: absoluteUrl(ogImage("home", locale).url),
    screenshot: [screens.import, screens.aisle, screens.meal].map((screen) =>
      absoluteUrl(screen.src),
    ),
    applicationCategory: "ShoppingApplication",
    applicationSubCategory: "Grocery list",
    operatingSystem: "iOS, Android",
    inLanguage: [...APP_LOCALE_IDS],
    installUrl: [APP_STORE_URL, PLAY_STORE_URL],
    sameAs: [APP_STORE_URL, PLAY_STORE_URL],
    offers: [
      {
        "@type": "Offer",
        name: "Kangur",
        price: "0",
        priceCurrency: "PLN",
      },
      ...(locale === "pl"
        ? [
            {
              "@type": "Offer",
              name: "Kangur Premium",
              price: "9.99",
              priceCurrency: "PLN",
              eligibleRegion: { "@type": "Country", name: "PL" },
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: "9.99",
                priceCurrency: "PLN",
                unitCode: "MON",
              },
            },
          ]
        : []),
    ],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

function webPage(
  id: MarketingRouteId,
  locale: AppLocale,
  type = "WebPage",
): Node {
  const { title, description } = pageMeta(id, locale);
  const url = absoluteUrl(routeHref(id, locale));
  return {
    "@type": type,
    "@id": `${url}#page`,
    url,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": APP_ID },
    publisher: { "@id": ORGANIZATION_ID },
    dateModified: ROUTES[id].updatedAt,
  };
}

/** Home page: who makes Kangur, the site, and the app with both store links. */
export function homeStructuredData(locale: AppLocale): Node {
  return graph(organization(), website(), app(locale), webPage("home", locale));
}

const PAGE_TYPES: Partial<Record<MarketingRouteId, string>> = {
  about: "AboutPage",
  contact: "ContactPage",
  guides: "CollectionPage",
};

/** Pages about the app: the page, plus everything it refers to. */
export function pageStructuredData(
  id: MarketingRouteId,
  locale: AppLocale,
): Node {
  return graph(
    webPage(id, locale, PAGE_TYPES[id]),
    organization(),
    website(),
    app(locale),
  );
}

/** Guides: who wrote it and when it last changed. */
function article(id: MarketingRouteId, locale: AppLocale, copy: TopicCopy): Node {
  const url = absoluteUrl(routeHref(id, locale));
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: plainText([copy.eyebrow, ...copy.lines].join(". ").replace(/\.\./g, ".")).slice(0, 110),
    description: pageMeta(id, locale).description,
    image: absoluteUrl(ogImage(id, locale).url),
    inLanguage: locale,
    datePublished: ROUTES[id].publishedAt,
    dateModified: ROUTES[id].updatedAt,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: { "@id": `${url}#page` },
  };
}

/** The free tool that runs in the browser. */
function webTool(id: MarketingRouteId, locale: AppLocale): Node {
  const { title, description } = pageMeta(id, locale);
  const url = absoluteUrl(routeHref(id, locale));
  return {
    "@type": "WebApplication",
    "@id": `${url}#tool`,
    name: title,
    description,
    url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Landing pages, the tool and guides: the page, what it is, and its questions. */
export function topicStructuredData(
  id: MarketingRouteId,
  locale: AppLocale,
  copy: TopicCopy,
  faq: readonly { q: string; a: string }[],
): Node[] {
  return [
    graph(
      webPage(id, locale, PAGE_TYPES[id]),
      ...(ROUTES[id].publishedAt ? [article(id, locale, copy)] : []),
      ...(id === "aisleTool" ? [webTool(id, locale)] : []),
      organization(),
      website(),
      app(locale),
    ),
    ...(faq.length ? [faqStructuredData(faq, locale)] : []),
  ];
}

/** Google shows no FAQ results since 2026, but the pairs still explain the page. */
export function faqStructuredData(
  items: readonly { q: string; a: string }[],
  locale: AppLocale,
): Node {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: plainText(a) },
    })),
  };
}
