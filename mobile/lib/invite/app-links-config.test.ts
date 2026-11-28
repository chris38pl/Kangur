/**
 * The phone opens the app for exactly the invitation paths the site vouches for: Android's
 * intent filter (app.config.ts) and the paths in apple-app-site-association
 * (backend/lib/marketing/appLinks.ts) must not drift apart.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { APP_LINK_PATHS } from "../../../backend/lib/marketing/appLinks.ts";
import appConfig from "../../app.config.ts";
import { inviteTokenFromUrl } from "./invite-url.ts";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde";

type IntentData = { scheme?: string; host?: string; path?: string; pathPattern?: string };

function storeConfig() {
  const before = process.env.EXPO_PUBLIC_APP_ENV;
  process.env.EXPO_PUBLIC_APP_ENV = "production";
  try {
    return appConfig({ config: {} } as never);
  } finally {
    if (before === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
    else process.env.EXPO_PUBLIC_APP_ENV = before;
  }
}

describe("app links", () => {
  it("Android catches every path of apple-app-site-association", () => {
    const config = storeConfig();
    const data = (config.android?.intentFilters ?? []).flatMap(
      (filter) => (filter.data ?? []) as IntentData[],
    );
    for (const path of APP_LINK_PATHS) {
      const wanted = path.includes("*")
        ? { pathPattern: path.replace("*", "..") }
        : { path };
      assert.ok(
        data.some(
          (entry) =>
            entry.scheme === "https" &&
            entry.host === "www.getkangur.com" &&
            (("path" in wanted && entry.path === wanted.path) ||
              ("pathPattern" in wanted && entry.pathPattern === wanted.pathPattern)),
        ),
        `missing ${path}`,
      );
    }
    assert.deepEqual(config.ios?.associatedDomains, ["applinks:www.getkangur.com"]);
  });

  it("the app reads the token on each of those paths", () => {
    for (const path of APP_LINK_PATHS) {
      const real = path.replace("*", "en");
      assert.equal(inviteTokenFromUrl(`https://www.getkangur.com${real}#t=${TOKEN}`), TOKEN, real);
    }
  });
});
