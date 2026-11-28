import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * iOS reads the app's languages from the binary, not from our JS catalogs.
 * Without this list the App Store shows "English" only and iOS keeps system
 * UI (permission prompts, pickers, Sign in with Apple) in English.
 *
 * Same ids as shared/locales.ts, which the config loader cannot import;
 * `pnpm test:locales` (backend) keeps the two in sync.
 * `native-locales/{id}.json` holds the translated permission prompts; English
 * stays in the plugin options below.
 */
const IOS_LANGUAGES = ["en", "pl", "de", "ru", "uk", "fr", "es", "it", "cs", "be"];

const IOS_LOCALIZED_STRINGS = Object.fromEntries(
  IOS_LANGUAGES.filter((id) => id !== "en").map((id) => [
    id,
    `./native-locales/${id}.json`,
  ]),
);

function shortCommit(): string | undefined {
  const raw =
    process.env.EAS_BUILD_GIT_COMMIT_HASH?.trim() ||
    process.env.EXPO_PUBLIC_GIT_COMMIT?.trim() ||
    "";
  if (!raw) return undefined;
  return raw.slice(0, 7);
}

function appEnv(): "development" | "preview" | "production" {
  const raw = process.env.EXPO_PUBLIC_APP_ENV?.trim();
  if (raw === "preview" || raw === "production" || raw === "development") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/**
 * Invitation links of the site open the app right away (Universal Links, App Links), when
 * the site vouches for it: backend/app/.well-known. Only the www host, which every link we
 * make uses: the bare domain redirects, and neither Apple nor Android follow a redirect
 * there. The development build keeps the browser, so a store app on the same phone wins.
 */
const SITE_HOST = "www.getkangur.com";

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = appEnv();
  const isDevApp = env === "development";

  return {
    ...config,
    name: isDevApp ? "Kangur DEV" : "Kangur",
    slug: "kangur",
    owner: "chris38pl",
    // The server tells app versions apart by this (X-Kangur-App-Version).
    version: "1.0.9",
    orientation: "portrait",
    icon: isDevApp
      ? "./assets/images/icon-dev.png"
      : "./assets/images/icon.png",
    scheme: isDevApp ? "kangur-dev" : "kangur",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: false,
      icon: isDevApp
        ? "./assets/images/icon-dev.png"
        : "./assets/images/icon-ios.png",
      bundleIdentifier: isDevApp ? "app.kangur.dev" : "app.kangur",
      usesAppleSignIn: true,
      associatedDomains: isDevApp ? [] : [`applinks:${SITE_HOST}`],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    locales: IOS_LOCALIZED_STRINGS,
    android: {
      package: isDevApp ? "app.kangur.dev" : "app.kangur",
      googleServicesFile: "./google-services.json",
      // Expo Config types lag behind; required for LAN HTTP in development APKs.
      // @ts-expect-error Android.usesCleartextTraffic not in ExpoConfig typings yet
      usesCleartextTraffic: isDevApp,
      adaptiveIcon: {
        backgroundColor: "#DFF5EF",
        foregroundImage: isDevApp
          ? "./assets/images/android-icon-foreground-dev.png"
          : "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      intentFilters: isDevApp
        ? []
        : [
            {
              action: "VIEW",
              autoVerify: true,
              data: [
                { scheme: "https", host: SITE_HOST, path: "/invite" },
                { scheme: "https", host: SITE_HOST, pathPattern: "/../invite" },
              ],
              category: ["BROWSABLE", "DEFAULT"],
            },
          ],
      permissions: ["android.permission.RECORD_AUDIO"],
      // The Expo template asks to draw over other apps for the developer overlay. Released
      // builds do not need it, and in Poland it is known as a permission scammers ask for.
      blockedPermissions: isDevApp ? [] : ["android.permission.SYSTEM_ALERT_WINDOW"],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-dev-client",
        {
          // Only DEV registers exp+kangur:// so Metro QR does not open Play build.
          addGeneratedScheme: isDevApp,
        },
      ],
      "expo-apple-authentication",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
        },
      ],
      [
        "expo-localization",
        // iOS only: writes CFBundleLocalizations. Android per-app language
        // would also change build.gradle and the manifest, so it stays off.
        { supportedLocales: { ios: IOS_LANGUAGES } },
      ],
      "expo-secure-store",
      "expo-notifications",
      "expo-iap",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow Kangur to access your photos to import shopping lists.",
          cameraPermission:
            "Allow Kangur to use the camera to capture shopping lists.",
        },
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission:
            "Allow Kangur to use the microphone to dictate shopping list items.",
          speechRecognitionPermission:
            "Allow Kangur to use speech recognition to dictate shopping list items.",
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: process.env.SENTRY_ORG ?? undefined,
          project: process.env.SENTRY_PROJECT ?? undefined,
          // Source-map upload: SENTRY_ORG + SENTRY_PROJECT + SENTRY_AUTH_TOKEN on EAS.
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "8d080cd8-2957-4fc7-99cd-f894cacbc0cd",
      },
      appEnv: env,
      gitCommit: shortCommit(),
    },
  };
};
