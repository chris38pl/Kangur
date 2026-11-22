import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { createBillingPortal } from "./api";

const APPLE_MANAGE_SUBSCRIPTIONS_URL =
  "https://apps.apple.com/account/subscriptions";
const GOOGLE_MANAGE_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions";

/**
 * Opens the place where a workspace subscription is cancelled, chosen by the
 * provider the backend reports (not by this device's platform: an App Store
 * subscription can block deleting a workspace on Android too).
 */
export async function openSubscriptionManagement(input: {
  provider: "apple" | "google" | "stripe";
  workspaceId: string;
  getToken: () => Promise<string | null>;
}): Promise<void> {
  if (input.provider === "apple") {
    await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
    return;
  }
  if (input.provider === "google") {
    await Linking.openURL(GOOGLE_MANAGE_SUBSCRIPTIONS_URL);
    return;
  }
  const token = await input.getToken();
  if (!token) throw new Error("Missing Clerk token");
  const portal = await createBillingPortal(token, input.workspaceId);
  await WebBrowser.openBrowserAsync(portal.url);
}
