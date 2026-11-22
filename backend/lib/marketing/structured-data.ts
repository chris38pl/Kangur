import { isValidElement, type ReactNode } from "react";

import { LEGAL_ENTITY } from "@/lib/marketing/legal-entity";
import { APP_LOCALE_IDS, withLocale, type AppLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";
import { ogImage } from "@/lib/marketing/seo";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  SITE_URL,
  absoluteUrl,
} from "@/lib/marketing/site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;

/**
 * Home page graph: who makes Kangur, the site, and the app with both store links.
 * No ratings or user counts: the fact bank does not back any.
 */
export function homeStructuredData(locale: AppLocale): Record<string, unknown> {
  const t = getMessages(locale);
  const pageUrl = absoluteUrl(withLocale(locale, "/"));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Kangur",
        legalName: LEGAL_ENTITY.firmName,
        url: SITE_URL,
        logo: absoluteUrl("/icon-512.png"),
        email: LEGAL_ENTITY.supportEmail,
        address: {
          "@type": "PostalAddress",
          streetAddress: "ul. Sielawy 23e/19",
          postalCode: "61-619",
          addressLocality: "Poznań",
          addressCountry: "PL",
        },
        vatID: `PL${LEGAL_ENTITY.nip}`,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "Kangur",
        inLanguage: [...APP_LOCALE_IDS],
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "MobileApplication",
        "@id": APP_ID,
        name: "Kangur",
        alternateName: t.meta.homeTitle,
        description: t.meta.homeDescription,
        url: pageUrl,
        image: absoluteUrl(ogImage(locale).url),
        applicationCategory: "ShoppingApplication",
        operatingSystem: "iOS, Android",
        inLanguage: [...APP_LOCALE_IDS],
        installUrl: [APP_STORE_URL, PLAY_STORE_URL],
        sameAs: [APP_STORE_URL, PLAY_STORE_URL],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "PLN",
        },
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/** Plain text of FAQ answers, which are JSX (links, emphasis). */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

export function faqStructuredData(
  items: readonly { q: string; a: ReactNode }[],
  locale: AppLocale,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: textOf(item.a).replace(/\s+/g, " ").trim(),
      },
    })),
  };
}
