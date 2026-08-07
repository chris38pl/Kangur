import type { BillingProviderId, PlatformBillingChannel } from "@shared/billing";

import type { BackendBillingProvider } from "./types";
import { AppleBillingProvider } from "./providers/apple";
import { GooglePlayBillingProvider } from "./providers/google";
import { StripeBillingProvider } from "./providers/stripe";

const providers: Record<BillingProviderId, BackendBillingProvider> = {
  google: new GooglePlayBillingProvider(),
  apple: new AppleBillingProvider(),
  stripe: new StripeBillingProvider(),
};

/**
 * Sole factory for backend billing providers.
 * Not a user choice — channel maps Android→google, iOS→apple, Web→stripe.
 */
export const BillingRegistry = {
  resolve(providerId: BillingProviderId): BackendBillingProvider {
    return providers[providerId];
  },

  resolveCurrent(channel: PlatformBillingChannel): BackendBillingProvider {
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
};

/** @deprecated Use BillingRegistry.resolveCurrent */
export function resolvePlatformProvider(
  channel: PlatformBillingChannel,
): BackendBillingProvider {
  return BillingRegistry.resolveCurrent(channel);
}

/** @deprecated Use BillingRegistry.resolve */
export function getBillingProvider(
  providerId: BillingProviderId,
): BackendBillingProvider {
  return BillingRegistry.resolve(providerId);
}

/** @deprecated Prefer BillingRegistry.resolve per id */
export function listBillingProviders(): BackendBillingProvider[] {
  return Object.values(providers);
}
