import assert from "node:assert/strict";
import test from "node:test";

import { APP_LOCALE_IDS } from "@/lib/marketing/locale";
import {
  ROUTES,
  ROUTE_IDS,
  alternateHref,
  bestHref,
  canonicalLocale,
  contentLocales,
  findRouteByPath,
  routeHref,
  routePath,
} from "@/lib/marketing/routes";
import { decideMarketingRoute, type RoutingInput } from "@/lib/marketing/routing";
import { hreflangAlternates } from "@/lib/marketing/seo";

const CHROME_PL = "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7";
const CHROME_EN = "en-US,en;q=0.9";
const CHROME_DE = "de-DE,de;q=0.9,en;q=0.8";
const GOOGLEBOT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/** Short form: `200 /pl/faq` is a rewrite, `307 /en` a redirect, `next` untouched. */
function decide(pathname: string, rest: Omit<RoutingInput, "pathname"> = {}): string {
  const d = decideMarketingRoute({ pathname, ...rest });
  if (d.kind === "next") return "next";
  if (d.kind === "rewrite") return `200 ${d.path}`;
  return `${d.status} ${d.path}`;
}

/** Follows redirects the way a browser does and returns the language of the last page. */
function languageOf(pathname: string, visitor: Omit<RoutingInput, "pathname"> = {}): string {
  let path = pathname;
  for (let hop = 0; hop < 5; hop += 1) {
    const d = decideMarketingRoute({ pathname: path, ...visitor });
    if (d.kind === "rewrite") return d.path.split("/")[1];
    if (d.kind === "next") return path.split("/")[1];
    path = d.path;
  }
  throw new Error("redirect loop from " + pathname);
}

test("a URL without a prefix answers in Polish, with no redirect", () => {
  assert.equal(decide("/"), "200 /pl");
  assert.equal(decide("/faq"), "200 /pl/faq");
  assert.equal(decide("/", { acceptLanguage: CHROME_PL }), "200 /pl");
  assert.equal(decide("/terms", { acceptLanguage: CHROME_PL }), "200 /pl/terms");
});

test("Googlebot gets Polish whatever headers or cookies it carries", () => {
  // The bug fixed on 2026-11-25: crawlers were sent to English with a 307.
  assert.equal(decide("/", { userAgent: GOOGLEBOT }), "200 /pl");
  assert.equal(
    decide("/", { userAgent: GOOGLEBOT, acceptLanguage: CHROME_EN }),
    "200 /pl",
  );
  assert.equal(
    decide("/faq", { userAgent: GOOGLEBOT, cookieLocale: "de" }),
    "200 /pl/faq",
  );
});

