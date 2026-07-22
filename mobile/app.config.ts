import type { ConfigContext, ExpoConfig } from "expo/config";

function shortCommit(): string | undefined {
  const raw =
    process.env.EAS_BUILD_GIT_COMMIT_HASH?.trim() ||
    process.env.EXPO_PUBLIC_GIT_COMMIT?.trim() ||
    "";
  if (!raw) return undefined;
  return raw.slice(0, 7);
}

function appEnv(): string {
  return (
    process.env.EXPO_PUBLIC_APP_ENV?.trim() ||
    (process.env.NODE_ENV === "production" ? "production" : "development")
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Kangur",
  slug: "kangur",
  owner: "chris38pl",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "kangur",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "app.kangur.mobile",
    usesAppleSignIn: true,
  },
  android: {
    package: "app.kangur.mobile",
    // Expo Config types lag behind; required for LAN HTTP in development APKs.
    // @ts-expect-error Android.usesCleartextTraffic not in ExpoConfig typings yet
    usesCleartextTraffic: true,
    adaptiveIcon: {
      backgroundColor: "#DFF5EF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
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
    "expo-dev-client",
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
        // Warn-only: missing auth token must not fail EAS builds.
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
    appEnv: appEnv(),
    gitCommit: shortCommit(),
  },
});
