import {
  SITE_DEFAULT_LOCALE,
  internalPath,
  splitLocalePrefix,
  withLocale,
} from "@/lib/marketing/locale";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";
import { appStoreLink, playStoreLink, readUtm } from "@/lib/marketing/store-links";

/** One short address for QR codes, print and video: it opens the store of the phone. */
const DOWNLOAD_PATHS: ReadonlySet<string> = new Set([
  "/pobierz",
  "/get",
  "/download",
]);

export type DownloadTarget =
  | { kind: "store"; url: string }
  /** A computer: the buttons on the home page. */
  | { kind: "site"; path: string; hash: string };

/** Null when the address is not a download link at all. */
export function downloadTarget(input: {
  pathname: string;
  search: string;
  userAgent?: string | null;
}): DownloadTarget | null {
  const { prefix, path } = splitLocalePrefix(input.pathname);
  if (!DOWNLOAD_PATHS.has(path)) return null;

  const utm = readUtm(input.search);
  const userAgent = input.userAgent ?? "";
  if (/Android/i.test(userAgent)) {
    return { kind: "store", url: playStoreLink(PLAY_STORE_URL, utm, "pobierz") };
  }
  // iPadOS calls itself a Mac and gets the buttons, which is fine: the app is for iPhone.
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return { kind: "store", url: appStoreLink(APP_STORE_URL, utm, "pobierz") };
  }
  return {
    kind: "site",
    // `/pl/pobierz` says Polish, so it must not be translated on the way.
    path: prefix ? internalPath(prefix, "/") : withLocale(SITE_DEFAULT_LOCALE, "/"),
    hash: "#pobierz",
  };
}
