import type { Href } from "expo-router";

/**
 * Entry points that open the Premium screen. Sent as `paywall_viewed.source`
 * so the funnel shows which moment sells (marketing start, 1.0.8).
 */
export type PremiumSource =
  | "first_win"
  | "credits_exhausted"
  | "home_credits"
  | "list_credits"
  | "list_limit"
  | "history_hint"
  | "history_limit"
  | "profile"
  | "menu";

export function premiumHref(
  source: PremiumSource,
  extra?: Record<string, string>,
): Href {
  return { pathname: "/premium", params: { source, ...extra } };
}
