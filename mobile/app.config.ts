import type { ConfigContext, ExpoConfig } from "expo/config";

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

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = appEnv();
  const isDevApp = env === "development";

  return {
    ...config,
    name: isDevApp ? "Kangur DEV" : "Kangur",
    slug: "kangur",
    owner: "chris38pl",
    version: "1.0.1",
    orientation: "portrait",
    icon: isDevApp
      ? "./assets/images/icon-dev.png"
      : "./assets/images/icon.png",
    scheme: isDevApp ? "kangur-dev" : "kangur",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDevApp ? "app.kangur.dev" : "app.kangur",
      usesAppleSignIn: true,
    },
    android: {
      package: isDevApp ? "app.kangur.dev" : "app.kangur",
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
      permissions: ["android.permission.RECORD_AUDIO"],
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
      "expo-localization",
      "expo-secure-store",
      "expo-notifications",
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