test("link previews and AI crawlers get Polish too", () => {
  for (const userAgent of [
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20.0",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
    "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  ]) {
    assert.equal(
      decide("/", { userAgent, acceptLanguage: CHROME_EN }),
      "200 /pl",
      userAgent,
    );
  }
});

test("a browser in another language goes to that language, temporarily", () => {
  assert.equal(decide("/", { acceptLanguage: CHROME_EN }), "307 /en");
  assert.equal(decide("/", { acceptLanguage: CHROME_DE }), "307 /de");
  assert.equal(decide("/contact", { acceptLanguage: CHROME_DE }), "307 /de/contact");
  // Links in the app have no prefix; an English phone must get English terms.
  assert.equal(decide("/terms", { acceptLanguage: CHROME_EN }), "307 /en/terms");
  // Pages without a German body keep the German navigation around English text.
  assert.equal(decide("/faq", { acceptLanguage: CHROME_DE }), "307 /de/faq");
});

test("a browser with no language of ours gets English", () => {
  assert.equal(decide("/", { acceptLanguage: "sv-SE,sv;q=0.9" }), "307 /en");
});

test("a client that accepts any language gets Polish", () => {
  // Node fetch and some crawlers send only this.
  assert.equal(decide("/", { acceptLanguage: "*" }), "200 /pl");
  assert.equal(decide("/faq", { acceptLanguage: "*;q=0.5" }), "200 /pl/faq");
  assert.equal(decide("/", { acceptLanguage: "en-US,en;q=0.9,*;q=0.1" }), "307 /en");
});

test("the visitor's own choice beats the browser", () => {
  assert.equal(
    decide("/", { cookieLocale: "pl", acceptLanguage: CHROME_EN }),
    "200 /pl",
  );
  assert.equal(
    decide("/", { cookieLocale: "fr", acceptLanguage: CHROME_PL }),
    "307 /fr",
  );
  assert.equal(
    decide("/", { cookieLocale: "klingon", acceptLanguage: CHROME_PL }),
    "200 /pl",
  );
});

test("the old /pl addresses move for good", () => {
  assert.equal(decide("/pl"), "308 /");
  assert.equal(decide("/pl/faq"), "308 /faq");
  assert.equal(decide("/pl/faq", { userAgent: GOOGLEBOT, acceptLanguage: CHROME_EN }), "308 /faq");
  assert.equal(decide("/pl/nie-ma"), "308 /nie-ma");
});

test("an explicit Polish link always ends in Polish", () => {
  // The bio link is /pl?utm_..., and phones set to English or Ukrainian open it too.
  for (const visitor of [
    {},
    { acceptLanguage: CHROME_PL },
    { acceptLanguage: CHROME_EN },
    { acceptLanguage: "uk-UA,uk;q=0.9,en;q=0.8" },
    { acceptLanguage: "sv-SE" },
    { acceptLanguage: CHROME_PL, cookieLocale: "en" },
    { userAgent: GOOGLEBOT },
  ]) {
    for (const path of ["/pl", "/pl/terms", "/pl/faq"]) {
      assert.equal(languageOf(path, visitor), "pl", path + " " + JSON.stringify(visitor));
    }
  }
});

test("links clicked on the site are never second-guessed", () => {
  // Polski in the switcher, also in a new tab and with cookies off.
  const visitor = { acceptLanguage: CHROME_EN, sameOrigin: true };
  assert.equal(decide("/", visitor), "200 /pl");
  assert.equal(decide("/faq", visitor), "200 /pl/faq");
  assert.equal(decide("/faq", { ...visitor, cookieLocale: "en" }), "200 /pl/faq");
  assert.equal(decide("/en/faq", visitor), "next");
});

test("prefixed languages are served as they are", () => {
  assert.equal(decide("/en"), "next");
  assert.equal(decide("/de/contact", { acceptLanguage: CHROME_PL }), "next");
  assert.equal(decide("/de/faq"), "next");
  assert.equal(decide("/en/does-not-exist"), "next");
});

test("aliases go straight to the final page in one hop", () => {
  assert.equal(decide("/support"), "308 /contact");
  assert.equal(decide("/pl/support"), "308 /contact");
  assert.equal(decide("/en/support"), "308 /en/contact");
  assert.equal(decide("/kontakt"), "308 /contact");
  assert.equal(decide("/regulamin", { acceptLanguage: CHROME_EN }), "308 /terms");
  assert.equal(decide("/premium"), "308 /cennik");
  assert.equal(decide("/en/premium"), "308 /en/pricing");
});

test("an alias of a translated page follows the visitor, and does not stick", () => {
  assert.equal(decide("/premium", { acceptLanguage: CHROME_EN }), "307 /en/pricing");
  assert.equal(decide("/security", { acceptLanguage: CHROME_DE }), "307 /en/safety");
  assert.equal(decide("/premium", { userAgent: GOOGLEBOT, acceptLanguage: CHROME_EN }), "308 /cennik");
  // No German pricing yet, no English press page yet: both may come.
  assert.equal(decide("/de/premium"), "307 /en/pricing");
  assert.equal(decide("/en/press"), "307 /dla-mediow");
});

test("a Polish address with a foreign slug is still Polish", () => {
  for (const acceptLanguage of [CHROME_PL, CHROME_EN, undefined]) {
    assert.equal(decide("/pl/pricing", { acceptLanguage }), "308 /cennik");
    assert.equal(decide("/pl/safety", { acceptLanguage }), "308 /bezpieczenstwo");
    assert.equal(languageOf("/pl/pricing", { acceptLanguage }), "pl");
    assert.equal(languageOf("/pl/support", { acceptLanguage }), "pl");
    assert.equal(languageOf("/pl/premium", { acceptLanguage }), "pl");
  }
});

test("an unknown address is a 404 where it is, not a redirect", () => {
  assert.equal(decide("/xyz"), "200 /pl/xyz");
  assert.equal(decide("/xyz", { acceptLanguage: CHROME_DE }), "200 /de/xyz");
});

test("no visitor is ever sent in circles", () => {
  const languages = [undefined, "*", "sv", CHROME_PL, CHROME_EN, CHROME_DE, "uk", "be-BY,ru;q=0.8"];
  const cookies = [undefined, ...APP_LOCALE_IDS];
  const paths = ROUTE_IDS.flatMap((id) =>
    APP_LOCALE_IDS.flatMap((locale) => {
      const path = routePath(id, locale);
      return path ? [path, "/" + locale + (path === "/" ? "" : path)] : [];
    }),
  );
  for (const path of new Set([...paths, "/nie-ma", "/pl/nie-ma", "/support", "/de/support"])) {
    for (const acceptLanguage of languages) {
      for (const cookieLocale of cookies) {
        for (const sameOrigin of [false, true]) {
          languageOf(path, { acceptLanguage, cookieLocale, sameOrigin });
        }
      }
    }
  }
});

test("an address with extra slashes cannot leave the site", () => {
  for (const path of ["//evil.example", "/pl//evil.example", "/en//evil.example"]) {
    const d = decideMarketingRoute({ pathname: path });
    if (d.kind !== "next") assert.ok(!d.path.startsWith("//"), path + " -> " + d.path);
  }
});

test("no page redirects to another redirect", () => {
  for (const id of ROUTE_IDS) {
    for (const locale of APP_LOCALE_IDS) {
      if (!routePath(id, locale)) continue;
      const href = routeHref(id, locale);
      const result = decide(href, { acceptLanguage: CHROME_PL });
      assert.ok(
        result === "next" || result.startsWith("200 "),
        `${href} -> ${result}`,
      );
    }
  }
});

test("every path belongs to one page only", () => {
  const owners = new Map<string, string>();
  for (const id of ROUTE_IDS) {
    for (const locale of contentLocales(id)) {
      const href = routeHref(id, locale);
      assert.equal(owners.get(href), undefined, `${href}: ${owners.get(href)} and ${id}`);
      owners.set(href, id);
    }
  }
});

test("hreflang is complete, reciprocal and never points at a redirect", () => {
  for (const id of ROUTE_IDS) {
    const alternates = hreflangAlternates(id);
    const locales = contentLocales(id);
    if (locales.length < 2) {
      assert.equal(alternates, undefined, id);
      continue;
    }
    assert.ok(alternates, id);
    for (const locale of locales) {
      assert.equal(alternates[locale], routeHref(id, locale));
    }
    const expectsDefault = Boolean(ROUTES[id].paths.en);
    assert.equal("x-default" in alternates, expectsDefault, id);
    for (const href of Object.values(alternates)) {
      assert.ok(!decide(href).startsWith("30"), `${id}: ${href}`);
    }
  }
});

test("canonical falls back to English, then to Polish", () => {
  assert.equal(canonicalLocale("faq", "de"), "en");
  assert.equal(canonicalLocale("faq", "pl"), "pl");
  assert.equal(canonicalLocale("home", "de"), "de");
});

test("links never lead to a page that does not exist", () => {
  assert.deepEqual(bestHref("faq", "pl"), { href: "/faq" });
  assert.deepEqual(bestHref("faq", "de"), { href: "/de/faq" });
  assert.equal(alternateHref("contact", "pl"), "/contact");
  assert.equal(alternateHref("contact", "uk"), "/uk/contact");
  assert.equal(alternateHref(null, "pl"), "/");
  assert.equal(alternateHref(null, "fr"), "/fr");
  assert.equal(findRouteByPath("/nie-ma"), null);
});
