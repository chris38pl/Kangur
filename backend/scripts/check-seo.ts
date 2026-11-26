/**
 * SEO guard over the built site. Run after `next build`:
 *
 *   pnpm build && pnpm test:seo
 *
 * Reads the prerendered HTML in .next/server/app, so it checks what crawlers get, and
 * fails on anything that silently costs search traffic: a page that stopped being
 * static, a broken internal link, a title Google would cut, a missing hreflang pair...
 */
import fs from "node:fs";
import path from "node:path";

import { APP_LOCALE_IDS, internalPath, type AppLocale } from "@/lib/marketing/locale";
import {
  PATH_ALIASES,
  ROUTES,
  ROUTE_IDS,
  canonicalLocale,
  contentLocales,
  findRouteByPath,
  isIndexed,
  routeHref,
  routePath,
  type MarketingRouteId,
} from "@/lib/marketing/routes";
import { CHRISTMAS } from "@/lib/marketing/lists/christmas";
import { printingIn } from "@/lib/marketing/no-printing";
import { hreflangAlternates } from "@/lib/marketing/seo";
import { IS_PRODUCTION_SITE, PRODUCTION_HOST, SITE_URL, absoluteUrl } from "@/lib/marketing/site";

const APP_DIR = path.resolve(__dirname, "../.next/server/app");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

/** Google cuts titles near 600 px and descriptions near 160 characters. */
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 160;

const errors: string[] = [];
const fail = (where: string, what: string) => errors.push(`${where}: ${what}`);

type Page = {
  id: MarketingRouteId;
  locale: AppLocale;
  href: string;
  html: string;
};

