/**
 * Feature flag name constants (PostHog + local overrides).
 * Naming: snake_case, positive capability name, no enable_/new_/flag_.
 */

export const FeatureFlags = {
  historySuggestions: "history_suggestions",
  recipeDiscovery: "recipe_discovery",
  mealProposal: "meal_proposal",
  shoppingV2: "shopping_v2",
  premiumPaywall: "premium_paywall",
  appleSignIn: "apple_sign_in",
} as const;

export type FeatureFlagName = (typeof FeatureFlags)[keyof typeof FeatureFlags];
