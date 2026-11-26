import assert from "node:assert/strict";
import test from "node:test";

import { downloadTarget } from "@/lib/marketing/download";
import { appStoreCampaign, appStoreLink, playStoreLink } from "@/lib/marketing/store-links";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
/** TikTok opens links in its own browser. */
const TIKTOK_IPHONE = `${IPHONE} musical_ly_34.1.0 BytedanceWebview/d8a21c6`;

const target = (pathname: string, userAgent: string, search = "") =>
  downloadTarget({ pathname, userAgent, search });

test("the short link opens the store of the phone", () => {
  const ios = target("/pobierz", IPHONE);
  assert.equal(ios?.kind, "store");
  assert.match(ios.kind === "store" ? ios.url : "", /^https:\/\/apps\.apple\.com\//);

  const android = target("/pobierz", ANDROID);
  assert.match(
    android?.kind === "store" ? android.url : "",
    /^https:\/\/play\.google\.com\/store\/apps\/details\?id=app\.kangur/,
  );

  assert.equal(target("/get", TIKTOK_IPHONE)?.kind, "store");
});

test("a computer gets the buttons, in its language", () => {
  assert.deepEqual(target("/pobierz", DESKTOP), {
    kind: "site",
    path: "/",
    hash: "#pobierz",
  });
  assert.deepEqual(target("/en/get", DESKTOP), {
    kind: "site",
    path: "/en",
    hash: "#pobierz",
  });
  // Served as Polish by the proxy, whatever the browser prefers.
  assert.deepEqual(target("/pl/pobierz", DESKTOP), {
    kind: "site",
    path: "/pl",
    hash: "#pobierz",
  });
});

test("the campaign reaches the store", () => {
  const ios = target("/pobierz", IPHONE, "?utm_source=plakat&utm_campaign=wigilia");
  assert.match(ios?.kind === "store" ? ios.url : "", /ct=plakat-wigilia/);

  const android = target("/pobierz", ANDROID, "?utm_source=plakat");
  assert.match(
    android?.kind === "store" ? decodeURIComponent(android.url) : "",
    /referrer=utm_source=plakat/,
  );
});

test("other addresses are not download links", () => {
  assert.equal(target("/", IPHONE), null);
  assert.equal(target("/pobierz-cos", IPHONE), null);
  assert.equal(target("/narzedzia/pobierz", IPHONE), null);
});

test("without a campaign the store learns which page sent the visitor", () => {
  assert.equal(appStoreCampaign({}), "landing");
  assert.equal(appStoreCampaign({}, "cennik"), "landing-cennik");
  assert.equal(appStoreCampaign({ utm_source: "tiktok" }, "cennik"), "tiktok");
  assert.ok(appStoreCampaign({}, "lista-zakupow-na-wigilie-i-swieta").length <= 30);

  const play = new URL(playStoreLink("https://play.google.com/store/apps/details?id=app.kangur", {}, "cennik"));
  assert.equal(
    play.searchParams.get("referrer"),
    "utm_source=landing&utm_medium=website&utm_campaign=cennik",
  );
  assert.match(appStoreLink("https://apps.apple.com/app/apple-store/id1", {}, "cennik"), /ct=landing-cennik/);
});