function htmlFile(id: MarketingRouteId, locale: AppLocale): string {
  const target = routePath(id, locale);
  if (!target) throw new Error(`${id} has no page in ${locale}`);
  return path.join(APP_DIR, `${internalPath(locale, target)}.html`);
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

const attr = (tag: string, name: string): string | null => {
  const match = new RegExp(`\\s${name}="([^"]*)"`, "i").exec(tag);
  return match ? decode(match[1]) : null;
};

function tags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function meta(html: string, key: "name" | "property", value: string): string | null {
  const tag = tags(html, "meta").find((t) => attr(t, key) === value);
  return tag ? attr(tag, "content") : null;
}

/** Text a reader sees: no scripts, styles or markup. */
function visibleText(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");
}

// ── Load ─────────────────────────────────────────────────────────────────────
const pages: Page[] = [];
for (const id of ROUTE_IDS) {
  for (const locale of APP_LOCALE_IDS) {
    if (!routePath(id, locale)) continue;
    const file = htmlFile(id, locale);
    const href = routeHref(id, locale);
    if (!fs.existsSync(file)) {
      fail(href, "not prerendered, so every visit runs a function and the CDN keeps nothing");
      continue;
    }
    pages.push({ id, locale, href, html: fs.readFileSync(file, "utf8") });
  }
}

// ── Every page ───────────────────────────────────────────────────────────────
const titles = new Map<string, string>();
const descriptions = new Map<string, string>();

for (const { id, locale, href, html } of pages) {
  const indexed = canonicalLocale(id, locale);
  const isCanonical = indexed === locale;

  const lang = attr(tags(html, "html")[0] ?? "", "lang");
  if (lang !== locale) fail(href, `<html lang="${lang}">, expected "${locale}"`);

  // Title and description
  const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "");
  if (!title) fail(href, "no <title>");
  if ([...title].length > TITLE_MAX) {
    fail(href, `title is ${[...title].length} characters, max ${TITLE_MAX}: ${title}`);
  }
  const description = meta(html, "name", "description") ?? "";
  const length = [...description].length;
  if (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX) {
    fail(href, `description is ${length} characters, want ${DESCRIPTION_MIN}-${DESCRIPTION_MAX}: ${description}`);
  }
  if (isCanonical) {
    const titleKey = `${locale}|${title}`;
    if (titles.has(titleKey)) fail(href, `same title as ${titles.get(titleKey)}`);
    titles.set(titleKey, href);
    const descriptionKey = `${locale}|${description}`;
    if (descriptions.has(descriptionKey)) {
      fail(href, `same description as ${descriptions.get(descriptionKey)}`);
    }
    descriptions.set(descriptionKey, href);
  }

  // Canonical and hreflang. A page kept out of search names no canonical at all.
  const links = tags(html, "link");
  const canonical = links.filter((t) => attr(t, "rel") === "canonical").map((t) => attr(t, "href"));
  const expected = isIndexed(id) ? [absoluteUrl(routeHref(id, indexed))] : [];
  if (JSON.stringify(canonical) !== JSON.stringify(expected)) {
    fail(href, `canonical ${JSON.stringify(canonical)}, expected ${JSON.stringify(expected)}`);
  }
  const alternates = Object.fromEntries(
    links
      .filter((t) => attr(t, "rel") === "alternate" && attr(t, "hrefLang"))
      .map((t) => [attr(t, "hrefLang"), attr(t, "href")]),
  );
  const wanted = Object.fromEntries(
    Object.entries(hreflangAlternates(id) ?? {}).map(([l, h]) => [l, absoluteUrl(h)]),
  );
  if (JSON.stringify(alternates) !== JSON.stringify(wanted)) {
    fail(href, `hreflang ${JSON.stringify(alternates)}, expected ${JSON.stringify(wanted)}`);
  }

  // Indexable, or kept out of search on every host
  if (isIndexed(id)) {
    for (const name of ["robots", "googlebot"]) {
      const value = meta(html, "name", name);
      if (IS_PRODUCTION_SITE && value && /noindex|none/i.test(value)) {
        fail(href, `${name} "${value}" on the production site`);
      }
    }
  } else if (!/noindex/i.test(meta(html, "name", "robots") ?? "")) {
    fail(href, "no robots noindex, so search engines may show this page");
  }

  // Every language of the page is one link away
  const switcher = new Set(
    tags(html, "a")
      .filter((a) => (attr(a, "class") ?? "").includes("mkt-lang-option"))
      .map((a) => attr(a, "href")),
  );
  if (switcher.size !== APP_LOCALE_IDS.length) {
    fail(href, `language switcher has ${switcher.size} links, want ${APP_LOCALE_IDS.length}`);
  }

  // Link preview
  for (const property of ["og:title", "og:description", "og:image", "og:url", "og:locale"]) {
    if (!meta(html, "property", property)) fail(href, `no ${property}`);
  }
  const ogImage = meta(html, "property", "og:image");
  if (ogImage?.startsWith(SITE_URL)) {
    const file = path.join(PUBLIC_DIR, new URL(ogImage).pathname);
    if (!fs.existsSync(file)) fail(href, `og:image does not exist: ${ogImage}`);
  }

  // Headings
  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1 !== 1) fail(href, `${h1} <h1> headings, want exactly one`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  levels.reduce((previous, level) => {
    if (level > previous + 1) fail(href, `heading jumps from h${previous} to h${level}`);
    return level;
  }, 0);

  // Images: a description and a reserved box
  for (const img of tags(html, "img")) {
    const src = attr(img, "src") ?? "";
    if (!/\salt(=|\s|>)/.test(img)) fail(href, `image without alt: ${src}`);
    if (!/\swidth=/.test(img) || !/\sheight=/.test(img)) {
      fail(href, `image without width and height, the page will jump: ${src}`);
    }
  }

  // Films: a file that exists, and the ones with sound get its address only on a tap,
  // because WebKit loads a video it scrolls past even with preload="none"
  for (const video of tags(html, "video")) {
    const muted = /\smuted(=|\s|>)/.test(video);
    const src = attr(video, "src") ?? attr(video, "data-src") ?? "";
    if (!src.startsWith("/") || !fs.existsSync(path.join(PUBLIC_DIR, src))) {
      fail(href, `video file missing: ${src}`);
    }
    if (!muted && (attr(video, "src") !== null || attr(video, "preload") !== "none")) {
      fail(href, `a film with sound can load before anyone taps it: ${src}`);
    }
  }

  // Structured data
  if (id === "home" && !html.includes('"@type":"WebSite"')) fail(href, "no WebSite structured data");
  if (id === "home" && !html.includes('"@type":"MobileApplication"')) fail(href, "no app structured data");
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      const data = JSON.parse(match[1]);
      if (data["@context"] !== "https://schema.org") fail(href, "JSON-LD without schema.org context");
    } catch {
      fail(href, "JSON-LD does not parse");
    }
  }

  // House rules for copy
  const text = visibleText(html);
  if (/[–—]/.test(text)) {
    const at = text.search(/[–—]/);
    fail(href, `en or em dash in copy: "...${text.slice(Math.max(0, at - 30), at + 30)}..."`);
  }
  // Text that only the browser draws is checked in the sources, by no-printing.test.ts.
  const paper = locale === "pl" ? printingIn(text) : null;
  if (paper && !["press", "privacy", "terms"].includes(id)) {
    fail(href, `printing in copy: "...${text.slice(Math.max(0, paper.index - 30), paper.index + 30)}..."`);
  }
  // The street is the owner's home: only the terms and the privacy policy have to name it.
  if (!/^(privacy|terms)$/.test(id) && /Sielawy|61-619/.test(html)) fail(href, "the street address of the company is on the page");
  // Capitals only: "todo" is an ordinary Spanish word.
  if (/\b(TODO|FIXME|Lorem ipsum)\b/.test(text)) fail(href, "placeholder text");

  const mark = /\[\[|\]\]|\*\*/.exec(text);
  if (mark) {
    fail(href, `unrendered mark in copy: "...${text.slice(Math.max(0, mark.index - 30), mark.index + 30)}..."`);
  }

  // Internal links lead to a page, not to a redirect or a 404
  for (const a of tags(html, "a")) {
    const raw = attr(a, "href");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) continue;
    const [target, hash] = raw.split("#");
    const clean = (target || "/").split("?")[0];
    if (/\.[a-z0-9]+$/i.test(clean)) {
      if (!fs.existsSync(path.join(PUBLIC_DIR, clean))) fail(href, `link to a missing file: ${raw}`);
      continue;
    }
    const page = resolveInternal(clean);
    if (!page) {
      fail(href, `broken or redirecting link: ${raw}`);
      continue;
    }
    if (hash && !page.html.includes(`id="${hash}"`)) fail(href, `no #${hash} on ${clean}`);
  }
}

