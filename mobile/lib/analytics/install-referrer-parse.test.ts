import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  installSetOnce,
  parseInstallReferrer,
} from "./install-referrer-parse.ts";

describe("parseInstallReferrer", () => {
  it("reads utm keys from a Play referrer", () => {
    assert.deepEqual(
      parseInstallReferrer(
        "utm_source=tiktok&utm_medium=bio&utm_campaign=start30&gclid=abc",
      ),
      { utm_source: "tiktok", utm_medium: "bio", utm_campaign: "start30" },
    );
  });

  it("handles organic Play installs", () => {
    assert.deepEqual(
      parseInstallReferrer("utm_source=google-play&utm_medium=organic"),
      { utm_source: "google-play", utm_medium: "organic" },
    );
  });

  it("decodes a double-encoded referrer and plus signs", () => {
    assert.deepEqual(
      parseInstallReferrer("utm_source%3Dinstagram%26utm_content%3DK-001+reel"),
      { utm_source: "instagram", utm_content: "K-001 reel" },
    );
  });

  it("returns nothing for empty or broken input", () => {
    assert.deepEqual(parseInstallReferrer(null), {});
    assert.deepEqual(parseInstallReferrer(""), {});
    assert.deepEqual(parseInstallReferrer("=x&utm_source="), {});
    assert.deepEqual(parseInstallReferrer("utm_source=%E0%A4%A"), {
      utm_source: "%E0%A4%A",
    });
  });

  it("caps long values", () => {
    const long = "x".repeat(300);
    assert.equal(
      parseInstallReferrer(`utm_campaign=${long}`).utm_campaign?.length,
      100,
    );
  });
});

describe("installSetOnce", () => {
  it("prefixes person properties", () => {
    assert.deepEqual(
      installSetOnce({ utm_source: "tiktok", utm_campaign: "start30" }),
      { install_utm_source: "tiktok", install_utm_campaign: "start30" },
    );
  });
});
