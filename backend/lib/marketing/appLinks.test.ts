import assert from "node:assert/strict";
import test from "node:test";

import {
  ANDROID_CERT_SHA256,
  ANDROID_PACKAGE,
  appleAppSiteAssociation,
  assetLinks,
  isCertFingerprint,
} from "@/lib/marketing/appLinks";

test("assetlinks.json vouches for the store app with the Play signing key", () => {
  assert.ok(ANDROID_CERT_SHA256.length > 0);
  for (const fingerprint of ANDROID_CERT_SHA256) {
    assert.equal(isCertFingerprint(fingerprint), true, fingerprint);
  }
  assert.deepEqual(assetLinks(), [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: [...ANDROID_CERT_SHA256],
      },
    },
  ]);
  assert.equal(ANDROID_PACKAGE, "app.kangur");
});

test("a malformed fingerprint is never published", () => {
  assert.equal(isCertFingerprint("c2:8c:68"), false);
  assert.deepEqual(assetLinks(["C2:8C"]), []);
  assert.deepEqual(assetLinks([]), []);
});

test("apple-app-site-association opens only the invitation page", () => {
  const components = appleAppSiteAssociation().applinks.details[0]!.components;
  assert.deepEqual(
    components.map((component) => component["/"]),
    ["/invite", "/*/invite"],
  );
});