function resolveInternal(href: string): Page | undefined {
  return pages.find((page) => page.href === href);
}

// ── The site as a whole ──────────────────────────────────────────────────────
// A page reached only from an e-mail has nothing to be linked from.
for (const id of ROUTE_IDS.filter(isIndexed)) {
  for (const locale of contentLocales(id)) {
    const href = routeHref(id, locale);
    if (id === "home") continue;
    const linked = pages.some(
      (page) =>
        page.locale === locale &&
        page.href !== href &&
        tags(page.html, "a").some((a) => attr(a, "href") === href),
    );
    if (!linked) fail(href, "orphan: no page in this language links to it");
  }
}

for (const alias of Object.keys(PATH_ALIASES)) {
  if (findRouteByPath(alias)) fail(alias, "is both an alias and a page");
}

// A page built in a language it does not have is a copy under a wrong address.
const prerendered = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../.next/prerender-manifest.json"), "utf8"),
) as { routes: Record<string, unknown> };
const registered = new Set(
  pages.map(({ id, locale }) => internalPath(locale, routePath(id, locale) ?? "/")),
);
for (const route of Object.keys(prerendered.routes)) {
  if (/\.[a-z]+$|^\/_/.test(route)) continue;
  if (!registered.has(route)) fail(route, "prerendered, but not a registered page");
}

const sitemapFile = path.join(APP_DIR, "sitemap.xml.body");
if (!fs.existsSync(sitemapFile)) {
  fail("/sitemap.xml", "not prerendered");
} else {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  const listed = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const expected = ROUTE_IDS.filter(isIndexed).flatMap((id) =>
    contentLocales(id).map((locale) => absoluteUrl(routeHref(id, locale))),
  );
  for (const url of expected) if (!listed.includes(url)) fail("/sitemap.xml", `missing ${url}`);
  for (const url of listed) if (!expected.includes(url)) fail("/sitemap.xml", `unexpected ${url}`);
}

const robotsFile = path.join(APP_DIR, "robots.txt.body");
if (!fs.existsSync(robotsFile)) {
  fail("/robots.txt", "not prerendered");
} else if (/^Disallow:\s*\/\s*$/im.test(fs.readFileSync(robotsFile, "utf8"))) {
  fail("/robots.txt", "blocks the whole site");
}

// The noindex rule of next.config.ts must spare exactly the production host.
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../.next/routes-manifest.json"), "utf8"),
) as {
  headers: {
    missing?: { type: string; value: string }[];
    headers: { key: string; value: string }[];
  }[];
};
const noindexRules = manifest.headers.filter((rule) =>
  rule.headers.some((h) => h.key.toLowerCase() === "x-robots-tag"),
);
if (
  noindexRules.length !== 1 ||
  !noindexRules[0].missing?.some((m) => m.type === "host" && m.value === PRODUCTION_HOST)
) {
  fail("next.config.ts", `X-Robots-Tag must be sent everywhere except ${PRODUCTION_HOST}`);
}

for (const id of ROUTE_IDS) {
  if (Number.isNaN(Date.parse(ROUTES[id].updatedAt))) fail(id, "updatedAt is not a date");
}

/** Every picture and recording named there has to exist. Some load only after a scroll. */
const missing = new Set<string>();
function checkFiles(where: string, source: string) {
  for (const [file] of source.matchAll(/\/(?:img|og)\/[\w./-]+\.(?:avif|webp|png|jpg|svg|mp4)/g)) {
    if (missing.has(file) || fs.existsSync(path.join(PUBLIC_DIR, file))) continue;
    missing.add(file);
    fail(where, `missing file: ${file}`);
  }
}
for (const { href, html } of pages) checkFiles(href, html);

// The tools are useless without JavaScript, and one unknown piece of syntax stops all of it.
const CHUNKS = path.resolve(__dirname, "../.next/static/chunks");
for (const file of fs.existsSync(CHUNKS) ? fs.readdirSync(CHUNKS) : []) {
  if (!file.endsWith(".js")) continue;
  const code = fs.readFileSync(path.join(CHUNKS, file), "utf8");
  checkFiles(file, code);
  if (/[{;}]static\s*\{/.test(code)) fail(file, "class static block: Safari before 16.4 cannot read this file");
  if (/\/[^/\n]*\(\?<[=!][^/\n]*\//.test(code)) fail(file, "regex lookbehind: Safari before 16.4 cannot read this file");
}

// Nobody remembers in November what was written about the last December.
if (new Date() >= new Date(`${CHRISTMAS.year + 1}-10-15`)) {
  console.warn(`The Christmas calculator still talks about ${CHRISTMAS.year}. See docs/deploy.md, "Landing URLs".`);
}

if (errors.length > 0) {
  console.error(`SEO check: ${errors.length} problem(s) on ${pages.length} pages\n`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}
console.log(`SEO check passed: ${pages.length} pages, ${SITE_URL}`);
