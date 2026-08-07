import { Platform } from "react-native";
import type { PlatformBillingChannel } from "@shared/billing";

import type {
  MobileBillingProvider,
  ProviderResolveInfo,
} from "./types";
import { AppleMobileBillingProvider } from "./providers/apple";
import { GoogleMobileBillingProvider } from "./providers/google";
import { StripeMobileBillingProvider } from "./providers/stripe";

/**
 * Client channel for BillingRegistry.
 * Android → google (Play). iOS → apple (stub). Web → stripe.
 */
export function resolveClientBillingChannel(): PlatformBillingChannel {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  return "web";
}

const providers: Record<
  "google" | "apple" | "stripe",
  MobileBillingProvider
> = {
  google: new GoogleMobileBillingProvider(),
  apple: new AppleMobileBillingProvider(),
  stripe: new StripeMobileBillingProvider(),
};

export const MobileBillingRegistry = {
  resolve(providerId: "google" | "apple" | "stripe"): MobileBillingProvider {
    return providers[providerId];
  },

  resolveCurrent(): MobileBillingProvider {
    const channel = resolveClientBillingChannel();
    switch (channel) {
      case "android":
        return providers.google;
      case "ios":
        return providers.apple;
      case "web":
        return providers.stripe;
      default: {
        const _exhaustive: never = channel;
        return _exhaustive;
      }
    }
  },

  decisionTree(): ProviderResolveInfo {
    const channel = resolveClientBillingChannel();
    const provider = this.resolveCurrent();
    return {
      platform: Platform.OS,
      channel,
      providerId: provider.id,
      why: `Platform=${Platform.OS} → Channel=${channel} → Provider=${provider.id}`,
    };
  },
};
