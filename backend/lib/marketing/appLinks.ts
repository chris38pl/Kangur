/**
 * The site vouches for the app, so a tap on an invitation link (or a scanned code) opens
 * Kangur right away instead of this page: Universal Links on iOS, App Links on Android.
 * Only the invitation page: everything else on the site stays in the browser.
 * Served at /.well-known/apple-app-site-association and /.well-known/assetlinks.json.
 */

/** Apple Team ID (App Store Connect) + bundle id of the store app (mobile/app.config.ts). */
export const APPLE_APP_IDS = ["3BLB2XGU95.app.kangur"] as const;

/** Package of the store app (mobile/app.config.ts). The development build stays out. */
export const ANDROID_PACKAGE = "app.kangur";

/**
 * SHA-256 of the Google Play app signing key (Play Console → Kangur → App integrity →
 * App signing key certificate, read 28 XI 2026). Every build from the store and from the
 * Play test tracks carries it; the EAS upload key does not need to be here. An empty list
 * would make the file list nothing, and Android open the links in the browser.
 */
export const ANDROID_CERT_SHA256: readonly string[] = [
  "C2:8C:68:A2:EA:E8:A6:0D:57:95:49:A7:F8:BE:75:3D:E8:C5:C6:0E:9F:D9:62:58:3A:74:6D:B1:88:0B:F0:57",
];

/** `/invite` and the same page in other languages (`/en/invite`). The token is after "#". */
export const APP_LINK_PATHS = ["/invite", "/*/invite"] as const;

const FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function isCertFingerprint(value: string): boolean {
  return FINGERPRINT.test(value);
}

export function appleAppSiteAssociation() {
  return {
    applinks: {
      details: [
        {
          appIDs: [...APPLE_APP_IDS],
          components: APP_LINK_PATHS.map((path) => ({
            "/": path,
            comment: "Invitation page; the token rides after #",
          })),
        },
      ],
    },
  };
}

export function assetLinks(fingerprints: readonly string[] = ANDROID_CERT_SHA256) {
  const valid = fingerprints.filter(isCertFingerprint);
  if (valid.length === 0) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: valid,
      },
    },
  ];
}
