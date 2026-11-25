/**
 * Tells Bing, Seznam, Yandex and the other IndexNow engines which pages changed. Copilot
 * and ChatGPT search read Bing, so this is how they hear about a new page the same day.
 * Google does not use IndexNow.
 *
 *   pnpm seo:indexnow            pages changed in the last 7 days, dry run
 *   pnpm seo:indexnow --all      every page, dry run
 *   pnpm seo:indexnow --send     really sends
 *
 * Run by hand after a production deploy. The addresses come from the live sitemap, so
 * nothing that is not public yet can be announced.
 */
const HOST = "www.getkangur.com";
const KEY = "0b02c8f6d75a638c096598977fa14087";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const send = process.argv.includes("--send");
const all = process.argv.includes("--all");
const DAYS = 7;

type Entry = { url: string; lastModified: string };

function parseSitemap(xml: string): Entry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    url: block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "",
    lastModified: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "",
  }));
}

async function main() {
  const sitemap = await fetch(`https://${HOST}/sitemap.xml`);
  if (!sitemap.ok) throw new Error(`sitemap.xml: ${sitemap.status}`);

  const since = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const urlList = parseSitemap(await sitemap.text())
    .filter(({ url }) => url.startsWith(`https://${HOST}`))
    .filter(({ lastModified }) => all || Date.parse(lastModified) >= since)
    .map(({ url }) => url);

  console.log(urlList.join("\n") || "Nothing changed.");
  if (!urlList.length) return;
  if (!send) {
    console.log(`\n${urlList.length} pages. Dry run, add --send to announce them.`);
    return;
  }

  const keyLocation = `https://${HOST}/${KEY}.txt`;
  const key = await fetch(keyLocation);
  if ((await key.text()).trim() !== KEY) throw new Error(`Key file missing: ${keyLocation}`);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation, urlList }),
  });
  console.log(`\nIndexNow: ${response.status} ${response.statusText}`);
  if (!response.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
